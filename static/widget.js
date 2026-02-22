/**
 * Personal API Embed Widget
 * Usage: <script src="https://your-domain.com/widget.js" data-api="https://your-domain.com"></script>
 */
(function() {
	const script = document.currentScript;
	const API = script?.getAttribute('data-api') || '';
	const NAME = script?.getAttribute('data-name') || 'AI Assistant';
	const COLOR = script?.getAttribute('data-color') || '#111827';
	const POS = script?.getAttribute('data-position') || 'right';
	const THEME = script?.getAttribute('data-theme') || 'light';

	const isDark = THEME === 'dark';
	const bg = isDark ? '#1f2937' : 'white';
	const border = isDark ? '#374151' : '#f3f4f6';
	const text = isDark ? '#f9fafb' : '#374151';
	const textMuted = isDark ? '#9ca3af' : '#9ca3af';
	const inputBg = isDark ? '#111827' : 'white';
	const inputBorder = isDark ? '#4b5563' : '#e5e7eb';
	const msgBotBg = isDark ? '#374151' : '#f3f4f6';

	const side = POS === 'left' ? 'left: 24px' : 'right: 24px';

	const style = document.createElement('style');
	style.textContent = `
		#papi-widget-btn { position: fixed; bottom: 24px; ${side}; width: 56px; height: 56px; border-radius: 50%; background: ${COLOR}; color: white; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 99999; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
		#papi-widget-btn:hover { transform: scale(1.05); }
		#papi-widget-btn svg { width: 24px; height: 24px; }
		#papi-widget-panel { position: fixed; bottom: 92px; ${side}; width: 380px; max-height: 520px; background: ${bg}; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); z-index: 99999; display: none; flex-direction: column; overflow: hidden; font-family: Inter, system-ui, sans-serif; }
		#papi-widget-panel.open { display: flex; }
		#papi-widget-header { padding: 16px 20px; border-bottom: 1px solid ${border}; }
		#papi-widget-header h3 { margin: 0; font-size: 15px; font-weight: 600; color: ${isDark ? '#f9fafb' : '#111827'}; }
		#papi-widget-header p { margin: 4px 0 0; font-size: 12px; color: ${textMuted}; }
		#papi-widget-qualified { display: none; padding: 8px 20px; background: #f0fdf4; border-bottom: 1px solid #dcfce7; }
		#papi-widget-qualified a { font-size: 12px; color: #15803d; font-weight: 500; text-decoration: none; display: flex; align-items: center; gap: 6px; }
		#papi-widget-qualified a:hover { color: #166534; }
		#papi-widget-messages { flex: 1; overflow-y: auto; padding: 16px 20px; max-height: 320px; }
		.papi-msg { margin-bottom: 12px; }
		.papi-msg-user { text-align: right; }
		.papi-msg-user span { background: ${COLOR}; color: white; padding: 8px 14px; border-radius: 16px 16px 4px 16px; display: inline-block; font-size: 14px; max-width: 85%; text-align: left; }
		.papi-msg-bot span { background: ${msgBotBg}; color: ${text}; padding: 8px 14px; border-radius: 16px 16px 16px 4px; display: inline-block; font-size: 14px; max-width: 85%; }
		.papi-msg-bot span a { color: #2563eb; text-decoration: underline; }
		.papi-msg-meta { font-size: 10px; color: ${textMuted}; margin-top: 2px; }
		.papi-msg-meta.qualified { color: #16a34a; font-weight: 500; }
		#papi-widget-input { padding: 12px 20px; border-top: 1px solid ${border}; display: flex; gap: 8px; }
		#papi-widget-input input { flex: 1; border: 1px solid ${inputBorder}; border-radius: 8px; padding: 8px 12px; font-size: 14px; outline: none; font-family: inherit; background: ${inputBg}; color: ${isDark ? '#f9fafb' : '#111827'}; }
		#papi-widget-input input:focus { border-color: ${COLOR}; }
		#papi-widget-input button { background: ${COLOR}; color: white; border: none; border-radius: 8px; padding: 8px 16px; font-size: 14px; cursor: pointer; font-family: inherit; font-weight: 500; }
		#papi-widget-input button:disabled { opacity: 0.5; }
	`;
	document.head.appendChild(style);

	const btn = document.createElement('button');
	btn.id = 'papi-widget-btn';
	btn.innerHTML = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>';
	btn.setAttribute('aria-label', `Talk to ${NAME}`);
	document.body.appendChild(btn);

	const panel = document.createElement('div');
	panel.id = 'papi-widget-panel';
	panel.innerHTML = `
		<div id="papi-widget-header">
			<h3>${esc(NAME)}</h3>
			<p>Tell me what you need — I'll qualify you for a meeting</p>
			<div id="papi-widget-stats" style="display: none; font-size: 11px; color: ${textMuted}; margin-top: 4px;"></div>
		</div>
		<div id="papi-widget-qualified"><a href="${API}/schedule" target="_blank">✓ You're qualified — book a meeting →</a></div>
		<div id="papi-widget-messages"></div>
		<div id="papi-widget-input">
			<input type="text" placeholder="Tell me what you need..." id="papi-input" />
			<button id="papi-send">Send</button>
		</div>
	`;
	document.body.appendChild(panel);

	let open = false;
	let conversationId = null;
	let isQualified = false;

	btn.onclick = () => { 
		open = !open; 
		panel.classList.toggle('open', open); 
		if (open) {
			document.getElementById('papi-input').focus();
			loadStats();
		}
	};

	const msgArea = panel.querySelector('#papi-widget-messages');
	const input = panel.querySelector('#papi-input');
	const sendBtn = panel.querySelector('#papi-send');
	const qualifiedBar = panel.querySelector('#papi-widget-qualified');

	function addMsg(text, type, meta, qualified) {
		const div = document.createElement('div');
		div.className = 'papi-msg papi-msg-' + type;
		const linkified = type === 'bot' ? text.replace(/</g, '&lt;').replace(/(https?:\/\/[^\s)]+)/g, '<a href="$1" target="_blank">$1</a>') : esc(text);
		let metaHtml = '';
		if (meta) metaHtml = `<div class="papi-msg-meta${qualified ? ' qualified' : ''}">${esc(meta)}</div>`;
		div.innerHTML = '<span>' + linkified + '</span>' + metaHtml;
		msgArea.appendChild(div);
		msgArea.scrollTop = msgArea.scrollHeight;
	}

	async function send() {
		const q = input.value.trim();
		if (!q) return;
		input.value = '';
		addMsg(q, 'user');
		sendBtn.disabled = true;
		try {
			const res = await fetch(API + '/api/ask', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: q, name: 'Widget visitor', channel: 'widget', conversation_id: conversationId }),
			});
			const data = await res.json();
			if (data.conversation_id) conversationId = data.conversation_id;
			if (data.qualified && !isQualified) {
				isQualified = true;
				qualifiedBar.style.display = 'block';
			}
			const meta = data.qualified ? 'Qualified — booking access granted' : (data.type !== 'auto' ? 'Forwarded for review' : null);
			addMsg(data.response || data.error || 'No response', 'bot', meta, data.qualified);
		} catch(e) {
			addMsg('Sorry, could not connect.', 'bot');
		}
		sendBtn.disabled = false;
	}

	sendBtn.onclick = send;
	input.onkeydown = (e) => { if (e.key === 'Enter') send(); };

	async function loadStats() {
		try {
			const res = await fetch(API + '/api/proof?stats=true');
			const stats = await res.json();
			const statsDiv = panel.querySelector('#papi-widget-stats');
			if (stats.totalQualified > 0) {
				statsDiv.innerHTML = `${stats.totalQualified} people qualified this week`;
				statsDiv.style.display = 'block';
			}
		} catch(e) {
			// Silently fail if stats can't be loaded
		}
	}

	function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
})();
