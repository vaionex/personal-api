import { json, error } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase.js';
import { getUpcomingDossiers } from '$lib/server/dossier.js';

export async function GET({ url }) {
	try {
		const all = url.searchParams.get('all') === 'true';
		
		if (all) {
			// Get all dossiers
			const { data, error: dbError } = await supabase
				.from('dossiers')
				.select(`
					*,
					bookings (
						start_time,
						event_types (
							name,
							duration_minutes
						)
					)
				`)
				.order('meeting_at', { ascending: false });

			if (dbError) {
				throw dbError;
			}

			return json(data || []);
		} else {
			// Get upcoming dossiers only
			const dossiers = await getUpcomingDossiers();
			return json(dossiers);
		}
	} catch (err) {
		console.error('Failed to fetch dossiers:', err);
		return error(500, 'Failed to fetch dossiers');
	}
}

export async function PATCH({ request, url }) {
	try {
		const id = url.searchParams.get('id');
		if (!id) {
			return error(400, 'id parameter is required');
		}

		const { owner_notes, status } = await request.json();

		const updateData = {};
		if (owner_notes !== undefined) updateData.owner_notes = owner_notes;
		if (status !== undefined) updateData.status = status;

		if (Object.keys(updateData).length === 0) {
			return error(400, 'No fields to update');
		}

		const { data, error: dbError } = await supabase
			.from('dossiers')
			.update(updateData)
			.eq('id', id)
			.select()
			.single();

		if (dbError) {
			throw dbError;
		}

		return json(data);
	} catch (err) {
		console.error('Failed to update dossier:', err);
		return error(500, 'Failed to update dossier');
	}
}