import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase.js';

export async function GET() {
	const [{ data: knowledge }, { data: interactions }] = await Promise.all([
		supabase.from('knowledge').select('*').order('category').order('priority', { ascending: false }),
		supabase.from('interactions').select('*').order('created_at', { ascending: false }).limit(50),
	]);

	return json({ knowledge: knowledge || [], interactions: interactions || [] });
}
