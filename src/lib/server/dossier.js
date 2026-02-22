import { supabase } from './supabase.js';
import { callLLM } from './providers/index.js';
import { PUBLIC_OWNER_NAME } from '$env/static/public';

/**
 * Generate a prep dossier for a booking
 */
export async function generateDossier(bookingId) {
	if (!bookingId) {
		throw new Error('generateDossier: bookingId is required');
	}

	// Load the booking details
	const { data: booking, error: bookingError } = await supabase
		.from('bookings')
		.select(`
			*,
			event_types (
				name,
				duration_minutes
			)
		`)
		.eq('id', bookingId)
		.single();

	if (bookingError || !booking) {
		throw new Error(`Failed to load booking: ${bookingError?.message || 'Not found'}`);
	}

	// Find the conversation for this guest (by email or name match)
	const { data: conversations } = await supabase
		.from('conversations')
		.select('*')
		.or(`sender_id.eq.${booking.guest_email},sender_name.eq.${booking.guest_name}`)
		.order('last_message_at', { ascending: false })
		.limit(1);

	const conversation = conversations?.[0];
	
	// Get the knowledge base for context about owner's projects
	const { data: knowledge } = await supabase
		.from('knowledge')
		.select('category, key, value, context')
		.order('priority', { ascending: false });

	// Build the knowledge base dump
	const knowledgeBase = (knowledge || [])
		.map(k => `${k.category}/${k.key}: ${k.value}${k.context ? ` (${k.context})` : ''}`)
		.join('\n');

	// Build conversation history
	let conversationHistory = 'No prior conversation found.';
	if (conversation?.messages && Array.isArray(conversation.messages)) {
		conversationHistory = conversation.messages
			.map(msg => `${msg.role || 'user'}: ${msg.content || msg.text || ''}`)
			.join('\n');
	}

	// Generate the dossier using LLM
	const ownerName = PUBLIC_OWNER_NAME || 'Owner';
	
	const prompt = `You are preparing a meeting brief for ${ownerName}.

## Meeting details:
- Guest: ${booking.guest_name} (${booking.guest_email})
- Meeting type: ${booking.event_types?.name || 'Meeting'} (${booking.event_types?.duration_minutes || 30} min)
- Scheduled: ${new Date(booking.start_time).toLocaleString()}
- Guest's notes: ${booking.guest_notes || 'None'}

## Conversation history:
${conversationHistory}

## ${ownerName}'s projects and background:
${knowledgeBase}

Generate a concise meeting prep dossier as JSON:
{
  "conversation_summary": "2-3 sentence summary of what was discussed",
  "guest_background": "What we know about this person from the conversation",
  "their_ask": "Specifically what they want from this meeting",
  "talking_points": ["point 1", "point 2", "point 3"],
  "potential_outcomes": ["outcome 1", "outcome 2"],
  "risks": "Any concerns or red flags (or 'None identified')",
  "related_projects": "Which of ${ownerName}'s projects are relevant to this conversation"
}`;

	try {
		const llmResult = await callLLM({
			system: 'You are a meeting prep assistant. Return only valid JSON.',
			messages: [{ role: 'user', content: prompt }],
		});
		const response = llmResult.text || '{}';

		let dossierData;
		try {
			dossierData = JSON.parse(response);
		} catch (parseError) {
			console.error('Failed to parse LLM response as JSON:', response);
			throw new Error('Failed to parse AI-generated dossier');
		}

		// Store the dossier in the database
		const { data: dossier, error: insertError } = await supabase
			.from('dossiers')
			.insert({
				booking_id: bookingId,
				guest_name: booking.guest_name,
				guest_email: booking.guest_email,
				conversation_summary: dossierData.conversation_summary,
				guest_background: dossierData.guest_background,
				their_ask: dossierData.their_ask,
				talking_points: dossierData.talking_points || [],
				potential_outcomes: dossierData.potential_outcomes || [],
				risks: dossierData.risks,
				related_projects: dossierData.related_projects,
				meeting_at: booking.start_time
			})
			.select()
			.single();

		if (insertError) {
			throw new Error(`Failed to save dossier: ${insertError.message}`);
		}

		return dossier;

	} catch (error) {
		console.error('Failed to generate dossier:', error);
		throw error;
	}
}

/**
 * Get an existing dossier by booking ID
 */
export async function getDossier(bookingId) {
	const { data, error } = await supabase
		.from('dossiers')
		.select('*')
		.eq('booking_id', bookingId)
		.single();

	if (error) {
		console.error('Failed to fetch dossier:', error);
		return null;
	}

	return data;
}

/**
 * Get all dossiers for upcoming meetings
 */
export async function getUpcomingDossiers() {
	const now = new Date().toISOString();
	
	const { data, error } = await supabase
		.from('dossiers')
		.select(`
			*,
			bookings (
				start_time,
				event_types (
					name,
					duration_minutes
				)
			)
		`)
		.gte('meeting_at', now)
		.order('meeting_at', { ascending: true });

	if (error) {
		console.error('Failed to fetch upcoming dossiers:', error);
		return [];
	}

	return data || [];
}