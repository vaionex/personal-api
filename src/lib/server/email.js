import { Resend } from 'resend';
import { RESEND_API_KEY, EMAIL_FROM } from '$env/static/private';
import { PUBLIC_OWNER_NAME } from '$env/static/public';

let resend = null;

// Initialize Resend if API key is available
if (RESEND_API_KEY && RESEND_API_KEY !== 'placeholder') {
	resend = new Resend(RESEND_API_KEY);
}

/**
 * Base email template with consistent styling
 */
function createEmailTemplate(content, ownerName = 'Personal API') {
	return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Personal API</title>
	<style>
		@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
		
		body {
			margin: 0;
			padding: 0;
			font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
			background-color: #f9fafb;
			color: #374151;
			line-height: 1.6;
		}
		
		.container {
			max-width: 600px;
			margin: 0 auto;
			background-color: #ffffff;
			padding: 40px;
			border-radius: 8px;
			box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
			margin-top: 40px;
			margin-bottom: 40px;
		}
		
		h1 {
			color: #111827;
			font-size: 24px;
			font-weight: 600;
			margin-bottom: 24px;
			margin-top: 0;
		}
		
		h2 {
			color: #111827;
			font-size: 20px;
			font-weight: 600;
			margin-bottom: 16px;
			margin-top: 32px;
		}
		
		p {
			margin-bottom: 16px;
			color: #4b5563;
		}
		
		.btn {
			display: inline-block;
			padding: 12px 24px;
			background-color: #2563eb;
			color: #ffffff !important;
			text-decoration: none;
			border-radius: 6px;
			font-weight: 500;
			margin: 16px 0;
		}
		
		.btn:hover {
			background-color: #1d4ed8;
		}
		
		.details {
			background-color: #f3f4f6;
			padding: 20px;
			border-radius: 6px;
			margin: 20px 0;
		}
		
		.details p {
			margin-bottom: 8px;
		}
		
		.details p:last-child {
			margin-bottom: 0;
		}
		
		.footer {
			margin-top: 40px;
			padding-top: 24px;
			border-top: 1px solid #e5e7eb;
			text-align: center;
			font-size: 14px;
			color: #6b7280;
		}
		
		.footer a {
			color: #2563eb;
			text-decoration: none;
		}
	</style>
</head>
<body>
	<div class="container">
		${content}
		
		<div class="footer">
			<p>Powered by <a href="#">Personal API</a></p>
		</div>
	</div>
</body>
</html>
	`.trim();
}

/**
 * Send a generic email
 */
export async function sendEmail({ to, subject, html }) {
	if (!resend) {
		console.log(`[EMAIL DISABLED] Would send email to ${to}: ${subject}`);
		return { success: false, reason: 'Resend not configured' };
	}

	if (!EMAIL_FROM || EMAIL_FROM === 'noreply@yourdomain.com') {
		console.log(`[EMAIL DISABLED] EMAIL_FROM not configured. Would send to ${to}: ${subject}`);
		return { success: false, reason: 'EMAIL_FROM not configured' };
	}

	try {
		const result = await resend.emails.send({
			from: EMAIL_FROM,
			to: [to],
			subject,
			html
		});

		console.log(`✅ Email sent to ${to}: ${subject}`);
		return { success: true, id: result.id };
	} catch (error) {
		console.error(`❌ Failed to send email to ${to}:`, error);
		return { success: false, error: error.message };
	}
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmation({
	guestEmail,
	guestName,
	eventType,
	startTime,
	endTime,
	cancelUrl,
	ownerName = PUBLIC_OWNER_NAME || 'Personal API'
}) {
	const start = new Date(startTime);
	const end = new Date(endTime);
	
	const content = `
		<h1>Meeting Confirmed 🗓️</h1>
		
		<p>Hi ${guestName},</p>
		
		<p>Your meeting with ${ownerName} has been confirmed! Here are the details:</p>
		
		<div class="details">
			<p><strong>Meeting Type:</strong> ${eventType}</p>
			<p><strong>Date:</strong> ${start.toLocaleDateString('en-US', { 
				weekday: 'long', 
				year: 'numeric', 
				month: 'long', 
				day: 'numeric' 
			})}</p>
			<p><strong>Time:</strong> ${start.toLocaleTimeString('en-US', { 
				hour: 'numeric', 
				minute: '2-digit',
				timeZoneName: 'short' 
			})}</p>
			<p><strong>Duration:</strong> ${Math.round((end - start) / (1000 * 60))} minutes</p>
		</div>
		
		<p>A calendar invite will be sent separately with meeting details.</p>
		
		<p>If you need to cancel or reschedule, you can do so using the link below:</p>
		
		<a href="${cancelUrl}" class="btn">Cancel/Reschedule Meeting</a>
		
		<p>Looking forward to our conversation!</p>
		
		<p>Best regards,<br>${ownerName}</p>
	`;
	
	const html = createEmailTemplate(content, ownerName);
	
	return await sendEmail({
		to: guestEmail,
		subject: `Meeting Confirmed - ${eventType}`,
		html
	});
}

/**
 * Send booking reminder email
 */
export async function sendBookingReminder({
	guestEmail,
	guestName,
	eventType,
	startTime,
	ownerName = PUBLIC_OWNER_NAME || 'Personal API'
}) {
	const start = new Date(startTime);
	
	const content = `
		<h1>Meeting Reminder ⏰</h1>
		
		<p>Hi ${guestName},</p>
		
		<p>This is a friendly reminder about your upcoming meeting with ${ownerName}.</p>
		
		<div class="details">
			<p><strong>Meeting Type:</strong> ${eventType}</p>
			<p><strong>Date:</strong> ${start.toLocaleDateString('en-US', { 
				weekday: 'long', 
				year: 'numeric', 
				month: 'long', 
				day: 'numeric' 
			})}</p>
			<p><strong>Time:</strong> ${start.toLocaleTimeString('en-US', { 
				hour: 'numeric', 
				minute: '2-digit',
				timeZoneName: 'short' 
			})}</p>
		</div>
		
		<p>Please check your calendar for the meeting link and details.</p>
		
		<p>See you soon!</p>
		
		<p>Best regards,<br>${ownerName}</p>
	`;
	
	const html = createEmailTemplate(content, ownerName);
	
	return await sendEmail({
		to: guestEmail,
		subject: `Reminder: ${eventType} in 24 hours`,
		html
	});
}

/**
 * Send booking cancellation email
 */
export async function sendBookingCancellation({
	guestEmail,
	guestName,
	eventType,
	startTime,
	ownerName = PUBLIC_OWNER_NAME || 'Personal API'
}) {
	const start = new Date(startTime);
	
	const content = `
		<h1>Meeting Cancelled</h1>
		
		<p>Hi ${guestName},</p>
		
		<p>Your meeting with ${ownerName} has been cancelled.</p>
		
		<div class="details">
			<p><strong>Cancelled Meeting:</strong> ${eventType}</p>
			<p><strong>Originally Scheduled:</strong> ${start.toLocaleDateString('en-US', { 
				weekday: 'long', 
				year: 'numeric', 
				month: 'long', 
				day: 'numeric' 
			})} at ${start.toLocaleTimeString('en-US', { 
				hour: 'numeric', 
				minute: '2-digit',
				timeZoneName: 'short' 
			})}</p>
		</div>
		
		<p>If you'd like to reschedule, please feel free to book a new time slot when convenient.</p>
		
		<p>Thank you for your understanding.</p>
		
		<p>Best regards,<br>${ownerName}</p>
	`;
	
	const html = createEmailTemplate(content, ownerName);
	
	return await sendEmail({
		to: guestEmail,
		subject: `Meeting Cancelled - ${eventType}`,
		html
	});
}

/**
 * Send pitch result email (approved/rejected)
 */
export async function sendPitchResult({
	email,
	name,
	approved,
	ownerName = PUBLIC_OWNER_NAME || 'Personal API'
}) {
	const content = approved ? `
		<h1>Pitch Approved! 🎉</h1>
		
		<p>Hi ${name},</p>
		
		<p>Great news! ${ownerName} has reviewed your video pitch and would like to connect.</p>
		
		<p>You should expect to hear from them soon to schedule a conversation.</p>
		
		<p>Thanks for taking the time to share your pitch!</p>
		
		<p>Best regards,<br>${ownerName}</p>
	` : `
		<h1>Thanks for Your Pitch</h1>
		
		<p>Hi ${name},</p>
		
		<p>Thank you for submitting your video pitch to ${ownerName}.</p>
		
		<p>After review, it doesn't look like there's a strong fit for collaboration at this time. However, I appreciate you taking the time to reach out and share your ideas.</p>
		
		<p>Please feel free to stay in touch and reach out again in the future if you have other opportunities that might be relevant.</p>
		
		<p>Best regards,<br>${ownerName}</p>
	`;
	
	const html = createEmailTemplate(content, ownerName);
	
	return await sendEmail({
		to: email,
		subject: approved ? 'Pitch Approved!' : 'Thanks for Your Pitch',
		html
	});
}