import { json, error } from '@sveltejs/kit';
import { getRecentProofEvents, getProofStats } from '$lib/server/proof.js';

export async function GET({ url }) {
	try {
		const statsOnly = url.searchParams.get('stats') === 'true';
		const limit = parseInt(url.searchParams.get('limit') || '20', 10);

		if (statsOnly) {
			const stats = await getProofStats();
			return json(stats);
		}

		const events = await getRecentProofEvents(limit);
		const stats = await getProofStats();

		return json({
			events,
			stats
		});
	} catch (err) {
		console.error('Failed to fetch proof events:', err);
		return error(500, 'Failed to fetch proof events');
	}
}