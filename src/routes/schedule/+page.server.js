import { PUBLIC_OWNER_NAME } from '$env/static/public';
import { getEventTypes, isCalendarConnected } from '$lib/server/calendar.js';

export async function load() {
	const eventTypes = await getEventTypes();
	return {
		ownerName: PUBLIC_OWNER_NAME || 'Owner',
		eventTypes,
		calendarConnected: isCalendarConnected(),
	};
}
