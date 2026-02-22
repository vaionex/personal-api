import { json } from '@sveltejs/kit';
import { createReferral, getAllReferrals, deactivateReferral } from '$lib/server/trust.js';
import { supabase } from '$lib/server/supabase.js';
import { ADMIN_PASSWORD } from '$env/static/private';
import { PUBLIC_APP_URL } from '$env/static/public';

function requireAuth(request) {
	const auth = request.headers.get('authorization');
	if (!auth || auth !== `Bearer ${ADMIN_PASSWORD}`) {
		throw new Error('Unauthorized');
	}
}

export async function GET({ request }) {
	try {
		requireAuth(request);
		
		const referrals = await getAllReferrals();
		
		return json({ referrals });
	} catch (error) {
		console.error('Referrals admin API error:', error);
		if (error.message === 'Unauthorized') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function POST({ request }) {
	try {
		requireAuth(request);
		
		const { contact_id, referrer_name, note, max_uses, expires_at } = await request.json();
		
		if (!referrer_name) {
			return json({ error: 'referrer_name is required' }, { status: 400 });
		}
		
		// If contact_id is provided, verify it exists
		if (contact_id) {
			const { data: contact } = await supabase
				.from('contacts')
				.select('id, name')
				.eq('id', contact_id)
				.single();
			
			if (!contact) {
				return json({ error: 'Contact not found' }, { status: 404 });
			}
		}
		
		const referral = await createReferral(
			contact_id || null,
			referrer_name,
			note || '',
			max_uses || 1,
			expires_at ? new Date(expires_at).toISOString() : null
		);
		
		if (!referral) {
			return json({ error: 'Failed to create referral' }, { status: 500 });
		}
		
		// Generate the referral link
		const referralLink = `${PUBLIC_APP_URL}/?ref=${referral.token}`;
		
		return json({
			referral: {
				...referral,
				referral_link: referralLink,
			},
		});
	} catch (error) {
		console.error('Create referral error:', error);
		if (error.message === 'Unauthorized') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function DELETE({ request, url }) {
	try {
		requireAuth(request);
		
		const referralId = url.searchParams.get('id');
		
		if (!referralId) {
			return json({ error: 'Referral ID is required' }, { status: 400 });
		}
		
		const success = await deactivateReferral(referralId);
		
		if (!success) {
			return json({ error: 'Failed to deactivate referral' }, { status: 500 });
		}
		
		return json({ success: true });
	} catch (error) {
		console.error('Deactivate referral error:', error);
		if (error.message === 'Unauthorized') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}