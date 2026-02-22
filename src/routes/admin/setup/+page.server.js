import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase.js';

export async function load({ locals, url }) {
	// Check if user is authenticated (reuse existing auth logic)
	if (!locals.user) {
		throw redirect(302, '/admin/login');
	}

	// Check if setup is already complete by looking for existing knowledge entries
	const { data: knowledge } = await supabase
		.from('knowledge')
		.select('id')
		.limit(1);

	const setupComplete = knowledge && knowledge.length > 0;

	return {
		setupComplete,
		ownerName: process.env.PUBLIC_OWNER_NAME || 'Your Name',
		appUrl: process.env.PUBLIC_APP_URL || url.origin
	};
}