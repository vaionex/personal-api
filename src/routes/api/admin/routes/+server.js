import { json, error } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase.js';

export async function GET({ url }) {
	try {
		const { data, error: dbError } = await supabase
			.from('topic_routes')
			.select('*')
			.order('priority', { ascending: false });

		if (dbError) {
			throw dbError;
		}

		return json(data || []);
	} catch (err) {
		console.error('Failed to fetch topic routes:', err);
		return error(500, 'Failed to fetch topic routes');
	}
}

export async function POST({ request }) {
	try {
		const { topic, description, event_type_slug, auto_qualify, priority, keywords, response_hint } = await request.json();

		if (!topic || !description) {
			return error(400, 'topic and description are required');
		}

		const { data, error: dbError } = await supabase
			.from('topic_routes')
			.insert({
				topic: topic.trim(),
				description: description.trim(),
				event_type_slug: event_type_slug || null,
				auto_qualify: auto_qualify || false,
				priority: priority || 0,
				keywords: keywords || [],
				response_hint: response_hint || null,
				active: true
			})
			.select()
			.single();

		if (dbError) {
			throw dbError;
		}

		return json(data);
	} catch (err) {
		console.error('Failed to create topic route:', err);
		return error(500, 'Failed to create topic route');
	}
}

export async function DELETE({ url }) {
	try {
		const id = url.searchParams.get('id');
		if (!id) {
			return error(400, 'id parameter is required');
		}

		const { error: dbError } = await supabase
			.from('topic_routes')
			.update({ active: false })
			.eq('id', id);

		if (dbError) {
			throw dbError;
		}

		return json({ success: true });
	} catch (err) {
		console.error('Failed to deactivate topic route:', err);
		return error(500, 'Failed to deactivate topic route');
	}
}