import { supabase } from './supabase.js';
import { callLLM } from './providers/index.js';
import { notify } from './notify.js';
import { PUBLIC_OWNER_NAME, PUBLIC_APP_URL } from '$env/static/public';
import { getEventTypes, getSchedulingRules } from './calendar.js';
import { getOrCreateTrust, addTrustPoints, getTier, validateReferral, useReferral } from './trust.js';
import { sanitizeForPrompt } from './sanitize.js';

// ---------------------------------------------------------------------------
// Data loaders
// ---------------------------------------------------------------------------

export async function getKnowledge() {
	const { data } = await supabase
		.from('knowledge')
		.select('*')
		.order('priority', { ascending: false });
	return data || [];
}

export async function getTemplates() {
	const { data } = await supabase.from('templates').select('*');
	return data || [];
}

export async function getContact(senderName, senderId) {
	if (!senderName && !senderId) return null;
	const { data } = await supabase
		.from('contacts')
		.select('*')
		.or(`name.ilike.%${senderName || ''}%,email.eq.${senderId || ''}`)
		.limit(1);
	return data?.[0] || null;
}

export async function getConversation(conversationId) {
	const { data } = await supabase
		.from('conversations')
		.select('*')
		.eq('id', conversationId)
		.single();
	return data || null;
}

// ---------------------------------------------------------------------------
// System prompt builder
// ---------------------------------------------------------------------------

function buildSystemPrompt(knowledge, templates, scheduling = null, trustTier = null) {
	const sections = {};
	for (const k of knowledge) {
		if (!sections[k.category]) sections[k.category] = [];
		sections[k.category].push(`- ${k.key}: ${sanitizeForPrompt(k.value)}${k.context ? ` (${sanitizeForPrompt(k.context)})` : ''}`);
	}

	const owner = PUBLIC_OWNER_NAME || 'the owner';
	const appUrl = PUBLIC_APP_URL || '';

	let prompt = `You are ${owner}'s Personal API — an AI gatekeeper that qualifies people before they get access to ${owner}'s time.

## Your core job:
People want ${owner}'s time. Your job is to figure out if they deserve it.

1. Answer factual questions (projects, tech stack, background) — this is free
2. EVALUATE if the person has a legitimate, specific reason to meet ${owner}
3. Only grant booking access to people who qualify
4. Politely redirect everyone else

## Qualification criteria:
A person QUALIFIES for a meeting if they demonstrate:
- A specific, concrete proposal (not "let's chat sometime")
- Relevance to ${owner}'s work or interests
- They've done their homework (know what ${owner} works on)
- A clear ask with mutual value (not just taking ${owner}'s time)

A person DOES NOT qualify if:
- Vague requests ("I'd love to pick your brain")
- Recruiting/headhunting (${owner} runs their own company)
- Generic sales pitches
- No clear agenda or purpose
- They haven't explained WHY they need a meeting

## How to handle requests for meetings:
- If someone asks to meet WITHOUT qualifying first → ask them to explain what they want to discuss and why. Be friendly but direct.
- If they qualify after explaining → include a booking link in your response
- If they don't qualify → politely decline and suggest async alternatives (email, the chat itself)
- Known contacts with relationship "close" or "professional" → always qualify

## Trust-based qualification approach:
${trustTier ? `This sender has trust tier: ${trustTier}` : 'This is a new contact (no trust tier yet)'}
- "new" tier (0-10 points) → strict qualification, ask probing questions, be thorough
- "known" tier (11-30 points) → moderate qualification, give benefit of the doubt
- "trusted"/"vip" tier (31+ points) → auto-qualify, share booking links freely
${trustTier === 'new' ? 'Be extra thorough with this new contact. Ask specific questions about their needs.' : ''}
${trustTier === 'known' ? 'This person has some history with you. Be moderately trusting but still verify their request.' : ''}
${trustTier === 'trusted' || trustTier === 'vip' ? 'This person has proven themselves trustworthy. Feel free to be generous with booking links.' : ''}

For borderline qualification cases, or when someone seems genuine but you can't fully evaluate via text, suggest they record a 60-second video pitch at ${PUBLIC_APP_URL}/pitch. This shows commitment and helps ${PUBLIC_OWNER_NAME} evaluate.

## Classification:
- "auto" — factual questions, standard declines, and QUALIFIED booking responses
- "draft" — borderline cases, interesting proposals that need ${owner}'s judgment
- "escalate" — known important contacts, urgent matters

## ${owner}'s information:\n\n`;

	for (const [cat, items] of Object.entries(sections)) {
		prompt += `### ${cat.charAt(0).toUpperCase() + cat.slice(1)}\n${items.join('\n')}\n\n`;
	}

	if (templates.length > 0) {
		prompt += `### Response templates\n`;
		for (const t of templates) {
			prompt += `- Pattern "${t.trigger_pattern}": ${sanitizeForPrompt(t.response_template)}\n`;
		}
	}

	// Scheduling — only included so the AI knows what links to share
	if (scheduling && scheduling.eventTypes.length > 0) {
		const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		prompt += `### Meeting types (only share when person qualifies)\n`;
		for (const et of scheduling.eventTypes) {
			prompt += `- "${et.name}" (${et.duration_minutes} min): ${appUrl}/schedule/${et.slug}\n`;
		}
		if (scheduling.rules.length > 0) {
			const byDay = {};
			for (const r of scheduling.rules) {
				if (!r.available) continue;
				if (!byDay[r.day_of_week]) byDay[r.day_of_week] = [];
				byDay[r.day_of_week].push(`${r.start_time}–${r.end_time}`);
			}
			prompt += `Availability: `;
			const parts = [];
			for (const [day, windows] of Object.entries(byDay)) {
				parts.push(`${dayNames[day]} ${windows.join(', ')}`);
			}
			prompt += parts.join('; ') + '\n';
		}
		prompt += `\nIMPORTANT: Do NOT share booking links until the person has qualified. If they ask to book, first ask what they want to discuss. Only after they give a specific, relevant reason, share the appropriate booking link.\n\n`;
	}

	prompt += `## Response format:
Return a JSON object (no markdown wrapping):
{
  "classification": "auto" | "draft" | "escalate",
  "response": "your response text",
  "qualified": true | false,
  "qualification_reason": "why they did/didn't qualify (brief)",
  "reason": "brief classification reason",
  "confidence": 0.0-1.0
}

The "qualified" field indicates if this person has earned access to ${owner}'s calendar in this conversation. Once qualified, booking links can be shared.`;

	return prompt;
}

// ---------------------------------------------------------------------------
// Main query processor
// ---------------------------------------------------------------------------

export async function processQuery({ query, channel, senderName, senderId, metadata = {}, conversationId = null, referralToken = null }) {
	const [knowledge, templates, contact, conversation, eventTypes, schedulingRules] = await Promise.all([
		getKnowledge(),
		getTemplates(),
		getContact(senderName, senderId),
		conversationId ? getConversation(conversationId) : null,
		getEventTypes(),
		getSchedulingRules(),
	]);

	// Handle trust scores and referrals
	let trust = await getOrCreateTrust(senderId, senderName, senderId || senderName);
	let referralData = null;
	let wasReferred = false;

	// Handle referral token if provided
	if (referralToken && trust) {
		const referralResult = await useReferral(referralToken, senderName, senderId);
		if (referralResult.success) {
			wasReferred = true;
			referralData = referralResult.referral_data;
			// Add referral bonus points and set referred_by
			trust = await addTrustPoints(trust.id, 25, 'referral');
			// Update the referred_by field
			if (referralData.referrer_contact_id) {
				await supabase
					.from('trust_scores')
					.update({ referred_by: referralData.referrer_contact_id })
					.eq('id', trust.id);
			}
		}
	}

	// Known close contact → always escalate + auto-qualify
	if (contact?.always_escalate) {
		const interaction = await logInteraction({
			channel, senderName, senderId, query,
			classification: 'escalate',
			response: null,
			status: 'escalated',
			metadata: { ...metadata, contact_id: contact.id, qualified: true },
		});
		return { classification: 'escalate', response: null, qualified: true, reason: 'Known contact marked for escalation', interactionId: interaction.id };
	}

	// Check if this conversation has already been qualified
	const previouslyQualified = conversation?.messages?.some(m =>
		m.role === 'assistant' && m.qualified === true
	) || false;

	// Known professional/close contacts auto-qualify
	const autoQualify = contact && ['close', 'professional'].includes(contact.relationship);

	const scheduling = { eventTypes, rules: schedulingRules };
	const systemPrompt = buildSystemPrompt(knowledge, templates, scheduling, trust?.tier);

	// Build messages array for conversation context
	let messages = [];

	if (conversation && conversation.messages) {
		const recentMessages = conversation.messages.slice(-10);
		for (const msg of recentMessages) {
			messages.push({ role: msg.role, content: msg.content });
		}
	}

	let userMessage = `Channel: ${channel}
Sender: ${senderName || 'Unknown'}`;
	if (contact) userMessage += ` (Known contact: ${contact.relationship})`;
	if (trust) userMessage += ` (Trust tier: ${trust.tier}, score: ${trust.score})`;
	if (wasReferred) userMessage += ` [REFERRED by ${referralData.referrer_name}${referralData.note ? ': ' + referralData.note : ''}]`;
	if (previouslyQualified || autoQualify) userMessage += ` [PREVIOUSLY QUALIFIED — booking links can be shared]`;
	userMessage += `\nMessage: ${query}`;

	messages.push({ role: 'user', content: userMessage });

	const llmResponse = await callLLM({ system: systemPrompt, messages });
	const text = llmResponse.text || '{}';

	let result;
	try {
		const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
		result = JSON.parse(cleaned);
	} catch {
		result = { classification: 'escalate', response: text, qualified: false, reason: 'Failed to parse LLM response', confidence: 0 };
	}

	// Override qualification for known contacts
	if (autoQualify || wasReferred) result.qualified = true;

	// Update trust scores based on interaction and qualification
	if (trust) {
		// Award interaction points (capped at 1 per hour)
		await addTrustPoints(trust.id, 1, 'interaction');
		
		// Award qualification points if this is newly qualified and not previously qualified in conversation
		if (result.qualified && !previouslyQualified) {
			const alreadyQualifiedThisConversation = conversation?.messages?.some(m =>
				m.role === 'assistant' && m.qualified === true
			);
			if (!alreadyQualifiedThisConversation) {
				await addTrustPoints(trust.id, 5, 'qualified');
			}
		}
	}

	const status = result.classification === 'auto' ? 'sent' :
		result.classification === 'draft' ? 'pending' : 'escalated';

	const interaction = await logInteraction({
		channel, senderName, senderId, query,
		classification: result.classification,
		response: result.response,
		status,
		metadata: {
			...metadata,
			reason: result.reason,
			confidence: result.confidence,
			qualified: result.qualified,
			qualification_reason: result.qualification_reason,
		},
	});

	const finalConversationId = await updateConversation({
		conversationId, senderId, senderName, channel,
		userMessage: query,
		assistantMessage: result.response,
		qualified: result.qualified,
	});

	return {
		...result,
		interactionId: interaction.id,
		conversation_id: finalConversationId,
		trust: trust ? {
			score: trust.score,
			tier: trust.tier,
			total_interactions: trust.total_interactions
		} : null,
	};
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function logInteraction({ channel, senderName, senderId, query, classification, response, status, metadata }) {
	const { data, error } = await supabase
		.from('interactions')
		.insert({
			channel, sender_name: senderName, sender_id: senderId,
			query, classification, response, status, metadata,
		})
		.select()
		.single();

	if (error) console.error('Failed to log interaction:', error);
	return data || { id: 'unknown' };
}

async function updateConversation({ conversationId, senderId, senderName, channel, userMessage, assistantMessage, qualified }) {
	const now = new Date().toISOString();

	if (conversationId) {
		const { data: currentConv } = await supabase
			.from('conversations')
			.select('messages')
			.eq('id', conversationId)
			.single();

		if (currentConv) {
			const messages = currentConv.messages || [];
			messages.push(
				{ role: 'user', content: userMessage, timestamp: now },
				{ role: 'assistant', content: assistantMessage, timestamp: now, qualified },
			);

			await supabase
				.from('conversations')
				.update({ messages, last_message_at: now })
				.eq('id', conversationId);

			return conversationId;
		}
	}

	const { data, error } = await supabase
		.from('conversations')
		.insert({
			sender_id: senderId,
			sender_name: senderName,
			channel,
			messages: [
				{ role: 'user', content: userMessage, timestamp: now },
				{ role: 'assistant', content: assistantMessage, timestamp: now, qualified },
			],
			last_message_at: now,
		})
		.select('id')
		.single();

	if (error) console.error('Failed to create conversation:', error);
	return data?.id || null;
}
