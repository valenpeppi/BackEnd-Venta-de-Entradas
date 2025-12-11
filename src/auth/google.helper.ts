import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (token: string) => {
    try {
        // Try verifying as ID Token first
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        return ticket.getPayload();
    } catch (error) {
        // If ID Token verification fails, try as Access Token
        try {
            const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data; // Returns { sub, email, name, picture, ... } similar to payload
        } catch (innerError) {
            console.error('Error verifying Google token (both ID and Access):', innerError);
            return null;
        }
    }
};
