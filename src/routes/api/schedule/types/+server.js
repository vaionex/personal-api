import { json } from '@sveltejs/kit';
import { getEventTypes } from '$lib/server/calendar.js';

export async function GET() {
	const types = await getEventTypes();
	return json(types);
}
