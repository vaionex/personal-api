<script>
	let { data } = $props();
	const ownerName = data.ownerName;

	let query = $state('');
	let messages = $state([]);
	let loading = $state(false);
	let conversationId = $state(null);
	let qualified = $state(false);

	async function ask() {
		if (!query.trim() || loading) return;
		const q = query.trim();
		query = '';
		messages.push({ text: q, type: 'user' });
		loading = true;

		try {
			const res = await fetch('/api/ask', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					query: q,
					name: 'Visitor',
					channel: 'widget',
					conversation_id: conversationId,
				}),
			});
			const data = await res.json();

			if (data.conversation_id) conversationId = data.conversation_id;
			if (data.qualified) qualified = true;

			messages.push({
				text: data.response || data.error || 'No response',
				type: 'bot',
				qualified: data.qualified,
				meta: data.type === 'auto'
					? (data.qualified ? 'Qualified — booking access granted' : null)
					: `Forwarded to ${ownerName}`,
			});
		} catch {
			messages.push({ text: 'Could not connect.', type: 'bot' });
		}
		loading = false;
	}

	// Parse booking links in response text
	function renderText(text) {
		// Turn URLs into clickable links
		return text.replace(
			/(https?:\/\/[^\s)]+)/g,
			'<a href="$1" target="_blank" rel="noopener" class="underline text-blue-600 hover:text-blue-700">$1</a>'
		);
	}
</script>

<svelte:head>
	<title>{ownerName} — Personal API</title>
	<meta name="description" content="Talk to {ownerName}'s AI surrogate. Qualify yourself to book a meeting." />
</svelte:head>

<div class="min-h-screen bg-white">
	<header class="border-b border-gray-100">
		<div class="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
					<span class="text-white text-xs font-bold">{ownerName.split(' ').map(n => n[0]).join('')}</span>
				</div>
				<span class="text-sm font-semibold text-gray-900">{ownerName}</span>
			</div>
			<div class="flex items-center gap-4">
				{#if qualified}
					<a href="/schedule" class="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5">
						<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
						Book a meeting
					</a>
				{/if}
				<a href="https://github.com/vaionex/personal-api" target="_blank" rel="noopener" class="text-gray-400 hover:text-gray-600 transition-colors">
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
				</a>
			</div>
		</div>
	</header>

	<div class="max-w-2xl mx-auto px-6">
		<!-- Hero -->
		<div class="py-16 text-center">
			<div class="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
				<span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
				Online
			</div>
			<h1 class="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Talk to me first.</h1>
			<p class="text-base text-gray-500 max-w-md mx-auto leading-relaxed">
				I'm {ownerName}'s AI. Tell me what you need — if it's worth a meeting, I'll give you access to the calendar.
			</p>
		</div>

		<!-- Chat -->
		<div class="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden mb-8">
			{#if messages.length > 0}
				<div class="p-5 space-y-4 max-h-[400px] overflow-y-auto">
					{#each messages as msg}
						{#if msg.type === 'user'}
							<div class="flex justify-end">
								<div class="bg-gray-900 text-white px-4 py-2.5 rounded-2xl rounded-br-sm text-sm max-w-[80%]">{msg.text}</div>
							</div>
						{:else}
							<div class="flex justify-start">
								<div class="max-w-[85%]">
									<div class="bg-white border border-gray-200 px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm text-gray-800">
										{@html renderText(msg.text)}
									</div>
									{#if msg.meta}
										<span class="text-[10px] mt-1 block ml-1 {msg.qualified ? 'text-green-600 font-medium' : 'text-gray-400'}">{msg.meta}</span>
									{/if}
								</div>
							</div>
						{/if}
					{/each}
					{#if loading}
						<div class="flex justify-start">
							<div class="bg-white border border-gray-200 px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm text-gray-400">
								<span class="inline-flex gap-1"><span class="animate-bounce">.</span><span class="animate-bounce" style="animation-delay:0.1s">.</span><span class="animate-bounce" style="animation-delay:0.2s">.</span></span>
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<div class="p-4 {messages.length > 0 ? 'border-t border-gray-100' : ''}">
				<div class="flex gap-3">
					<input
						bind:value={query}
						onkeydown={(e) => { if (e.key === 'Enter') ask(); }}
						placeholder={qualified ? `You're qualified — ask anything or book a time` : `Tell me what you need...`}
						class="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 transition-colors"
					/>
					<button
						onclick={ask}
						disabled={loading || !query.trim()}
						class="px-5 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
					>Send</button>
				</div>
			</div>
		</div>

		<!-- How it works (only shown before first message) -->
		{#if messages.length === 0}
			<div class="pb-12">
				<div class="grid grid-cols-3 gap-4 mb-10">
					<div class="text-center">
						<div class="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
							<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
						</div>
						<p class="text-xs font-medium text-gray-900 mb-0.5">1. Tell me what you need</p>
						<p class="text-[11px] text-gray-400">Be specific about why you want to connect</p>
					</div>
					<div class="text-center">
						<div class="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
							<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
						</div>
						<p class="text-xs font-medium text-gray-900 mb-0.5">2. Get qualified</p>
						<p class="text-[11px] text-gray-400">I evaluate if a meeting makes sense</p>
					</div>
					<div class="text-center">
						<div class="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
							<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
						</div>
						<p class="text-xs font-medium text-gray-900 mb-0.5">3. Book a time</p>
						<p class="text-[11px] text-gray-400">Calendar access unlocks if you qualify</p>
					</div>
				</div>

				<p class="text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-3">Try saying</p>
				<div class="flex flex-wrap gap-2">
					{#each [
						`What does ${ownerName} work on?`,
						`I want to discuss a potential partnership`,
						`I'm building something similar and need advice`,
						`Can I book a quick call?`,
					] as example}
						<button
							onclick={() => { query = example; ask(); }}
							class="text-xs px-3.5 py-2 bg-white border border-gray-150 rounded-full text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors"
						>{example}</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Footer -->
		<div class="border-t border-gray-100 py-6 text-center">
			<p class="text-[11px] text-gray-400">
				Powered by <a href="https://github.com/vaionex/personal-api" target="_blank" rel="noopener" class="text-gray-500 hover:text-gray-700 font-medium">Personal API</a> — open source AI gatekeeper
			</p>
		</div>
	</div>
</div>
