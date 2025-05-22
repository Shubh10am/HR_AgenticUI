
import openai
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure the OpenAI API key
# Ensure OPENAI_API_KEY is set in your .env file
openai.api_key = os.getenv("OPENAI_API_KEY")

def generate_reply(email_body: str, model: str = "gpt-3.5-turbo") -> str:
    """
    Generates a professional reply to an email using OpenAI's ChatCompletion API.
    Args:
        email_body: The content of the email to reply to.
        model: The OpenAI model to use (e.g., "gpt-3.5-turbo", "gpt-4").
    Returns:
        A string containing the generated reply.
    Raises:
        Exception: If the OpenAI API call fails.
    """
    if not openai.api_key:
        raise ValueError("OPENAI_API_KEY environment variable not set.")

    try:
        # Using the newer client syntax if you have openai package version >= 1.0.0
        # client = openai.OpenAI()
        # response = client.chat.completions.create(
        # For older versions (like 0.28.x often used in older examples):
        response = openai.ChatCompletion.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful HR assistant. Your task is to generate concise, professional, and courteous email replies. Aim for replies to be between 2 to 4 sentences unless the query specifically requires more detail."},
                {"role": "user", "content": f"Please generate a professional and helpful reply to the following email, keeping it relatively brief (2-4 sentences if possible):\n\n---\n{email_body}\n---"},
            ],
            max_tokens=150, # Adjust as needed, 150 tokens is roughly 100 words
            temperature=0.7, # Balances creativity and determinism
            n=1, # Generate one reply
            stop=None, # Let the model decide when to stop, or specify stop sequences
        )
        # Accessing the reply content depends on the OpenAI library version
        # For openai >= 1.0.0: reply_text = response.choices[0].message.content.strip()
        # For openai < 1.0.0:
        reply_text = response.choices[0].message['content'].strip()
        return reply_text
    except Exception as e:
        print(f"Error generating reply with OpenAI: {e}")
        # Consider re-raising a more specific error or returning a fallback message
        raise Exception(f"OpenAI API error: {e}")

# Example usage (for testing, not part of the API typically)
if __name__ == '__main__':
    test_email_body = "Subject: Question about PTO policy\n\nHi HR Team,\n\nI had a quick question about our company's PTO policy. Can I carry over unused vacation days to the next year?\n\nThanks,\nAn Employee"
    try:
        print(f"Generating reply for: \n{test_email_body}\n")
        reply = generate_reply(test_email_body)
        print(f"Generated Reply:\n{reply}")
    except Exception as e:
        print(f"Test failed: {e}")

    test_email_body_long_request = "Subject: Project Update Needed\n\nHi HR,\n\nCan you provide a detailed update on the 'Employee Wellness Program' initiative? Specifically, I need to know the timeline for the next phase, the key stakeholders involved, the budget allocated, and any potential roadblocks you foresee. This is for the upcoming board meeting presentation.\n\nRegards,\nManagement"
    try:
        print(f"\nGenerating reply for a more detailed request: \n{test_email_body_long_request}\n")
        # For more complex requests, GPT-4 might be better if available and configured.
        # reply = generate_reply(test_email_body_long_request, model="gpt-4") 
        reply = generate_reply(test_email_body_long_request)
        print(f"Generated Reply:\n{reply}")
    except Exception as e:
        print(f"Test failed: {e}")
