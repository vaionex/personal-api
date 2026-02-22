import { supabase } from './supabase.js';
import { ANTHROPIC_API_KEY } from '$env/static/private';

/**
 * Core Personal API Engine
 * 1. Loads knowledge base
 * 2. Classifies incoming query
 * 3. Generates response or escalates
 */

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

function buildSystemPrompt(knowledge, templates) {
	const sections = {};
	for (const k of knowledge) {
		if (!sections[k.category]) sections[k.category] = [];
		sections[k.category].push(`- ${k.key}: ${k.value}${k.context ? ` (${k.context})` : ''}`);
	}

	let prompt = `You are Robin's Personal API — an AI that represents Robin Kohze professionally.
You answer questions, handle requests, and draft responses AS Robin would.

## Your role:
- Be helpful, direct, and efficient (Robin's style — no fluff)
- Answer factual questions about Robin's work, projects, and availability
- Politely decline things Robin wouldn't be interested in
- For anything requiring real judgment, say you'll pass it to Robin

## Classification:
For each incoming message, classify it as:
- "auto" — you can fully handle this (factual questions, standard declines, FAQ)
- "draft" — you should draft a response for Robin to approve (partnerships, opportunities, nuanced requests)
- "escalate" — Robin needs to see this personally (close contacts, urgent matters, things requiring judgment)

## Robin's information:\n\n`;

	for (const [cat, items] of Object.entries(sections)) {
		prompt += `### ${cat.charAt(0).toUpperCase() + cat.slice(1)}\n${items.join('\n')}\n\n`;
	}

	if (templates.length > 0) {
		prompt += `### Response templates\n`;
		for (const t of templates) {
			prompt += `- Pattern "${t.trigger_pattern}": ${t.response_template}\n`;
		}
	}

	prompt += `\n## Response format:
Return a JSON object (no markdown wrapping):
{
  "classification": "auto" | "draft" | "escalate",
  "response": "your response text",
  "reason": "brief reason for classification",
  "confidence": 0.0-1.0
}`;

	return prompt;
}

export async function processQuery({ query, channel, senderName, senderId, metadata = {} }) {
	const [knowledge, templates, contact] = await Promise.all([
		getKnowledge(),
		getTemplates(),
		getContact(senderName, senderId),
	]);

	// Known close contact → always escalate
	if (contact?.always_escalate) {
		const interaction = await logInteraction({
			channel, senderName, senderId, query,
			classification: 'escalate',
			response: null,
			status: 'escalated',
			metadata: { ...metadata, contact_id: contact.id },
		});
		return { classification: 'escalate', response: null, reason: 'Known contact marked for escalation', interactionId: interaction.id };
	}

	const systemPrompt = buildSystemPrompt(knowledge, templates);

	const userMessage = `Channel: ${channel}
Sender: ${senderName || 'Unknown'}${contact ? ` (Known contact: ${contact.relationship})` : ''}
Message: ${query}`;

	const res = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': ANTHROPIC_API_KEY,
			'anthropic-version': '2023-06-01',
		},
		body: JSON.stringify({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 1024,
			system: systemPrompt,
			messages: [{ role: 'user', content: userMessage }],
		}),
	});

	const data = await res.json();
	const text = data.content?.[0]?.text || '{}';

	let result;
	try {
		// Strip markdown code fences if present
		const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
		result = JSON.parse(cleaned);
	} catch {
		result = { classification: 'escalate', response: text, reason: 'Failed to parse LLM response', confidence: 0 };
	}

	const status = result.classification === 'auto' ? 'sent' :
		result.classification === 'draft' ? 'pending' : 'escalated';

	const interaction = await logInteraction({
		channel, senderName, senderId, query,
		classification: result.classification,
		response: result.response,
		status,
		metadata: { ...metadata, reason: result.reason, confidence: result.confidence },
	});

	return { ...result, interactionId: interaction.id };
}

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
