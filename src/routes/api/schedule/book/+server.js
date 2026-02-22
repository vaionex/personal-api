import { json } from '@sveltejs/kit';
import { bookSlot } from '$lib/server/calendar.js';
import { notify } from '$lib/server/notify.js';
import { generateDossier } from '$lib/server/dossier.js';
import { createProofEvent } from '$lib/server/proof.js';
import { sendBookingConfirmation } from '$lib/server/email.js';
import { PUBLIC_OWNER_NAME, PUBLIC_APP_URL } from '$env/static/public';

export async function POST({ request }) {
	const { eventType, startTime, name, email, notes, timezone } = await request.json();

	if (!eventType || !startTime || !name || !email) {
		return json({ error: 'eventType, startTime, name, and email are required' }, { status: 400 });
	}

	// Basic email validation
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return json({ error: 'Invalid email address' }, { status: 400 });
	}

	const result = await bookSlot({
		eventTypeSlug: eventType,
		startTime,
		name,
		email,
		notes,
		timezone,
	});

	if (result.error) return json({ error: result.error }, { status: 400 });

	// Notify owner
	const owner = PUBLIC_OWNER_NAME || 'Owner';
	const appUrl = PUBLIC_APP_URL || '';
	const start = new Date(startTime);
	
	await notify({
		type: 'booking',
		title: `New booking: ${result.event.name}`,
		message: `${name} (${email}) booked "${result.event.name}" on ${start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}${notes ? `\nNotes: ${notes}` : ''}`,
		url: `${appUrl}/admin/bookings`,
	});

	// Create proof event for booking
	await createProofEvent({
		eventType: 'booked',
		senderName: name,
		meetingType: result.event.name
	});

	// Send booking confirmation email
	const endTime = new Date(new Date(startTime).getTime() + result.event.duration_minutes * 60000);
	const cancelUrl = `${appUrl}/schedule/cancel/${result.booking.cancel_token}`;
	
	await sendBookingConfirmation({
		guestEmail: email,
		guestName: name,
		eventType: result.event.name,
		startTime,
		endTime: endTime.toISOString(),
		cancelUrl,
		ownerName: owner
	});

	// Generate prep dossier
	try {
		const dossier = await generateDossier(result.booking.id);
		
		// Notify owner with dossier summary
		if (dossier) {
			await notify({
				type: 'dossier',
				title: `📋 Meeting Prep: ${result.event.name} with ${name}`,
				message: `📅 ${start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}

Summary: ${dossier.conversation_summary || 'No prior conversation'}
They want: ${dossier.their_ask || 'Not specified'}
${dossier.talking_points && dossier.talking_points.length > 0 ? `Key points: ${dossier.talking_points.join(', ')}` : ''}

Full dossier: ${appUrl}/admin/dossiers`,
				url: `${appUrl}/admin/dossiers`,
			});
		}
	} catch (error) {
		console.error('Failed to generate dossier:', error);
		// Don't fail the booking if dossier generation fails
	}

	return json({
		message: result.message,
		booking: {
			id: result.booking.id,
			start: result.booking.start_time,
			end: result.booking.end_time,
			cancelToken: result.booking.cancel_token,
			cancelUrl: `${appUrl}/schedule/cancel/${result.booking.cancel_token}`,
		},
	});
}
