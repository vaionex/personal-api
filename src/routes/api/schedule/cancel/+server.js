import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase.js';
import { cancelBooking } from '$lib/server/calendar.js';
import { createProofEvent } from '$lib/server/proof.js';
import { sendBookingCancellation } from '$lib/server/email.js';
import { PUBLIC_OWNER_NAME } from '$env/static/public';

export async function POST({ request }) {
	const { token } = await request.json();
	if (!token) return json({ error: 'token required' }, { status: 400 });

	const { data: booking } = await supabase
		.from('bookings')
		.select('id, guest_name, guest_email, start_time, event_types(name)')
		.eq('cancel_token', token)
		.eq('status', 'confirmed')
		.single();

	if (!booking) return json({ error: 'Booking not found or already cancelled' }, { status: 404 });

	const result = await cancelBooking(booking.id);
	if (result.error) return json({ error: result.error }, { status: 500 });

	// Create proof event for cancellation
	await createProofEvent({
		eventType: 'cancelled',
		senderName: booking.guest_name || 'Someone',
		meetingType: booking.event_types?.name || 'meeting'
	});

	// Send cancellation email
	if (booking.guest_email) {
		await sendBookingCancellation({
			guestEmail: booking.guest_email,
			guestName: booking.guest_name || 'there',
			eventType: booking.event_types?.name || 'meeting',
			startTime: booking.start_time,
			ownerName: PUBLIC_OWNER_NAME || 'Personal API'
		});
	}

	return json({ message: 'Booking cancelled successfully' });
}
