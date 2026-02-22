<script>
	let query = $state('');
	let response = $state(null);
	let loading = $state(false);

	async function ask() {
		if (!query.trim() || loading) return;
		loading = true;
		response = null;
		try {
			const res = await fetch('/api/ask', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: query.trim(), name: 'Visitor', channel: 'widget' }),
			});
			response = await res.json();
		} catch (e) {
			response = { error: 'Failed to connect' };
		}
		loading = false;
	}
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Hero -->
	<div class="bg-white border-b border-gray-100">
		<div class="max-w-3xl mx-auto px-6 py-20 text-center">
			<div class="inline-flex items-center gap-2 bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1 rounded-full mb-6">
				<span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
				Online
			</div>
			<h1 class="text-4xl font-bold text-gray-900 mb-3">Robin's Personal API</h1>
			<p class="text-lg text-gray-500 max-w-xl mx-auto">
				Ask me anything about Robin's projects, availability, tech stack, or how to work together. 
				I'll answer what I can and pass the rest along.
			</p>
		</div>
	</div>

	<!-- Ask interface -->
	<div class="max-w-2xl mx-auto px-6 py-12">
		<div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
			<div class="p-6">
				<label for="query" class="text-sm font-medium text-gray-700 mb-2 block">Ask a question</label>
				<textarea
					id="query"
					bind:value={query}
					onkeydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); } }}
					placeholder="What does Robin work on? / Is Robin available for consulting? / What tech stack does Vaionex use?"
					rows="3"
					class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none"
				></textarea>
				<button
					onclick={ask}
					disabled={loading || !query.trim()}
					class="mt-3 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{loading ? 'Thinking...' : 'Ask'}
				</button>
			</div>

			{#if response}
				<div class="border-t border-gray-100 p-6 bg-gray-50">
					{#if response.error}
						<p class="text-red-600 text-sm">{response.error}</p>
					{:else}
						<div class="flex items-start gap-3">
							<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
								<svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
							</div>
							<div>
								<p class="text-sm text-gray-800 leading-relaxed">{response.response}</p>
								<span class="text-[10px] text-gray-400 mt-2 block uppercase tracking-wider">
									{response.type === 'auto' ? 'Answered automatically' : 'Message forwarded to Robin'}
								</span>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Example questions -->
		<div class="mt-8">
			<p class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Try asking</p>
			<div class="flex flex-wrap gap-2">
				{#each [
					'What projects is Robin working on?',
					'What tech stack does Robin use?',
					'Is Robin available for freelance work?',
					'How can I collaborate with Robin?',
				] as example}
					<button
						onclick={() => { query = example; ask(); }}
						class="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
					>{example}</button>
				{/each}
			</div>
		</div>
	</div>
</div>
