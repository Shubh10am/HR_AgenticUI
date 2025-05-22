
import os
from dotenv import load_dotenv
from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2.credentials import Credentials as GoogleCredentials # Alias to avoid conflict

load_dotenv()

router = APIRouter()

# In-memory storage for user credentials
# In a real application, this would be a database
user_credentials_store: dict[str, GoogleCredentials] = {}

# Google OAuth2 settings
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

# Scopes required for the application
SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly', # Read emails
    'https://www.googleapis.com/auth/gmail.compose'  # Create drafts, send emails
]

# Ensure client_config is correctly structured for Flow
CLIENT_CONFIG = {
    "web": {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": [REDIRECT_URI]
    }
}

@router.get("/auth", tags=["Authentication"])
async def auth(request: Request):
    """
    Initiates the Google OAuth2 authentication flow.
    Redirects the user to Google's authentication page.
    """
    # Store the original URL or a state parameter if needed for CSRF protection
    # For simplicity, we're not implementing full CSRF protection here
    request.app.state.flow_state = "some_random_state_string" # Example state

    flow = Flow.from_client_config(
        client_config=CLIENT_CONFIG,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )

    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        # prompt='consent' # Optional: force consent screen every time
    )
    
    # Store state in session or similar for verification in callback
    # For this example, let's assume the state is implicitly handled or not strictly verified
    # In a production app, you MUST verify the state parameter.
    # request.session['state'] = state # If using session middleware

    return RedirectResponse(authorization_url)

@router.get("/oauth2callback", tags=["Authentication"])
async def oauth2callback(request: Request, state: str | None = None, code: str | None = None, error: str | None = None):
    """
    Handles the callback from Google after user authentication.
    Fetches the OAuth2 token and stores it.
    """
    if error:
        raise HTTPException(status_code=400, detail=f"Authentication failed: {error}")
    
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code.")

    # Optionally, verify the state parameter here against the one stored previously
    # stored_state = request.app.state.flow_state 
    # if not state or state != stored_state:
    #     raise HTTPException(status_code=400, detail="State mismatch, possible CSRF attack.")

    flow = Flow.from_client_config(
        client_config=CLIENT_CONFIG,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )
    
    try:
        # Use the full URL for fetch_token if your library version requires it
        # For `google-auth-oauthlib` >= 0.5.0, `code` is sufficient.
        # Older versions might need: flow.fetch_token(authorization_response=str(request.url))
        flow.fetch_token(code=code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch token: {str(e)}")

    # Store credentials in our in-memory store
    # For a real app, use a proper user ID system
    user_id = "current_user" 
    user_credentials_store[user_id] = flow.credentials

    return {"message": "Authentication successful! You can now use the email endpoints."}

def get_current_user_credentials(user_id: str = "current_user") -> GoogleCredentials:
    """
    Dependency to get the current user's stored Google credentials.
    Handles token refresh if necessary.
    """
    creds = user_credentials_store.get(user_id)
    if not creds:
        raise HTTPException(
            status_code=401, 
            detail="User not authenticated. Please go to /auth to authenticate."
        )

    if not creds.valid:
        if creds.expired and creds.refresh_token:
            try:
                creds.refresh(GoogleAuthRequest())
                user_credentials_store[user_id] = creds  # Update stored credentials
            except Exception as e:
                # If refresh fails, clear credentials and force re-auth
                user_credentials_store.pop(user_id, None)
                raise HTTPException(
                    status_code=401, 
                    detail=f"Could not refresh access token: {e}. Please re-authenticate via /auth."
                )
        else:
            # No refresh token or not expired but invalid for other reasons
            user_credentials_store.pop(user_id, None)
            raise HTTPException(
                status_code=401, 
                detail="Credentials invalid or expired, and refresh token not available. Please re-authenticate via /auth."
            )
    return creds

