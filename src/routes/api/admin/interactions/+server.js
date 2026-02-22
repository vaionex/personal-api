import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase.js';

export async function PATCH({ request }) {
	const { id, status } = await request.json();
	if (!id || !status) return json({ error: 'id and status required' }, { status: 400 });
	const { error } = await supabase.from('interactions').update({ status }).eq('id', id);
	if (error) return json({ error: error.message }, { status: 500 });
	return json({ ok: true });
}
