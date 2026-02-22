import { PUBLIC_OWNER_NAME, PUBLIC_APP_NAME } from '$env/static/public';
import { getRecentProofEvents } from '$lib/server/proof.js';

export async function load() {
	const recentActivity = await getRecentProofEvents(3); // Only show last 3 on main page

	return {
		ownerName: PUBLIC_OWNER_NAME || 'Owner',
		appName: PUBLIC_APP_NAME || 'Personal API',
		recentActivity
	};
}
