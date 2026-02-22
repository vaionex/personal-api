import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase.js';
import { getOrCreateTrust, addTrustPoints } from '$lib/server/trust.js';
import { sendPitchResult } from '$lib/server/email.js';
import { ADMIN_PASSWORD } from '$env/static/private';
import { PUBLIC_OWNER_NAME } from '$env/static/public';

function requireAuth(request) {
	const auth = request.headers.get('authorization');
	if (!auth || auth !== `Bearer ${ADMIN_PASSWORD}`) {
		throw new Error('Unauthorized');
	}
}

export async function GET({ request, url }) {
	try {
		requireAuth(request);
		
		const status = url.searchParams.get('status');
		const limit = parseInt(url.searchParams.get('limit')) || 50;
		const offset = parseInt(url.searchParams.get('offset')) || 0;
		
		let query = supabase
			.from('video_pitches')
			.select(`
				*,
				trust_scores(id, score, tier, sender_name)
			`)
			.order('created_at', { ascending: false })
			.range(offset, offset + limit - 1);
		
		if (status) {
			query = query.eq('status', status);
		}
		
		const { data: pitches } = await query;
		
		return json({ pitches: pitches || [] });
	} catch (error) {
		console.error('Admin pitches API error:', error);
		if (error.message === 'Unauthorized') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function PATCH({ request }) {
	try {
		requireAuth(request);
		
		const { pitch_id, status, admin_notes } = await request.json();
		
		if (!pitch_id || !status) {
			return json({ error: 'pitch_id and status are required' }, { status: 400 });
		}
		
		if (!['approved', 'rejected', 'reviewed'].includes(status)) {
			return json({ error: 'Invalid status' }, { status: 400 });
		}
		
		// Get the current pitch
		const { data: pitch } = await supabase
			.from('video_pitches')
			.select('*')
			.eq('id', pitch_id)
			.single();
		
		if (!pitch) {
			return json({ error: 'Pitch not found' }, { status: 404 });
		}
		
		// Update the pitch status
		const updates = {
			status,
			...(admin_notes && { metadata: { ...pitch.metadata, admin_notes } }),
		};
		
		const { error } = await supabase
			.from('video_pitches')
			.update(updates)
			.eq('id', pitch_id);
		
		if (error) {
			return json({ error: error.message }, { status: 500 });
		}
		
		// Handle trust score updates based on approval/rejection
		if (status === 'approved' && pitch.status !== 'approved') {
			// Get or create trust record for this sender
			const trust = await getOrCreateTrust(pitch.sender_email, pitch.sender_name, pitch.sender_email);
			if (trust) {
				await addTrustPoints(trust.id, 10, 'video_pitch_approved');
				// Link the trust score to the pitch
				await supabase
					.from('video_pitches')
					.update({ trust_score_id: trust.id })
					.eq('id', pitch_id);
			}
		} else if (status === 'rejected' && pitch.status === 'approved') {
			// If previously approved but now rejected, remove trust points
			if (pitch.trust_score_id) {
				await addTrustPoints(pitch.trust_score_id, -10, 'video_pitch_rejected');
			}
		}
		
		// If approved, also auto-qualify any related conversation
		if (status === 'approved' && pitch.conversation_id) {
			// Mark the conversation as qualified
			const { data: conversation } = await supabase
				.from('conversations')
				.select('messages')
				.eq('id', pitch.conversation_id)
				.single();
			
			if (conversation) {
				const messages = conversation.messages || [];
				// Add a system message indicating the video pitch was approved
				messages.push({
					role: 'system',
					content: 'Video pitch approved - sender is now qualified for meetings',
					timestamp: new Date().toISOString(),
					qualified: true,
				});
				
				await supabase
					.from('conversations')
					.update({ messages })
					.eq('id', pitch.conversation_id);
			}
		}

		// Send email notification when status changes to approved or rejected
		if ((status === 'approved' || status === 'rejected') && pitch.status !== status) {
			await sendPitchResult({
				email: pitch.sender_email,
				name: pitch.sender_name || 'there',
				approved: status === 'approved',
				ownerName: PUBLIC_OWNER_NAME || 'Personal API'
			});
		}
		
		return json({ success: true });
	} catch (error) {
		console.error('Update pitch error:', error);
		if (error.message === 'Unauthorized') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}