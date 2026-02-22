import { json } from '@sveltejs/kit';
import { processQuery } from '$lib/server/engine.js';
import { notify } from '$lib/server/notify.js';
import { PUBLIC_OWNER_NAME } from '$env/static/public';
import { checkRateLimit } from '$lib/server/ratelimit.js';
import { PAPI_API_KEYS } from '$env/static/private';

export async function POST({ request, getClientAddress }) {
	// API Key authentication (if configured)
	if (PAPI_API_KEYS && PAPI_API_KEYS !== 'placeholder') {
		const authHeader = request.headers.get('authorization');
		const providedKey = authHeader?.startsWith('Bearer ') 
			? authHeader.slice(7) 
			: null;
			
		const validKeys = PAPI_API_KEYS.split(',').map(k => k.trim());
		
		if (!providedKey || !validKeys.includes(providedKey)) {
			return json({ error: 'Invalid or missing API key' }, { status: 401 });
		}
	}

	// Rate limiting
	const clientIP = getClientAddress();
	const rateLimit = checkRateLimit(clientIP);
	
	if (!rateLimit.allowed) {
		return json(
			{ error: 'Rate limit exceeded. Try again later.' }, 
			{ 
				status: 429,
				headers: {
					'X-RateLimit-Remaining': '0',
					'X-RateLimit-Reset': String(rateLimit.resetAt)
				}
			}
		);
	}
	
	const { query, name, channel = 'api', metadata = {}, conversation_id } = await request.json();

	if (!query || typeof query !== 'string' || query.trim().length === 0) {
		return json({ error: 'query is required' }, { status: 400 });
	}

	if (query.length > 2000) {
		return json({ error: 'query too long (max 2000 chars)' }, { status: 400 });
	}

	const result = await processQuery({
		query: query.trim(),
		channel,
		senderName: name || null,
		senderId: null,
		metadata,
		conversationId: conversation_id || null,
	});

	// Notify owner for drafts and escalations
	if (result.classification !== 'auto') {
		await notify({
			type: result.classification,
			query: query.trim(),
			response: result.response,
			sender: name,
			channel,
			interactionId: result.interactionId,
		});
	}

	const rateLimitHeaders = {
		'X-RateLimit-Remaining': String(rateLimit.remaining)
	};

	// For auto-responses, return immediately
	// For drafts/escalations, return acknowledgment
	if (result.classification === 'auto') {
		return json({
			response: result.response,
			type: 'auto',
			conversation_id: result.conversation_id,
		}, { headers: rateLimitHeaders });
	}

	return json({
		response: result.classification === 'draft'
			? "Thanks! I've noted your message and will get back to you shortly."
			: `I'll pass this to ${PUBLIC_OWNER_NAME} directly — expect a response soon.`,
		type: result.classification,
		conversation_id: result.conversation_id,
	}, { headers: rateLimitHeaders });
}

// CORS preflight
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
