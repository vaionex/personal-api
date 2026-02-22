<script>
	let query = $state('');
	let messages = $state([]);
	let loading = $state(false);

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
				body: JSON.stringify({ query: q, name: 'Visitor', channel: 'widget' }),
			});
			const data = await res.json();
			messages.push({
				text: data.response || data.error || 'No response',
				type: 'bot',
				meta: data.type === 'auto' ? 'Answered automatically' : 'Forwarded to Robin',
			});
		} catch {
			messages.push({ text: 'Could not connect.', type: 'bot' });
		}
		loading = false;
	}
</script>

<div class="min-h-screen bg-white">
	<!-- Header -->
	<header class="border-b border-gray-100">
		<div class="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
			<span class="text-sm font-semibold text-gray-900">Robin Kohze</span>
			<a href="/admin" class="text-xs text-gray-400 hover:text-gray-600">Admin</a>
		</div>
	</header>

	<div class="max-w-2xl mx-auto px-6">
		<!-- Hero -->
		<div class="py-16 text-center">
			<div class="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
				<span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
				Available
			</div>
			<h1 class="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Talk to my API first.</h1>
			<p class="text-base text-gray-500 max-w-md mx-auto leading-relaxed">
				I built an AI surrogate that knows my work, preferences, and availability. 
				Ask it anything — it'll answer what it can and pass the rest to me.
			</p>
		</div>

		<!-- Chat area -->
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
								<div>
									<div class="bg-white border border-gray-200 px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm text-gray-800 max-w-[80%]">{msg.text}</div>
									{#if msg.meta}
										<span class="text-[10px] text-gray-400 mt-1 block ml-1">{msg.meta}</span>
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

			<!-- Input -->
			<div class="p-4 {messages.length > 0 ? 'border-t border-gray-100' : ''}">
				<div class="flex gap-3">
					<input
						bind:value={query}
						onkeydown={(e) => { if (e.key === 'Enter') ask(); }}
						placeholder="Ask me anything about Robin..."
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

		<!-- Quick questions -->
		<div class="pb-16">
			<p class="text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-3">Common questions</p>
			<div class="flex flex-wrap gap-2">
				{#each [
					'What is Robin working on?',
					'What tech stack does he use?',
					'Is he available for consulting?',
					'How do I work with Robin?',
					'Tell me about Vaionex',
				] as example}
					<button
						onclick={() => { query = example; ask(); }}
						class="text-xs px-3.5 py-2 bg-white border border-gray-150 rounded-full text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors"
					>{example}</button>
				{/each}
			</div>
		</div>
	</div>
</div>
