
import { google } from 'googleapis';
import dbConnect from '@/lib/mongodb';
import GoogleApiCredential from '@/models/GoogleApiCredential';
import mongoose from 'mongoose';

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXT_PUBLIC_BASE_URL } = process.env;

// This function creates a new OAuth2 client. It is configured once and can be reused.
function getGoogleAuthClient() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !NEXT_PUBLIC_BASE_URL) {
      throw new Error('Google OAuth credentials or base URL are missing from environment variables.');
  }
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    `${NEXT_PUBLIC_BASE_URL}/api/google-auth/callback`
  );
}


/**
 * Retrieves an authenticated Google API client (like Gmail or Calendar) for a specific user.
 * It fetches the user's tokens from the database and refreshes them if necessary.
 * 
 * @param employeeId The ID of the employee for whom to get the service.
 * @returns An authenticated OAuth2 client instance, or null if credentials are not found or invalid.
 */
export async function getAuthenticatedClient(employeeId: string) {
  await dbConnect();
  
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new Error("Invalid employee ID format for Google service.");
  }

  const credentials = await GoogleApiCredential.findOne({ employeeId });
  if (!credentials) {
    return null; // User has not authenticated with Google
  }
  
  const client = getGoogleAuthClient();

  client.setCredentials({
    access_token: credentials.accessToken,
    refresh_token: credentials.refreshToken,
    expiry_date: credentials.expiryDate,
    scope: credentials.scope,
    token_type: credentials.tokenType,
  });

  // Check if the access token is expired and refresh if needed
  if (new Date(credentials.expiryDate) < new Date()) {
    try {
      const { credentials: newCredentials } = await client.refreshAccessToken();
      if (newCredentials) {
        client.setCredentials(newCredentials);
        // Update the stored credentials with the new ones
        await GoogleApiCredential.updateOne({ employeeId }, {
            accessToken: newCredentials.access_token,
            expiryDate: newCredentials.expiry_date,
            // Refresh token might be updated too
            ...(newCredentials.refresh_token && { refreshToken: newCredentials.refresh_token }),
        });
      }
    } catch (error) {
      console.error("Failed to refresh Google access token for employee:", employeeId, error);
      // If refresh fails, credentials might be revoked.
      await GoogleApiCredential.deleteOne({ employeeId });
      return null;
    }
  }

  return client;
}


/**
 * Creates and returns an authenticated Gmail service instance for a specific user.
 * @param employeeId The ID of the employee for whom to get the service.
 * @returns An authenticated Gmail API client instance, or null if credentials are not found or invalid.
 */
export async function getGmailService(employeeId: string) {
    const authClient = await getAuthenticatedClient(employeeId);
    if (!authClient) return null;
    return google.gmail({ version: 'v1', auth: authClient });
}


/**
 * Creates and returns an authenticated Google Calendar service instance.
 * @param employeeId The ID of the employee.
 * @returns An authenticated Calendar API client, or null if credentials fail.
 */
export async function getCalendarService(employeeId: string) {
    const authClient = await getAuthenticatedClient(employeeId);
    if (!authClient) return null;
    return google.calendar({ version: 'v3', auth: authClient });
}

    