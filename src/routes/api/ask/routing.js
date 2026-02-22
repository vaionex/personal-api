import { getTopicRoutes, matchTopic } from '$lib/server/routing.js';

/**
 * Apply topic routing to a query and response
 * Returns routing information or null
 */
export async function applyRouting(result, query) {
	if (!result || !query) return null;

	try {
		const routes = await getTopicRoutes();
		if (routes.length === 0) return null;

		// Try to match the query against topic routes
		const matchedRoute = matchTopic(query, routes);
		
		// Also check if the AI response mentions any topic keywords
		let responseMatch = null;
		if (result.response) {
			responseMatch = matchTopic(result.response, routes);
		}

		// Use the best match
		const bestRoute = matchedRoute || responseMatch;
		
		if (bestRoute) {
			return {
				topic: bestRoute.topic,
				eventType: bestRoute.event_type_slug,
				autoQualify: bestRoute.auto_qualify,
				description: bestRoute.description,
				responseHint: bestRoute.response_hint
			};
		}

		return null;
	} catch (error) {
		console.error('Failed to apply routing:', error);
		return null;
	}
}