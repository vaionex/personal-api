import { json } from '@sveltejs/kit';
import { getAvailableSlots } from '$lib/server/calendar.js';

export async function GET({ url }) {
	const eventType = url.searchParams.get('type');
	const from = url.searchParams.get('from');
	const to = url.searchParams.get('to');

	if (!eventType) return json({ error: 'type parameter required' }, { status: 400 });

	// Default: next 14 days
	const startDate = from ? new Date(from) : new Date();
	const endDate = to ? new Date(to) : new Date(Date.now() + 14 * 86400000);

	const result = await getAvailableSlots(eventType, startDate, endDate);
	if (result.error) return json({ error: result.error }, { status: 400 });

	// Group by date for easier rendering
	const byDate = {};
	for (const slot of result.slots) {
		if (!byDate[slot.date]) byDate[slot.date] = [];
		byDate[slot.date].push(slot);
	}

	return json({
		eventType: result.eventType,
		dates: Object.entries(byDate).map(([date, slots]) => ({ date, slots })),
		total: result.slots.length,
	});
}
