import { json } from '@sveltejs/kit';
import { processQuery } from '$lib/server/engine.js';
import { notify } from '$lib/server/notify.js';
import { checkRateLimit } from '$lib/server/ratelimit.js';
import { PUBLIC_OWNER_NAME } from '$env/static/public';
import { applyRouting } from './routing.js';
import { createProofEvent } from '$lib/server/proof.js';

export async function POST({ request, getClientAddress }) {
	// Rate limiting
	const ip = getClientAddress();
	const rateLimitResult = checkRateLimit(ip);
	if (!rateLimitResult.allowed) {
		return json({ error: 'Too many requests. Please try again later.' }, {
			status: 429,
			headers: { 'Retry-After': String(rateLimitResult.retryAfter) },
		});
	}

	// Optional API key auth
	const apiKeys = (process.env.PAPI_API_KEYS || '').split(',').filter(Boolean);
	if (apiKeys.length > 0) {
		const authHeader = request.headers.get('Authorization');
		const token = authHeader?.replace('Bearer ', '');
		// Allow unauthenticated widget/telegram requests, but enforce for API channel
		const body = await request.clone().json();
		if (body.channel === 'api' && (!token || !apiKeys.includes(token))) {
			return json({ error: 'Invalid API key' }, { status: 401 });
		}
	}

	const { query, name, channel = 'widget', metadata = {}, conversation_id, referral_token } = await request.json();
	const owner = PUBLIC_OWNER_NAME || 'Owner';

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
		referralToken: referral_token || null,
	});

	// Apply routing after processQuery
	const routingResult = await applyRouting(result, query.trim());

	// Add routing info to response if available
	if (routingResult?.topic) {
		result.topic = routingResult.topic;
		result.suggestedEventType = routingResult.eventType;
		
		// If routing suggests auto-qualification and result wasn't already qualified
		if (routingResult.autoQualify && !result.qualified) {
			result.qualified = true;
			result.qualification_reason = 'Auto-qualified via routing rules';
		}
	}

	// Create proof event for qualified interactions
	if (result.qualified === true) {
		await createProofEvent({
			eventType: 'qualified',
			senderName: name || 'Someone',
			topic: result.topic || null
		});
	}

	// Notify owner for drafts and escalations
	if (result.classification !== 'auto') {
		await notify({
			type: result.classification,
			title: result.classification === 'escalate' ? 'Needs your attention' : 'Draft ready for review',
			message: `From: ${name || 'Unknown'} (${channel})\nQuery: ${query.trim()}\n${result.response ? `Draft: ${result.response}` : ''}${result.qualified ? '\n✅ Qualified for meeting' : ''}`,
		});
	}

	// Also notify on qualification events
	if (result.qualified && result.classification === 'auto') {
		await notify({
			type: 'qualified',
			title: 'Someone qualified for a meeting',
			message: `${name || 'Unknown'} (${channel}) qualified: ${result.qualification_reason || 'met criteria'}`,
		});
	}

	if (result.classification === 'auto') {
		return json({
			response: result.response,
			type: 'auto',
			qualified: result.qualified || false,
			conversation_id: result.conversation_id,
			trust: result.trust || null,
			topic: result.topic || null,
			suggestedEventType: result.suggestedEventType || null,
		});
	}

	return json({
		response: result.classification === 'draft'
			? `Thanks for the details! I'm reviewing this and will get back to you shortly.`
			: `I'll pass this to ${owner} directly — expect a response soon.`,
		type: result.classification,
		qualified: result.qualified || false,
		conversation_id: result.conversation_id,
		trust: result.trust || null,
		topic: result.topic || null,
		suggestedEventType: result.suggestedEventType || null,
	});
}

export async function OPTIONS() {
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		},
	});
}
