import { json } from '@sveltejs/kit';
import { processQuery } from '$lib/server/engine.js';
import { sendTelegram, notifyOwner, answerCallback } from '$lib/server/telegram.js';
import { supabase } from '$lib/server/supabase.js';
import { OWNER_TELEGRAM_ID } from '$env/static/private';

export async function POST({ request }) {
	const update = await request.json();

	// Handle callback queries (approve/reject/edit from owner)
	if (update.callback_query) {
		await handleCallback(update.callback_query);
		return json({ ok: true });
	}

	const message = update.message;
	if (!message?.text) return json({ ok: true });

	const chatId = String(message.chat.id);
	const text = message.text;
	const senderName = [message.from.first_name, message.from.last_name].filter(Boolean).join(' ');

	// Owner commands
	if (chatId === OWNER_TELEGRAM_ID) {
		if (text.startsWith('/stats')) {
			return await handleStats(chatId);
		}
		if (text.startsWith('/pending')) {
			return await handlePending(chatId);
		}
		// Owner's direct messages aren't processed by the engine
		await sendTelegram(chatId, "👋 I'm your Personal API bot. Use /stats or /pending to manage.");
		return json({ ok: true });
	}

	// Public queries — process through engine
	const result = await processQuery({
		query: text,
		channel: 'telegram',
		senderName,
		senderId: chatId,
	});

	if (result.classification === 'auto') {
		await sendTelegram(chatId, result.response);
	} else {
		await sendTelegram(chatId, "Thanks! I'll pass this to Robin and get back to you.");
		await notifyOwner({
			classification: result.classification,
			query: text,
			response: result.response,
			senderName,
			channel: 'telegram',
			interactionId: result.interactionId,
		});
	}

	return json({ ok: true });
}

async function handleCallback(cb) {
	const [action, interactionId] = cb.data.split(':');

	if (action === 'approve') {
		const { data } = await supabase
			.from('interactions')
			.update({ status: 'approved' })
			.eq('id', interactionId)
			.select()
			.single();

		if (data?.channel === 'telegram' && data?.sender_id) {
			await sendTelegram(data.sender_id, data.response);
		}
		await answerCallback(cb.id, '✅ Approved and sent!');

	} else if (action === 'reject') {
		await supabase
			.from('interactions')
			.update({ status: 'rejected' })
			.eq('id', interactionId);
		await answerCallback(cb.id, '❌ Rejected');

	} else if (action === 'edit') {
		await answerCallback(cb.id, '✏️ Reply to this message with your edited response');
		// TODO: capture next owner message as edit for this interaction

	} else if (action === 'manual') {
		await supabase
			.from('interactions')
			.update({ status: 'manual' })
			.eq('id', interactionId);
		await answerCallback(cb.id, '💬 Marked for manual reply');
	}
}

async function handleStats(chatId) {
	const { data: total } = await supabase.from('interactions').select('id', { count: 'exact', head: true });
	const { data: auto } = await supabase.from('interactions').select('id', { count: 'exact', head: true }).eq('classification', 'auto');
	const { data: pending } = await supabase.from('interactions').select('id', { count: 'exact', head: true }).eq('status', 'pending');

	const msg = `📊 <b>Personal API Stats</b>\n\nTotal interactions: ${total?.length || 0}\nAuto-handled: ${auto?.length || 0}\nPending review: ${pending?.length || 0}`;
	await sendTelegram(chatId, msg);
	return json({ ok: true });
}

async function handlePending(chatId) {
	const { data } = await supabase
		.from('interactions')
		.select('*')
		.eq('status', 'pending')
		.order('created_at', { ascending: false })
		.limit(5);

	if (!data?.length) {
		await sendTelegram(chatId, '✅ No pending drafts!');
		return json({ ok: true });
	}

	for (const i of data) {
		await notifyOwner({
			classification: i.classification,
			query: i.query,
			response: i.response,
			senderName: i.sender_name,
			channel: i.channel,
			interactionId: i.id,
		});
	}
	return json({ ok: true });
}
