import { json } from '@sveltejs/kit';
import { bookSlot } from '$lib/server/calendar.js';
import { notify } from '$lib/server/notify.js';
import { PUBLIC_OWNER_NAME, PUBLIC_APP_URL } from '$env/static/public';

export async function POST({ request }) {
	const { eventType, startTime, name, email, notes, timezone } = await request.json();

	if (!eventType || !startTime || !name || !email) {
		return json({ error: 'eventType, startTime, name, and email are required' }, { status: 400 });
	}

	// Basic email validation
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return json({ error: 'Invalid email address' }, { status: 400 });
	}

	const result = await bookSlot({
		eventTypeSlug: eventType,
		startTime,
		name,
		email,
		notes,
		timezone,
	});

	if (result.error) return json({ error: result.error }, { status: 400 });

	// Notify owner
	const owner = PUBLIC_OWNER_NAME || 'Owner';
	const appUrl = PUBLIC_APP_URL || '';
	const start = new Date(startTime);
	
	await notify({
		type: 'booking',
		title: `New booking: ${result.event.name}`,
		message: `${name} (${email}) booked "${result.event.name}" on ${start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}${notes ? `\nNotes: ${notes}` : ''}`,
		url: `${appUrl}/admin/bookings`,
	});

	return json({
		message: result.message,
		booking: {
			id: result.booking.id,
			start: result.booking.start_time,
			end: result.booking.end_time,
			cancelToken: result.booking.cancel_token,
			cancelUrl: `${appUrl}/schedule/cancel/${result.booking.cancel_token}`,
		},
	});
}
