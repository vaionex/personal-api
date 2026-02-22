import { supabase } from './supabase.js';

/**
 * Get all active topic routes from the database
 */
export async function getTopicRoutes() {
	const { data, error } = await supabase
		.from('topic_routes')
		.select('*')
		.eq('active', true)
		.order('priority', { ascending: false });

	if (error) {
		console.error('Failed to fetch topic routes:', error);
		return [];
	}

	return data || [];
}

/**
 * Match a text query against topic routes using keyword matching
 * Returns the best matching route or null
 */
export function matchTopic(text, routes) {
	if (!text || !routes?.length) return null;

	const lowercaseText = text.toLowerCase();
	let bestMatch = null;
	let highestScore = 0;

	for (const route of routes) {
		if (!route.keywords || !Array.isArray(route.keywords)) continue;

		let score = 0;
		const keywords = route.keywords;

		for (const keyword of keywords) {
			if (typeof keyword !== 'string') continue;
			const keywordLower = keyword.toLowerCase();
			
			// Exact match
			if (lowercaseText.includes(keywordLower)) {
				score += keyword.length; // Longer keywords get more weight
			}
		}

		// Apply priority multiplier
		score = score * (route.priority || 1);

		if (score > highestScore) {
			highestScore = score;
			bestMatch = route;
		}
	}

	return bestMatch;
}

/**
 * Get the event type slug for a given topic
 */
export function getRoutedEventType(topic) {
	if (!topic) return null;
	return topic.event_type_slug || null;
}

/**
 * Check if a conversation already has a routed topic
 */
export async function getRouteForConversation(conversationId) {
	if (!conversationId) return null;

	// This would require tracking routes per conversation in the conversations table
	// For now, return null as this feature would need additional schema changes
	return null;
}