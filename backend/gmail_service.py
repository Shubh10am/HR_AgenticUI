
import base64
import os
from email.mime.text import MIMEText
from googleapiclient.discovery import build, Resource # Added Resource for type hinting
from google.oauth2.credentials import Credentials as GoogleCredentials # Alias for clarity
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Define the scopes required by the Gmail API
# These should match the scopes requested during OAuth
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.compose']

def get_gmail_service(creds: GoogleCredentials) -> Resource:
    """Builds and returns an authorized Gmail API service object."""
    service = build('gmail', 'v1', credentials=creds)
    return service

def get_latest_email(service: Resource) -> dict | None:
    """Fetches the latest email from the user's inbox (only the first message)."""
    try:
        # Get the list of messages, requesting only the latest one.
        results = service.users().messages().list(userId='me', labelIds=['INBOX'], maxResults=1).execute()
        messages_meta = results.get('messages', [])

        if not messages_meta:
            return None

        # Get the ID of the latest message
        latest_message_id = messages_meta[0]['id']
        
        # Fetch the full message details using the ID
        # 'format': 'full' gets all message details including headers and body
        message = service.users().messages().get(userId='me', id=latest_message_id, format='full').execute()

        headers = message.get('payload', {}).get('headers', [])
        subject = next((header['value'] for header in headers if header['name'].lower() == 'subject'), 'No Subject')
        sender = next((header['value'] for header in headers if header['name'].lower() == 'from'), 'Unknown Sender')
        
        # Extract the email body (prefer text/plain)
        body = ''
        payload = message.get('payload', {})
        
        if 'parts' in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain' and 'data' in part['body']:
                    body_data = part['body']['data']
                    body = base64.urlsafe_b64decode(body_data).decode('utf-8')
                    break
            # Fallback to html if plain text not found (optional, can be complex to parse)
            if not body:
                 for part in payload['parts']:
                    if part['mimeType'] == 'text/html' and 'data' in part['body']:
                        # Basic extraction, real HTML parsing might be needed
                        # body_data = part['body']['data']
                        # body = base64.urlsafe_b64decode(body_data).decode('utf-8') 
                        # For simplicity, we'll stick to finding text/plain mostly.
                        # If you want HTML, you'll need a robust parser.
                        pass # Not implementing HTML parsing here for brevity
        elif 'body' in payload and 'data' in payload['body']:
             # This case is for emails that are not multipart
             body_data = payload['body']['data']
             body = base64.urlsafe_b64decode(body_data).decode('utf-8')

        return {
            'id': latest_message_id,
            'threadId': message.get('threadId'),
            'subject': subject,
            'sender': sender,
            'snippet': message.get('snippet'), # A short part of the message text
            'body': body.strip() # Cleaned body
        }
    except Exception as e:
        print(f"An error occurred while fetching latest email: {e}")
        return None


def create_draft_reply(service: Resource, original_email_id: str, reply_text: str) -> dict | None:
    """Creates a draft reply to a specific email in the same thread."""
    try:
        # Get the original email to extract headers for the reply
        original_message = service.users().messages().get(userId='me', id=original_email_id, format='metadata', metadataHeaders=['Subject', 'From', 'To', 'Message-ID']).execute()
        
        if not original_message:
            print(f"Error: Could not find original message with ID: {original_email_id}")
            return None

        headers = original_message.get('payload', {}).get('headers', [])
        original_subject = next((header['value'] for header in headers if header['name'].lower() == 'subject'), 'No Subject')
        original_sender = next((header['value'] for header in headers if header['name'].lower() == 'from'), None)
        # original_to = next((header['value'] for header in headers if header['name'].lower() == 'To'), None) # Usually you reply to 'From'
        original_message_id_header = next((header['value'] for header in headers if header['name'].lower() == 'message-id'), None)

        if not original_sender:
            print("Error: Could not determine sender of the original email.")
            return None

        # Construct the reply subject
        reply_subject = original_subject
        if not original_subject.lower().startswith('re:'):
            reply_subject = f'Re: {original_subject}'

        # Create the MIME message for the reply
        mime_message = MIMEText(reply_text)
        mime_message['to'] = original_sender # Reply to the sender of the original email
        mime_message['subject'] = reply_subject

        # Set the 'In-Reply-To' and 'References' headers for proper threading
        if original_message_id_header:
             mime_message['In-Reply-To'] = original_message_id_header
             mime_message['References'] = original_message_id_header
        
        # Ensure threadId is from the original message to keep the reply in the same thread
        thread_id = original_message.get('threadId')
        if not thread_id:
            print("Warning: Could not determine threadId from original message. Draft may not be threaded correctly.")
            # Fallback to original_email_id as threadId if message is not part of a thread (first message)
            thread_id = original_email_id 


        raw_message_bytes = mime_message.as_bytes()
        encoded_message = base64.urlsafe_b64encode(raw_message_bytes).decode()

        draft_body = {
            'message': {
                'raw': encoded_message,
                'threadId': thread_id # Important for threading
            }
        }
        
        created_draft = service.users().drafts().create(userId='me', body=draft_body).execute()
        return created_draft

    except Exception as e:
        print(f"An error occurred while creating draft reply: {e}")
        return None

# Example usage (for testing, not part of the API typically)
if __name__ == '__main__':
    # This section would require mock credentials or a way to get them for testing
    print("Gmail Service module. For testing, you'd need valid credentials.")
    # creds = ... get credentials somehow ...
    # service = get_gmail_service(creds)
    # email = get_latest_email(service)
    # if email:
    #     print(f"Latest email: {email['subject']} from {email['sender']}")
    #     draft = create_draft_reply(service, email['id'], "This is a test reply draft from the app.")
    #     if draft:
    #         print(f"Draft created with ID: {draft['id']}")
    # else:
    #     print("No email found or error fetching.")
    pass
