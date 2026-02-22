import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase.js';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_DURATION = 120; // 120 seconds

export async function POST({ request }) {
	try {
		const formData = await request.formData();
		const videoFile = formData.get('video');
		const senderName = formData.get('sender_name');
		const senderEmail = formData.get('sender_email');
		const conversationId = formData.get('conversation_id');
		
		if (!videoFile || !senderName || !senderEmail) {
			return json({ error: 'video, sender_name, and sender_email are required' }, { status: 400 });
		}
		
		// Check file size
		if (videoFile.size > MAX_FILE_SIZE) {
			return json({ error: 'File too large (max 50MB)' }, { status: 413 });
		}
		
		// Generate unique filename
		const fileExt = videoFile.name.split('.').pop();
		const fileName = `pitch_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
		
		// Upload to Supabase Storage
		const { data: uploadData, error: uploadError } = await supabase.storage
			.from('pitches')
			.upload(fileName, videoFile, {
				contentType: videoFile.type,
				upsert: false,
			});
		
		if (uploadError) {
			console.error('Storage upload error:', uploadError);
			return json({ error: 'Failed to upload video' }, { status: 500 });
		}
		
		// Get public URL for the video
		const { data: urlData } = supabase.storage
			.from('pitches')
			.getPublicUrl(fileName);
		
		// Create pitch record
		const { data: pitch, error: dbError } = await supabase
			.from('video_pitches')
			.insert({
				conversation_id: conversationId || null,
				sender_name: senderName,
				sender_email: senderEmail,
				video_url: urlData.publicUrl,
				status: 'pending',
			})
			.select()
			.single();
		
		if (dbError) {
			console.error('Database insert error:', dbError);
			// Try to cleanup the uploaded file
			await supabase.storage.from('pitches').remove([fileName]);
			return json({ error: 'Failed to create pitch record' }, { status: 500 });
		}
		
		return json({
			pitch_id: pitch.id,
			status: 'uploaded',
			message: 'Video uploaded successfully. Starting transcription...',
		});
	} catch (error) {
		console.error('Upload error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function OPTIONS() {
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		},
	});
}