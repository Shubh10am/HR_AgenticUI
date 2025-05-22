
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from google.oauth2.credentials import Credentials as GoogleCredentials

from backend.gmail_service import get_gmail_service, get_latest_email, create_draft_reply
from backend.openai_service import generate_reply as generate_openai_reply
from backend.oauth import get_current_user_credentials

router = APIRouter(
    prefix="/emails",
    tags=["Emails"],
)

class EmailReplyRequest(BaseModel):
    email_body: str

class EmailDraftRequest(BaseModel):
    original_email_id: str
    reply_text: str

@router.get("/latest")
async def fetch_latest_email_endpoint(creds: GoogleCredentials = Depends(get_current_user_credentials)):
    """
    Fetches the latest email from the authenticated user's inbox.
    """
    try:
        service = get_gmail_service(creds)
        email_data = get_latest_email(service)
        if not email_data:
            raise HTTPException(status_code=404, detail="No emails found in the inbox.")
        return email_data
    except HTTPException as http_exc:
        raise http_exc # Re-raise HTTPException to preserve status code and detail
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching latest email: {str(e)}")

@router.post("/generate-reply")
async def generate_email_reply_endpoint(request: EmailReplyRequest):
    """
    Generates a professional email reply using OpenAI based on the provided email body.
    """
    try:
        reply_text = generate_openai_reply(request.email_body)
        return {"generated_reply": reply_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating reply with OpenAI: {str(e)}")

@router.post("/draft")
async def create_email_draft_endpoint(
    request: EmailDraftRequest, 
    creds: GoogleCredentials = Depends(get_current_user_credentials)
):
    """
    Creates a draft reply in Gmail.
    """
    try:
        service = get_gmail_service(creds)
        draft = create_draft_reply(service, request.original_email_id, request.reply_text)
        if not draft:
            raise HTTPException(status_code=500, detail="Failed to create draft in Gmail.")
        return {"message": "Draft created successfully", "draft_id": draft.get('id')}
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating draft: {str(e)}")

