import { supabase } from '$lib/server/supabase.js';
import { PUBLIC_OWNER_NAME } from '$env/static/public';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const { data: booking } = await supabase
		.from('bookings')
		.select('*, event_types(*)')
		.eq('cancel_token', params.token)
		.single();

	if (!booking) error(404, 'Booking not found');

	return {
		ownerName: PUBLIC_OWNER_NAME || 'Owner',
		booking,
		token: params.token,
	};
}
