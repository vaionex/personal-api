import { PUBLIC_OWNER_NAME } from '$env/static/public';
import { getEventType } from '$lib/server/calendar.js';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const eventType = await getEventType(params.slug);
	if (!eventType) error(404, 'Meeting type not found');
	return {
		ownerName: PUBLIC_OWNER_NAME || 'Owner',
		eventType,
	};
}
