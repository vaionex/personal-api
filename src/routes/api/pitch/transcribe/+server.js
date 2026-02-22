import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase.js';
import { callLLM } from '$lib/server/providers/index.js';
import { getOrCreateTrust, addTrustPoints } from '$lib/server/trust.js';
import { OPENAI_API_KEY } from '$env/static/private';
import { PUBLIC_OWNER_NAME } from '$env/static/public';

export async function POST({ request }) {
	try {
		const { pitch_id } = await request.json();
		
		if (!pitch_id) {
			return json({ error: 'pitch_id is required' }, { status: 400 });
		}
		
		// Get the pitch record
		const { data: pitch } = await supabase
			.from('video_pitches')
			.select('*')
			.eq('id', pitch_id)
			.single();
		
		if (!pitch) {
			return json({ error: 'Pitch not found' }, { status: 404 });
		}
		
		if (pitch.status !== 'pending') {
			return json({ error: 'Pitch already processed' }, { status: 400 });
		}
		
		let transcript = '';
		let aiEvaluation = '';
		let aiScore = 0;
		
		// Transcribe video using OpenAI Whisper (simplified approach)
		// In a real implementation, you'd extract audio from video first
		if (OPENAI_API_KEY) {
			try {
				// For now, we'll simulate transcription or use a placeholder
				// In production, you'd:
				// 1. Download the video from Supabase Storage
				// 2. Extract audio using ffmpeg
				// 3. Send audio to OpenAI Whisper API
				// 4. Get transcript back
				
				transcript = `[Transcription would be generated here using OpenAI Whisper API]
Sender: ${pitch.sender_name}
Email: ${pitch.sender_email}
Note: This is a placeholder transcript. In production, this would contain the actual speech-to-text conversion of the video pitch.`;
				
				// Evaluate the pitch using LLM
				const evaluationPrompt = `You are evaluating a video pitch for ${PUBLIC_OWNER_NAME}. 

Transcript:
${transcript}

Evaluate this pitch on a scale of 1-10 based on:
- Specificity of the request (not vague)
- Relevance to ${PUBLIC_OWNER_NAME}'s work
- Clear value proposition
- Professional presentation
- Shows they've done research

Respond with JSON only:
{
  "score": 1-10,
  "evaluation": "detailed assessment explaining the score",
  "genuine": true/false,
  "recommended_action": "approve" | "review" | "decline"
}`;

				const llmResponse = await callLLM({
					system: 'You are an expert at evaluating business pitches and proposals.',
					messages: [{ role: 'user', content: evaluationPrompt }]
				});
				
				try {
					const evaluation = JSON.parse(llmResponse.text);
					aiScore = evaluation.score;
					aiEvaluation = evaluation.evaluation;
					
					// Update pitch record
					await supabase
						.from('video_pitches')
						.update({
							transcript,
							ai_evaluation: aiEvaluation,
							ai_score: aiScore,
							status: evaluation.score >= 7 ? 'approved' : (evaluation.score >= 5 ? 'reviewed' : 'rejected'),
						})
						.eq('id', pitch_id);
					
					// Handle trust score updates based on score
					if (evaluation.score >= 7) {
						// Auto-approve and add trust points
						const trust = await getOrCreateTrust(pitch.sender_email, pitch.sender_name, pitch.sender_email);
						if (trust) {
							await addTrustPoints(trust.id, 10, 'video_pitch_approved');
							await supabase
								.from('video_pitches')
								.update({ trust_score_id: trust.id })
								.eq('id', pitch_id);
						}
					}
					
					return json({
						pitch_id,
						transcript,
						evaluation: aiEvaluation,
						score: aiScore,
						status: evaluation.score >= 7 ? 'approved' : (evaluation.score >= 5 ? 'reviewed' : 'rejected'),
						recommended_action: evaluation.recommended_action,
					});
				} catch (parseError) {
					console.error('Failed to parse LLM evaluation:', parseError);
					throw new Error('LLM evaluation parsing failed');
				}
			} catch (error) {
				console.error('Transcription/evaluation error:', error);
				// Update with error status
				await supabase
					.from('video_pitches')
					.update({
						status: 'error',
						ai_evaluation: 'Failed to process video pitch: ' + error.message,
					})
					.eq('id', pitch_id);
				
				return json({ error: 'Failed to process video pitch' }, { status: 500 });
			}
		} else {
			// No OpenAI API key - mark as needing manual review
			await supabase
				.from('video_pitches')
				.update({
					status: 'reviewed',
					ai_evaluation: 'Automatic transcription not available - requires manual review',
				})
				.eq('id', pitch_id);
			
			return json({
				pitch_id,
				status: 'reviewed',
				message: 'Video uploaded successfully. Manual review required.',
			});
		}
	} catch (error) {
		console.error('Transcription error:', error);
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