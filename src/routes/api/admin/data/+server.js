import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase.js';

export async function GET() {
	const [
		{ data: knowledge },
		{ data: interactions },
		{ data: templates },
		{ count: total },
		{ count: auto },
		{ count: pending },
	] = await Promise.all([
		supabase.from('knowledge').select('*').order('category').order('priority', { ascending: false }),
		supabase.from('interactions').select('*').order('created_at', { ascending: false }).limit(50),
		supabase.from('templates').select('*').order('created_at', { ascending: false }),
		supabase.from('interactions').select('*', { count: 'exact', head: true }),
		supabase.from('interactions').select('*', { count: 'exact', head: true }).eq('classification', 'auto'),
		supabase.from('interactions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
	]);

	return json({
		knowledge: knowledge || [],
		interactions: interactions || [],
		templates: templates || [],
		stats: { total: total || 0, auto: auto || 0, pending: pending || 0 },
	});
}
