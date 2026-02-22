import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase.js';

export async function POST({ request }) {
	const { trigger_pattern, response_template, auto_send } = await request.json();
	const { data, error } = await supabase
		.from('templates')
		.insert({ trigger_pattern, response_template, auto_send: auto_send || false })
		.select()
		.single();
	if (error) return json({ error: error.message }, { status: 500 });
	return json(data);
}

export async function DELETE({ url }) {
	const id = url.searchParams.get('id');
	if (!id) return json({ error: 'id required' }, { status: 400 });
	await supabase.from('templates').delete().eq('id', id);
	return json({ ok: true });
}
