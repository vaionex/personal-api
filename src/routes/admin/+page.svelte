<script>
	let activeTab = $state('knowledge');
	let knowledge = $state([]);
	let interactions = $state([]);
	let newItem = $state({ category: 'project', key: '', value: '', context: '' });
	let loading = $state(true);

	async function load() {
		loading = true;
		const res = await fetch('/api/admin/data');
		const data = await res.json();
		knowledge = data.knowledge || [];
		interactions = data.interactions || [];
		loading = false;
	}

	async function addKnowledge() {
		if (!newItem.key || !newItem.value) return;
		await fetch('/api/admin/knowledge', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(newItem),
		});
		newItem = { category: newItem.category, key: '', value: '', context: '' };
		await load();
	}

	async function deleteKnowledge(id) {
		await fetch(`/api/admin/knowledge?id=${id}`, { method: 'DELETE' });
		await load();
	}

	async function updateInteraction(id, status) {
		await fetch('/api/admin/interactions', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id, status }),
		});
		await load();
	}

	$effect(() => { load(); });

	const categories = ['project', 'preference', 'stance', 'faq', 'boundary', 'bio'];

	function timeAgo(ts) {
		const diff = Date.now() - new Date(ts).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		return `${Math.floor(hrs / 24)}d ago`;
	}
</script>

<div class="min-h-screen bg-gray-50">
	<nav class="bg-white border-b border-gray-200 px-6 py-3">
		<div class="max-w-5xl mx-auto flex items-center justify-between">
			<h1 class="text-lg font-semibold text-gray-900">Personal API — Admin</h1>
			<a href="/" class="text-sm text-blue-600 hover:text-blue-700">View public page</a>
		</div>
	</nav>

	<div class="max-w-5xl mx-auto px-6 py-8">
		<!-- Tabs -->
		<div class="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
			{#each ['knowledge', 'interactions'] as tab}
				<button
					onclick={() => activeTab = tab}
					class="px-4 py-2 text-sm font-medium rounded-md transition-colors {activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
				>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
			{/each}
		</div>

		{#if activeTab === 'knowledge'}
			<!-- Add new -->
			<div class="bg-white rounded-xl border border-gray-200 p-5 mb-6">
				<h3 class="text-sm font-semibold text-gray-900 mb-3">Add knowledge</h3>
				<div class="grid grid-cols-4 gap-3">
					<select bind:value={newItem.category} class="border border-gray-200 rounded-lg px-3 py-2 text-sm">
						{#each categories as cat}
							<option value={cat}>{cat}</option>
						{/each}
					</select>
					<input bind:value={newItem.key} placeholder="Key (e.g. 'SvelteKit')" class="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
					<input bind:value={newItem.value} placeholder="Value" class="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
					<button onclick={addKnowledge} class="bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">Add</button>
				</div>
			</div>

			<!-- Knowledge list -->
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				{#each categories as cat}
					{@const items = knowledge.filter(k => k.category === cat)}
					{#if items.length > 0}
						<div class="border-b border-gray-100 last:border-b-0">
							<div class="px-5 py-3 bg-gray-50">
								<h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">{cat} ({items.length})</h4>
							</div>
							{#each items as item}
								<div class="px-5 py-3 flex items-center justify-between border-t border-gray-50 hover:bg-gray-50">
									<div>
										<span class="text-sm font-medium text-gray-900">{item.key}</span>
										<span class="text-sm text-gray-500 ml-2">{item.value}</span>
										{#if item.context}
											<span class="text-xs text-gray-400 ml-2">({item.context})</span>
										{/if}
									</div>
									<button onclick={() => deleteKnowledge(item.id)} class="text-xs text-red-500 hover:text-red-700">Delete</button>
								</div>
							{/each}
						</div>
					{/if}
				{/each}
				{#if knowledge.length === 0}
					<div class="px-5 py-12 text-center text-gray-400 text-sm">No knowledge entries yet. Add some above.</div>
				{/if}
			</div>

		{:else if activeTab === 'interactions'}
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				{#each interactions as i}
					<div class="px-5 py-4 border-b border-gray-50 hover:bg-gray-50">
						<div class="flex items-start justify-between gap-4">
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-1">
									<span class="text-xs px-2 py-0.5 rounded-full font-medium
										{i.classification === 'auto' ? 'bg-green-100 text-green-700' : i.classification === 'draft' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}"
									>{i.classification}</span>
									<span class="text-xs text-gray-400">{i.channel}</span>
									<span class="text-xs text-gray-400">{timeAgo(i.created_at)}</span>
									{#if i.sender_name}
										<span class="text-xs text-gray-500">{i.sender_name}</span>
									{/if}
								</div>
								<p class="text-sm text-gray-900 mb-1">{i.query}</p>
								{#if i.response}
									<p class="text-sm text-gray-500 italic">{i.response}</p>
								{/if}
							</div>
							<div class="flex items-center gap-2 flex-shrink-0">
								<span class="text-xs px-2 py-0.5 rounded-full
									{i.status === 'sent' || i.status === 'approved' ? 'bg-green-50 text-green-600' : i.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'}"
								>{i.status}</span>
								{#if i.status === 'pending'}
									<button onclick={() => updateInteraction(i.id, 'approved')} class="text-xs text-green-600 hover:text-green-700 font-medium">Approve</button>
									<button onclick={() => updateInteraction(i.id, 'rejected')} class="text-xs text-red-500 hover:text-red-700">Reject</button>
								{/if}
							</div>
						</div>
					</div>
				{/each}
				{#if interactions.length === 0}
					<div class="px-5 py-12 text-center text-gray-400 text-sm">No interactions yet.</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
