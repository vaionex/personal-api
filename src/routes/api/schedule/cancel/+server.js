import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase.js';
import { cancelBooking } from '$lib/server/calendar.js';

export async function POST({ request }) {
	const { token } = await request.json();
	if (!token) return json({ error: 'token required' }, { status: 400 });

	const { data: booking } = await supabase
		.from('bookings')
		.select('id')
		.eq('cancel_token', token)
		.eq('status', 'confirmed')
		.single();

	if (!booking) return json({ error: 'Booking not found or already cancelled' }, { status: 404 });

	const result = await cancelBooking(booking.id);
	if (result.error) return json({ error: result.error }, { status: 500 });

	return json({ message: 'Booking cancelled successfully' });
}
