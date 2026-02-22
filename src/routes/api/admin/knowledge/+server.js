import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase.js';

export async function POST({ request }) {
	const { category, key, value, context } = await request.json();
	const { data, error } = await supabase
		.from('knowledge')
		.insert({ category, key, value, context: context || null })
		.select()
		.single();
	if (error) return json({ error: error.message }, { status: 500 });
	return json(data);
}

export async function DELETE({ url }) {
	const id = url.searchParams.get('id');
	if (!id) return json({ error: 'id required' }, { status: 400 });
	await supabase.from('knowledge').delete().eq('id', id);
	return json({ ok: true });
}
