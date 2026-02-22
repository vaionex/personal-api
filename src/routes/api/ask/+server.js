import { json } from '@sveltejs/kit';
import { processQuery } from '$lib/server/engine.js';
import { notifyOwner } from '$lib/server/telegram.js';

export async function POST({ request }) {
	const { query, name, channel = 'api', metadata = {} } = await request.json();

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
	});

	// Notify owner for drafts and escalations
	if (result.classification !== 'auto') {
		await notifyOwner({
			classification: result.classification,
			query: query.trim(),
			response: result.response,
			senderName: name,
			channel,
			interactionId: result.interactionId,
		});
	}

	// For auto-responses, return immediately
	// For drafts/escalations, return acknowledgment
	if (result.classification === 'auto') {
		return json({
			response: result.response,
			type: 'auto',
		});
	}

	return json({
		response: result.classification === 'draft'
			? "Thanks! I've noted your message and will get back to you shortly."
			: "I'll pass this to Robin directly — expect a response soon.",
		type: result.classification,
	});
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
