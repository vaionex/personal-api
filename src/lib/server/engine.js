import { supabase } from './supabase.js';
import { callLLM } from './providers/index.js';
import { notify } from './notify.js';
import { PUBLIC_OWNER_NAME } from '$env/static/public';

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

export async function getConversation(conversationId) {
	const { data } = await supabase
		.from('conversations')
		.select('*')
		.eq('id', conversationId)
		.single();
	return data || null;
}

function buildSystemPrompt(knowledge, templates) {
	const sections = {};
	for (const k of knowledge) {
		if (!sections[k.category]) sections[k.category] = [];
		sections[k.category].push(`- ${k.key}: ${k.value}${k.context ? ` (${k.context})` : ''}`);
	}

	const owner = PUBLIC_OWNER_NAME || 'the owner';
	let prompt = `You are ${owner}'s Personal API — an AI surrogate that represents ${owner} professionally.
You answer questions, handle requests, and draft responses as ${owner} would.

## Your role:
- Be helpful, direct, and efficient
- Answer factual questions about ${owner}'s work, projects, and availability
- Politely decline things ${owner} wouldn't be interested in
- For anything requiring real judgment, say you'll pass it to ${owner}

## Classification:
For each incoming message, classify it as:
- "auto" — you can fully handle this (factual questions, standard declines, FAQ)
- "draft" — you should draft a response for ${owner} to approve (partnerships, opportunities, nuanced requests)
- "escalate" — ${owner} needs to see this personally (close contacts, urgent matters, things requiring judgment)

## ${owner}'s information:\n\n`;

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

export async function processQuery({ query, channel, senderName, senderId, metadata = {}, conversationId = null }) {
	const [knowledge, templates, contact, conversation] = await Promise.all([
		getKnowledge(),
		getTemplates(),
		getContact(senderName, senderId),
		conversationId ? getConversation(conversationId) : null,
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

	// Build messages array for conversation context
	let messages = [];
	
	// Add conversation history (last 5 messages)
	if (conversation && conversation.messages) {
		const recentMessages = conversation.messages.slice(-5);
		for (const msg of recentMessages) {
			messages.push({
				role: msg.role,
				content: msg.content
			});
		}
	}

	// Add current message
	const userMessage = `Channel: ${channel}
Sender: ${senderName || 'Unknown'}${contact ? ` (Known contact: ${contact.relationship})` : ''}
Message: ${query}`;
	
	messages.push({ role: 'user', content: userMessage });

	const llmResponse = await callLLM({
		system: systemPrompt,
		messages: messages,
	});
	
	const text = llmResponse.text || '{}';

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

	// Handle conversation tracking
	const finalConversationId = await updateConversation({
		conversationId,
		senderId,
		senderName,
		channel,
		userMessage: query,
		assistantMessage: result.response
	});

	return { ...result, interactionId: interaction.id, conversation_id: finalConversationId };
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

async function updateConversation({ conversationId, senderId, senderName, channel, userMessage, assistantMessage }) {
	const now = new Date().toISOString();
	
	if (conversationId) {
		// Update existing conversation
		const { data: currentConv } = await supabase
			.from('conversations')
			.select('messages')
			.eq('id', conversationId)
			.single();
			
		if (currentConv) {
			const messages = currentConv.messages || [];
			messages.push(
				{ role: 'user', content: userMessage, timestamp: now },
				{ role: 'assistant', content: assistantMessage, timestamp: now }
			);
			
			await supabase
				.from('conversations')
				.update({ 
					messages, 
					last_message_at: now 
				})
				.eq('id', conversationId);
				
			return conversationId;
		}
	}
	
	// Create new conversation
	const { data, error } = await supabase
		.from('conversations')
		.insert({
			sender_id: senderId,
			sender_name: senderName,
			channel,
			messages: [
				{ role: 'user', content: userMessage, timestamp: now },
				{ role: 'assistant', content: assistantMessage, timestamp: now }
			],
			last_message_at: now
		})
		.select('id')
		.single();
		
	if (error) console.error('Failed to create conversation:', error);
	return data?.id || null;
}
