import { supabase } from './supabase.js';

// Trust tier thresholds
export function getTier(score) {
	if (score >= 61) return 'vip';
	if (score >= 31) return 'trusted';
	if (score >= 11) return 'known';
	return 'new';
}

// Get or create trust record for a sender
export async function getOrCreateTrust(senderId, senderName, senderEmail) {
	if (!senderId && !senderEmail) return null;
	
	// Try to find existing trust record
	let { data: trust } = await supabase
		.from('trust_scores')
		.select('*')
		.or(senderId ? `sender_id.eq.${senderId}` : `sender_email.eq.${senderEmail}`)
		.maybeSingle();
	
	if (!trust) {
		// Create new trust record
		const { data: newTrust, error } = await supabase
			.from('trust_scores')
			.insert({
				sender_id: senderId || null,
				sender_email: senderEmail || null,
				sender_name: senderName || null,
				score: 0,
				tier: 'new',
			})
			.select()
			.single();
		
		if (error) {
			console.error('Failed to create trust record:', error);
			return null;
		}
		trust = newTrust;
	} else {
		// Update name/email if they've changed
		const updates = {};
		if (senderName && trust.sender_name !== senderName) updates.sender_name = senderName;
		if (senderEmail && trust.sender_email !== senderEmail) updates.sender_email = senderEmail;
		if (senderId && trust.sender_id !== senderId) updates.sender_id = senderId;
		
		if (Object.keys(updates).length > 0) {
			const { data: updatedTrust } = await supabase
				.from('trust_scores')
				.update(updates)
				.eq('id', trust.id)
				.select()
				.single();
			trust = updatedTrust || trust;
		}
	}
	
	return trust;
}

// Add or subtract trust points and recalculate tier
export async function addTrustPoints(trustId, points, reason = '') {
	if (!trustId || points === 0) return null;
	
	const { data: trust } = await supabase
		.from('trust_scores')
		.select('*')
		.eq('id', trustId)
		.single();
	
	if (!trust) return null;
	
	const newScore = Math.max(0, trust.score + points);
	const newTier = getTier(newScore);
	
	// Update specific counters based on reason
	const updates = {
		score: newScore,
		tier: newTier,
		last_interaction_at: new Date().toISOString(),
	};
	
	if (reason === 'interaction') {
		// Only increment if it's been more than 1 hour since last interaction
		const lastInteraction = new Date(trust.last_interaction_at);
		const hourAgo = new Date(Date.now() - 3600000);
		if (lastInteraction < hourAgo) {
			updates.total_interactions = trust.total_interactions + 1;
		} else {
			// Don't add points for rapid-fire interactions
			return trust;
		}
	} else if (reason === 'qualified') {
		updates.qualified_count = trust.qualified_count + 1;
	} else if (reason === 'meeting_booked') {
		updates.meetings_booked = trust.meetings_booked + 1;
	} else if (reason === 'meeting_completed') {
		updates.meetings_completed = trust.meetings_completed + 1;
	} else if (reason === 'no_show') {
		updates.no_shows = trust.no_shows + 1;
	}
	
	const { data: updatedTrust, error } = await supabase
		.from('trust_scores')
		.update(updates)
		.eq('id', trustId)
		.select()
		.single();
	
	if (error) {
		console.error('Failed to update trust score:', error);
		return trust;
	}
	
	console.log(`Trust updated: ${trust.sender_name || 'Unknown'} (${trust.sender_id || trust.sender_email}) ${points > 0 ? '+' : ''}${points} points (${reason}). Score: ${trust.score} → ${newScore}, Tier: ${trust.tier} → ${newTier}`);
	
	return updatedTrust;
}

// Get aggregate trust statistics for admin dashboard
export async function getTrustStats() {
	const { data: stats } = await supabase
		.from('trust_scores')
		.select('tier, score, total_interactions, meetings_booked, meetings_completed, no_shows');
	
	if (!stats || stats.length === 0) {
		return {
			total: 0,
			byTier: { new: 0, known: 0, trusted: 0, vip: 0 },
			avgScore: 0,
			totalInteractions: 0,
			totalMeetings: 0,
			noShowRate: 0,
		};
	}
	
	const byTier = { new: 0, known: 0, trusted: 0, vip: 0 };
	let totalScore = 0;
	let totalInteractions = 0;
	let totalMeetings = 0;
	let totalNoShows = 0;
	
	for (const record of stats) {
		byTier[record.tier] = (byTier[record.tier] || 0) + 1;
		totalScore += record.score || 0;
		totalInteractions += record.total_interactions || 0;
		totalMeetings += record.meetings_completed || 0;
		totalNoShows += record.no_shows || 0;
	}
	
	return {
		total: stats.length,
		byTier,
		avgScore: Math.round(totalScore / stats.length),
		totalInteractions,
		totalMeetings,
		noShowRate: totalMeetings > 0 ? Math.round((totalNoShows / (totalMeetings + totalNoShows)) * 100) : 0,
	};
}

// ---------------------------------------------------------------------------
// Referral system functions
// ---------------------------------------------------------------------------

// Create a new referral token
export async function createReferral(contactId, referrerName, note = '', maxUses = 1, expiresAt = null) {
	const { data: referral, error } = await supabase
		.from('referrals')
		.insert({
			referrer_contact_id: contactId || null,
			referrer_name: referrerName,
			note,
			max_uses: maxUses,
			expires_at: expiresAt,
		})
		.select()
		.single();
	
	if (error) {
		console.error('Failed to create referral:', error);
		return null;
	}
	
	return referral;
}

// Validate a referral token
export async function validateReferral(token) {
	if (!token) return { valid: false, reason: 'No token provided' };
	
	const { data: referral } = await supabase
		.from('referrals')
		.select('*')
		.eq('token', token)
		.eq('active', true)
		.single();
	
	if (!referral) {
		return { valid: false, reason: 'Invalid token' };
	}
	
	if (referral.expires_at && new Date(referral.expires_at) < new Date()) {
		return { valid: false, reason: 'Token expired' };
	}
	
	if (referral.uses >= referral.max_uses) {
		return { valid: false, reason: 'Token fully used' };
	}
	
	return {
		valid: true,
		referral,
		referrer_name: referral.referrer_name,
		note: referral.note,
	};
}

// Use a referral token (decrements uses, records usage)
export async function useReferral(token, name, email) {
	const validation = await validateReferral(token);
	if (!validation.valid) {
		return { success: false, error: validation.reason };
	}
	
	const referral = validation.referral;
	const usedBy = [...(referral.used_by || [])];
	usedBy.push({
		name: name || 'Unknown',
		email: email || null,
		used_at: new Date().toISOString(),
	});
	
	const { error } = await supabase
		.from('referrals')
		.update({
			uses: referral.uses + 1,
			used_by: usedBy,
		})
		.eq('id', referral.id);
	
	if (error) {
		console.error('Failed to use referral:', error);
		return { success: false, error: 'Failed to update referral' };
	}
	
	return {
		success: true,
		referral_data: {
			referrer_name: referral.referrer_name,
			note: referral.note,
			referrer_contact_id: referral.referrer_contact_id,
		},
	};
}

// Get all referrals for admin dashboard
export async function getAllReferrals() {
	const { data: referrals } = await supabase
		.from('referrals')
		.select(`
			*,
			contacts:referrer_contact_id(name, email, company)
		`)
		.order('created_at', { ascending: false });
	
	return referrals || [];
}

// Deactivate a referral
export async function deactivateReferral(referralId) {
	const { error } = await supabase
		.from('referrals')
		.update({ active: false })
		.eq('id', referralId);
	
	return !error;
}