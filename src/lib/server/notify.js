import { NOTIFY_WEBHOOK_URL } from '$env/static/private';
import { PUBLIC_APP_URL } from '$env/static/public';
import { notifyOwner as telegramNotify } from './telegram.js';

export async function notify({ type, query, sender, channel, response, interactionId }) {
	// Always try Telegram notification first (if configured)
	try {
		await telegramNotify({
			classification: type,
			query,
			response,
			senderName: sender,
			channel,
			interactionId
		});
	} catch (e) {
		console.error('Telegram notification failed:', e);
	}

	// Send to generic webhook if configured
	if (NOTIFY_WEBHOOK_URL && NOTIFY_WEBHOOK_URL !== 'placeholder') {
		try {
			const payload = {
				type,
				query,
				sender,
				channel,
				response,
				url: `${PUBLIC_APP_URL}/admin`,
				timestamp: new Date().toISOString(),
				interactionId
			};

			await fetch(NOTIFY_WEBHOOK_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'User-Agent': 'Personal-API-Webhook/1.0'
				},
				body: JSON.stringify(payload)
			});
		} catch (e) {
			console.error('Webhook notification failed:', e);
		}
	}
}