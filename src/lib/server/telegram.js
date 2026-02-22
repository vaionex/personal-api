import { TELEGRAM_BOT_TOKEN, OWNER_TELEGRAM_ID } from '$env/static/private';

const API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export async function sendTelegram(chatId, text, opts = {}) {
	const res = await fetch(`${API}/sendMessage`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			chat_id: chatId,
			text,
			parse_mode: 'HTML',
			...opts,
		}),
	});
	return res.json();
}

export async function notifyOwner(interaction) {
	const { classification, query, response, senderName, channel, interactionId } = interaction;

	if (classification === 'auto') return; // Don't bother owner for auto-handled

	const emoji = classification === 'escalate' ? '🔴' : '🟡';
	const label = classification === 'escalate' ? 'NEEDS YOU' : 'DRAFT READY';

	let text = `${emoji} <b>${label}</b>\n\n`;
	text += `<b>From:</b> ${senderName || 'Unknown'} (${channel})\n`;
	text += `<b>Message:</b> ${query}\n`;

	if (response) {
		text += `\n<b>Draft response:</b>\n<i>${response}</i>\n`;
	}

	const keyboard = {
		inline_keyboard: [
			[
				{ text: '✅ Approve & Send', callback_data: `approve:${interactionId}` },
				{ text: '✏️ Edit', callback_data: `edit:${interactionId}` },
			],
			[
				{ text: '❌ Reject', callback_data: `reject:${interactionId}` },
				{ text: '💬 Reply myself', callback_data: `manual:${interactionId}` },
			],
		],
	};

	await sendTelegram(OWNER_TELEGRAM_ID, text, { reply_markup: keyboard });
}

export async function answerCallback(callbackQueryId, text) {
	await fetch(`${API}/answerCallbackQuery`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
	});
}
