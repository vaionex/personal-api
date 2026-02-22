import { json } from '@sveltejs/kit';
import { validateReferral } from '$lib/server/trust.js';

export async function POST({ request }) {
	try {
		const { token } = await request.json();
		
		if (!token) {
			return json({ valid: false, error: 'Token is required' }, { status: 400 });
		}
		
		const result = await validateReferral(token);
		
		if (result.valid) {
			return json({
				valid: true,
				referrer_name: result.referrer_name,
				note: result.note || null,
			});
		} else {
			return json({
				valid: false,
				error: result.reason,
			});
		}
	} catch (error) {
		console.error('Referral validation error:', error);
		return json({ valid: false, error: 'Internal server error' }, { status: 500 });
	}
}

export async function OPTIONS() {
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		},
	});
}