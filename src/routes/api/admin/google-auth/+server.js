import { json, redirect } from '@sveltejs/kit';
import { google } from 'googleapis';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private';
import { PUBLIC_APP_URL } from '$env/static/public';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// GET: start OAuth flow
export async function GET({ url }) {
	const action = url.searchParams.get('action');

	if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'placeholder') {
		return json({ error: 'GOOGLE_CLIENT_ID not configured' }, { status: 400 });
	}

	const oauth2 = new google.auth.OAuth2(
		GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET,
		`${PUBLIC_APP_URL}/api/admin/google-auth?action=callback`
	);

	if (action === 'callback') {
		const code = url.searchParams.get('code');
		if (!code) return json({ error: 'No code received' }, { status: 400 });

		try {
			const { tokens } = await oauth2.getToken(code);
			// Display the refresh token — user needs to copy it to .env
			return json({
				message: 'Success! Copy this refresh token to your .env file as GOOGLE_REFRESH_TOKEN',
				refresh_token: tokens.refresh_token,
				access_token: tokens.access_token,
				expiry_date: tokens.expiry_date,
			});
		} catch (err) {
			return json({ error: err.message }, { status: 500 });
		}
	}

	// Default: generate auth URL
	const authUrl = oauth2.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES,
		prompt: 'consent', // Force refresh token
	});

	return json({ url: authUrl });
}
