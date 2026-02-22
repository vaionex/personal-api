/**
 * Personal API — LinkedIn Content Script
 * Adds "Draft reply" buttons to LinkedIn message threads.
 */

const API_KEY = 'papi-api-url';
let apiUrl = '';

chrome.storage.sync.get([API_KEY], (result) => {
	apiUrl = result[API_KEY] || '';
	if (apiUrl) init();
});

function init() {
	// Watch for new message threads being opened
	const observer = new MutationObserver(debounce(scanMessages, 500));
	observer.observe(document.body, { childList: true, subtree: true });
	scanMessages();
}

function debounce(fn, ms) {
	let timer;
	return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

function scanMessages() {
	// Find message thread containers
	const threads = document.querySelectorAll('.msg-conversation-card__content--selectable, .msg-s-message-list__event');
	
	// Find the active conversation's messages
	const messageList = document.querySelector('.msg-s-message-list');
	if (!messageList) return;
	
	// Find the last incoming message (not from you)
	const messages = messageList.querySelectorAll('.msg-s-event-listitem');
	if (!messages.length) return;
	
	const lastMessage = messages[messages.length - 1];
	if (lastMessage.querySelector('.papi-overlay')) return; // Already processed
	
	// Check if it's an incoming message (not from you)
	const senderEl = lastMessage.querySelector('.msg-s-message-group__profile-link, .msg-s-message-group__name');
	if (!senderEl) return;
	
	// Add the draft button overlay
	addDraftButton(lastMessage, senderEl.textContent.trim());
}

function addDraftButton(messageEl, senderName) {
	const overlay = document.createElement('div');
	overlay.className = 'papi-overlay';
	
	const draftBtn = document.createElement('button');
	draftBtn.className = 'papi-btn papi-btn-draft';
	draftBtn.textContent = '✨ Draft reply';
	draftBtn.onclick = () => generateDraft(messageEl, senderName, overlay);
	
	overlay.appendChild(draftBtn);
	messageEl.style.position = 'relative';
	messageEl.appendChild(overlay);
}

async function generateDraft(messageEl, senderName, overlay) {
	// Get the message text
	const msgText = messageEl.querySelector('.msg-s-event-listitem__body, .msg-s-event__content')?.textContent?.trim();
	if (!msgText) return;
	
	// Show loading
	const panel = document.createElement('div');
	panel.className = 'papi-draft-panel';
	panel.innerHTML = '<div class="papi-loading"><div class="papi-spinner"></div>Generating draft...</div>';
	overlay.appendChild(panel);
	
	try {
		const res = await fetch(apiUrl + '/api/ask', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				query: msgText,
				name: senderName,
				channel: 'linkedin',
				metadata: { url: window.location.href },
			}),
		});
		const data = await res.json();
		
		panel.innerHTML = `
			<h4>Draft Reply</h4>
			<div class="papi-classification papi-classification-${data.type}">${data.type === 'auto' ? 'Auto-respond' : 'Needs review'}</div>
			<div class="papi-draft-text">${escapeHtml(data.response)}</div>
			<div class="papi-draft-actions">
				<button class="papi-use-btn" id="papi-use">Use this</button>
				<button class="papi-edit-btn" id="papi-edit">Edit</button>
				<button class="papi-dismiss-btn" id="papi-dismiss">Dismiss</button>
			</div>
		`;
		
		panel.querySelector('#papi-use').onclick = () => {
			insertReply(data.response);
			panel.remove();
		};
		
		panel.querySelector('#papi-edit').onclick = () => {
			const textEl = panel.querySelector('.papi-draft-text');
			textEl.contentEditable = 'true';
			textEl.focus();
			panel.querySelector('#papi-use').textContent = 'Send edited';
			panel.querySelector('#papi-use').onclick = () => {
				insertReply(textEl.textContent);
				panel.remove();
			};
		};
		
		panel.querySelector('#papi-dismiss').onclick = () => panel.remove();
		
	} catch (e) {
		panel.innerHTML = '<div style="color:#dc2626;font-size:13px;">Failed to connect to Personal API. Check extension settings.</div>';
	}
}

function insertReply(text) {
	// Find LinkedIn's message input
	const input = document.querySelector('.msg-form__contenteditable [contenteditable="true"], .msg-form__msg-content-container--is-active [contenteditable="true"]');
	if (!input) {
		// Fallback: copy to clipboard
		navigator.clipboard.writeText(text);
		showToast('Copied to clipboard — paste into the message box');
		return;
	}
	
	input.focus();
	input.innerHTML = `<p>${escapeHtml(text)}</p>`;
	input.dispatchEvent(new Event('input', { bubbles: true }));
}

function showToast(msg) {
	const toast = document.createElement('div');
	toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#111827;color:white;padding:10px 20px;border-radius:8px;font-size:13px;z-index:100000;font-family:Inter,sans-serif;';
	toast.textContent = msg;
	document.body.appendChild(toast);
	setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(s) {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
