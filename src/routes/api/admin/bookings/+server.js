import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase.js';
import { cancelBooking } from '$lib/server/calendar.js';

export async function GET() {
	const [{ data: bookings }, { data: eventTypes }, { data: rules }] = await Promise.all([
		supabase.from('bookings').select('*, event_types(name, slug, color)').order('start_time', { ascending: true }),
		supabase.from('event_types').select('*').order('created_at'),
		supabase.from('scheduling_rules').select('*').order('day_of_week').order('start_time'),
	]);

	return json({
		bookings: bookings || [],
		eventTypes: eventTypes || [],
		rules: rules || [],
	});
}

export async function POST({ request }) {
	const body = await request.json();

	switch (body.action) {
		case 'create_event_type': {
			const { slug, name, description, duration_minutes, buffer_minutes, color } = body;
			const { data, error } = await supabase.from('event_types').insert({
				slug, name, description: description || null,
				duration_minutes, buffer_minutes: buffer_minutes || 0, color,
			}).select().single();
			if (error) return json({ error: error.message }, { status: 500 });
			return json(data);
		}

		case 'delete_event_type': {
			await supabase.from('event_types').delete().eq('id', body.id);
			return json({ ok: true });
		}

		case 'create_rule': {
			const { day_of_week, start_time, end_time, available } = body;
			const { data, error } = await supabase.from('scheduling_rules').insert({
				day_of_week, start_time, end_time, available: available !== false,
			}).select().single();
			if (error) return json({ error: error.message }, { status: 500 });
			return json(data);
		}

		case 'delete_rule': {
			await supabase.from('scheduling_rules').delete().eq('id', body.id);
			return json({ ok: true });
		}

		case 'cancel_booking': {
			const result = await cancelBooking(body.id);
			if (result.error) return json({ error: result.error }, { status: 500 });
			return json({ ok: true });
		}

		default:
			return json({ error: 'Unknown action' }, { status: 400 });
	}
}
