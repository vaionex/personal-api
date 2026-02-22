/**
 * Personal API Embed Widget
 * Usage: <script src="https://your-domain.com/widget.js" data-api="https://your-domain.com"></script>
 */
(function() {
	const script = document.currentScript;
	const API = script?.getAttribute('data-api') || '';
	const THEME = script?.getAttribute('data-theme') || 'light';
	
	const style = document.createElement('style');
	style.textContent = `
		#papi-widget-btn { position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px; border-radius: 50%; background: #2563eb; color: white; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(37,99,235,0.3); z-index: 99999; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
		#papi-widget-btn:hover { transform: scale(1.05); }
		#papi-widget-btn svg { width: 24px; height: 24px; }
		#papi-widget-panel { position: fixed; bottom: 92px; right: 24px; width: 380px; max-height: 500px; background: white; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); z-index: 99999; display: none; flex-direction: column; overflow: hidden; font-family: Inter, system-ui, sans-serif; }
		#papi-widget-panel.open { display: flex; }
		#papi-widget-header { padding: 16px 20px; border-bottom: 1px solid #f3f4f6; }
		#papi-widget-header h3 { margin: 0; font-size: 15px; font-weight: 600; color: #111827; }
		#papi-widget-header p { margin: 4px 0 0; font-size: 12px; color: #9ca3af; }
		#papi-widget-messages { flex: 1; overflow-y: auto; padding: 16px 20px; max-height: 320px; }
		.papi-msg { margin-bottom: 12px; }
		.papi-msg-user { text-align: right; }
		.papi-msg-user span { background: #2563eb; color: white; padding: 8px 14px; border-radius: 16px 16px 4px 16px; display: inline-block; font-size: 14px; max-width: 85%; text-align: left; }
		.papi-msg-bot span { background: #f3f4f6; color: #374151; padding: 8px 14px; border-radius: 16px 16px 16px 4px; display: inline-block; font-size: 14px; max-width: 85%; }
		.papi-msg-meta { font-size: 10px; color: #9ca3af; margin-top: 2px; }
		#papi-widget-input { padding: 12px 20px; border-top: 1px solid #f3f4f6; display: flex; gap: 8px; }
		#papi-widget-input input { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; font-size: 14px; outline: none; font-family: inherit; }
		#papi-widget-input input:focus { border-color: #2563eb; }
		#papi-widget-input button { background: #2563eb; color: white; border: none; border-radius: 8px; padding: 8px 16px; font-size: 14px; cursor: pointer; font-family: inherit; font-weight: 500; }
		#papi-widget-input button:disabled { opacity: 0.5; }
	`;
	document.head.appendChild(style);

	const btn = document.createElement('button');
	btn.id = 'papi-widget-btn';
	btn.innerHTML = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>';
	btn.setAttribute('aria-label', 'Ask Robin');
	document.body.appendChild(btn);

	const panel = document.createElement('div');
	panel.id = 'papi-widget-panel';
	panel.innerHTML = `
		<div id="papi-widget-header">
			<h3>Ask Robin</h3>
			<p>AI-powered answers about Robin's work and availability</p>
		</div>
		<div id="papi-widget-messages"></div>
		<div id="papi-widget-input">
			<input type="text" placeholder="Ask anything..." id="papi-input" />
			<button id="papi-send">Send</button>
		</div>
	`;
	document.body.appendChild(panel);

	let open = false;
	btn.onclick = () => { open = !open; panel.classList.toggle('open', open); if (open) document.getElementById('papi-input').focus(); };

	const msgArea = panel.querySelector('#papi-widget-messages');
	const input = panel.querySelector('#papi-input');
	const sendBtn = panel.querySelector('#papi-send');

	function addMsg(text, type, meta) {
		const div = document.createElement('div');
		div.className = 'papi-msg papi-msg-' + type;
		div.innerHTML = '<span>' + text.replace(/</g, '&lt;') + '</span>' + (meta ? '<div class="papi-msg-meta">' + meta + '</div>' : '');
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
				body: JSON.stringify({ query: q, name: 'Widget visitor', channel: 'widget' }),
			});
			const data = await res.json();
			addMsg(data.response || data.error || 'No response', 'bot', data.type === 'auto' ? 'Answered automatically' : 'Forwarded to Robin');
		} catch(e) {
			addMsg('Sorry, could not connect.', 'bot');
		}
		sendBtn.disabled = false;
	}

	sendBtn.onclick = send;
	input.onkeydown = (e) => { if (e.key === 'Enter') send(); };
})();
