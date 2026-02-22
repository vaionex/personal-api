import { PUBLIC_OWNER_NAME } from '$env/static/public';
import { getRecentProofEvents, getProofStats } from '$lib/server/proof.js';

export async function load() {
	const [events, stats] = await Promise.all([
		getRecentProofEvents(20),
		getProofStats()
	]);

	return {
		ownerName: PUBLIC_OWNER_NAME || 'Owner',
		initialEvents: events,
		stats
	};
}