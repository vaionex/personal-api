import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase.js';
import { getTrustStats, addTrustPoints } from '$lib/server/trust.js';
import { ADMIN_PASSWORD } from '$env/static/private';

function requireAuth(request) {
	const auth = request.headers.get('authorization');
	if (!auth || auth !== `Bearer ${ADMIN_PASSWORD}`) {
		throw new Error('Unauthorized');
	}
}

export async function GET({ request, url }) {
	try {
		requireAuth(request);
		
		// Get all trust records with stats
		const { data: trustRecords } = await supabase
			.from('trust_scores')
			.select(`
				*,
				referred_by_contact:referred_by(name, email)
			`)
			.order('score', { ascending: false });
		
		const stats = await getTrustStats();
		
		return json({
			trust_records: trustRecords || [],
			stats,
		});
	} catch (error) {
		console.error('Trust admin API error:', error);
		if (error.message === 'Unauthorized') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function PATCH({ request }) {
	try {
		requireAuth(request);
		
		const { trust_id, points, reason } = await request.json();
		
		if (!trust_id || typeof points !== 'number') {
			return json({ error: 'trust_id and points are required' }, { status: 400 });
		}
		
		const updatedTrust = await addTrustPoints(trust_id, points, reason || 'manual_adjustment');
		
		if (!updatedTrust) {
			return json({ error: 'Trust record not found' }, { status: 404 });
		}
		
		return json({ trust: updatedTrust });
	} catch (error) {
		console.error('Trust update error:', error);
		if (error.message === 'Unauthorized') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}