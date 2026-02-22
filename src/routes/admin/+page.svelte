<script>
	let { data } = $props();
	let activeTab = $state('knowledge');
	let knowledge = $state([]);
	let interactions = $state([]);
	let templates = $state([]);
	let newItem = $state({ category: 'project', key: '', value: '', context: '' });
	let newTemplate = $state({ trigger_pattern: '', response_template: '', auto_send: false });
	let loading = $state(true);
	let stats = $state({ total: 0, auto: 0, pending: 0 });
	let fileInput = $state(null);

	async function load() {
		loading = true;
		const res = await fetch('/api/admin/data');
		const d = await res.json();
		knowledge = d.knowledge || [];
		interactions = d.interactions || [];
		templates = d.templates || [];
		stats = d.stats || { total: 0, auto: 0, pending: 0 };
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

	async function addTemplate() {
		if (!newTemplate.trigger_pattern || !newTemplate.response_template) return;
		await fetch('/api/admin/templates', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(newTemplate),
		});
		newTemplate = { trigger_pattern: '', response_template: '', auto_send: false };
		await load();
	}

	async function deleteTemplate(id) {
		await fetch(`/api/admin/templates?id=${id}`, { method: 'DELETE' });
		await load();
	}

	async function exportKnowledge() {
		const res = await fetch('/api/admin/knowledge?format=json');
		const data = await res.json();
		
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `knowledge-export-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	async function importKnowledge() {
		fileInput?.click();
	}

	async function handleFileImport(event) {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			const text = await file.text();
			const data = JSON.parse(text);
			
			if (!Array.isArray(data)) {
				alert('Invalid file format. Expected JSON array of knowledge items.');
				return;
			}

			const res = await fetch('/api/admin/knowledge', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});

			const result = await res.json();
			
			if (res.ok) {
				alert(`Successfully imported ${result.imported} knowledge items.`);
				await load();
			} else {
				alert(`Import failed: ${result.error}`);
			}
		} catch (e) {
			alert(`Import failed: ${e.message}`);
		}
		
		// Reset file input
		event.target.value = '';
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

	const categories = ['bio', 'project', 'preference', 'stance', 'boundary', 'faq'];

	function timeAgo(ts) {
		const diff = Date.now() - new Date(ts).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		return `${Math.floor(hrs / 24)}d ago`;
	}
</script>

<svelte:head>
	<title>Admin — Personal API</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Nav -->
	<nav class="bg-white border-b border-gray-200">
		<div class="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<a href="/" class="text-sm text-gray-400 hover:text-gray-600">← Back</a>
				<span class="text-gray-200">|</span>
				<h1 class="text-sm font-semibold text-gray-900">Personal API</h1>
			</div>
			<span class="text-xs text-gray-400">{data.ownerName}</span>
		</div>
	</nav>

	<div class="max-w-5xl mx-auto px-6 py-8">
		<!-- Stats -->
		<div class="grid grid-cols-3 gap-4 mb-8">
			<div class="bg-white rounded-xl border border-gray-200 p-5">
				<p class="text-2xl font-bold text-gray-900">{stats.total}</p>
				<p class="text-xs text-gray-500 mt-1">Total interactions</p>
			</div>
			<div class="bg-white rounded-xl border border-gray-200 p-5">
				<p class="text-2xl font-bold text-green-600">{stats.auto}</p>
				<p class="text-xs text-gray-500 mt-1">Auto-handled</p>
			</div>
			<div class="bg-white rounded-xl border border-gray-200 p-5">
				<p class="text-2xl font-bold text-amber-600">{stats.pending}</p>
				<p class="text-xs text-gray-500 mt-1">Pending review</p>
			</div>
		</div>

		<!-- Tabs -->
		<div class="flex gap-1 mb-6 bg-white rounded-lg border border-gray-200 p-1 w-fit">
			{#each ['knowledge', 'templates', 'interactions', 'contacts', 'settings'] as tab}
				<button
					onclick={() => activeTab = tab}
					class="px-4 py-2 text-sm font-medium rounded-md transition-colors {activeTab === tab ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'}"
				>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
			{/each}
		</div>

		{#if activeTab === 'knowledge'}
			<!-- Add knowledge -->
			<div class="bg-white rounded-xl border border-gray-200 p-5 mb-4">
				<div class="flex items-center justify-between mb-3">
					<h3 class="text-sm font-semibold text-gray-900">Add knowledge</h3>
					<div class="flex gap-2">
						<button onclick={exportKnowledge} class="text-xs bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700">Export</button>
						<button onclick={importKnowledge} class="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700">Import</button>
					</div>
				</div>
				<div class="grid grid-cols-[140px_1fr_1fr_100px] gap-3">
					<select bind:value={newItem.category} class="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
						{#each categories as cat}
							<option value={cat}>{cat}</option>
						{/each}
					</select>
					<input bind:value={newItem.key} placeholder="Key" class="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
					<input bind:value={newItem.value} placeholder="Value" class="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
					<button onclick={addKnowledge} class="bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">Add</button>
				</div>
				<input bind:value={newItem.context} placeholder="Context (optional — extra info for the AI)" class="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
				<input 
					bind:this={fileInput}
					type="file" 
					accept=".json" 
					onchange={handleFileImport}
					style="display: none;" 
				/>
			</div>

			<!-- Knowledge list -->
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				{#each categories as cat}
					{@const items = knowledge.filter(k => k.category === cat)}
					{#if items.length > 0}
						<div class="border-b border-gray-100 last:border-b-0">
							<div class="px-5 py-3 bg-gray-50 flex items-center justify-between">
								<h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">{cat}</h4>
								<span class="text-xs text-gray-400">{items.length}</span>
							</div>
							{#each items as item}
								<div class="px-5 py-3 flex items-center justify-between border-t border-gray-50 hover:bg-gray-50 group">
									<div class="min-w-0 flex-1">
										<span class="text-sm font-medium text-gray-900">{item.key}</span>
										<span class="text-sm text-gray-500 ml-2">{item.value}</span>
										{#if item.context}
											<span class="text-xs text-gray-400 ml-2 italic">({item.context})</span>
										{/if}
									</div>
									<button onclick={() => deleteKnowledge(item.id)} class="text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity ml-4">Delete</button>
								</div>
							{/each}
						</div>
					{/if}
				{/each}
				{#if knowledge.length === 0}
					<div class="px-5 py-16 text-center">
						<p class="text-gray-400 text-sm mb-1">No knowledge yet</p>
						<p class="text-gray-400 text-xs">Add entries above to teach your surrogate about you.</p>
					</div>
				{/if}
			</div>

		{:else if activeTab === 'templates'}
			<!-- Add template -->
			<div class="bg-white rounded-xl border border-gray-200 p-5 mb-4">
				<h3 class="text-sm font-semibold text-gray-900 mb-3">Add auto-response template</h3>
				<div class="space-y-3">
					<input bind:value={newTemplate.trigger_pattern} placeholder="Pattern name (e.g. 'recruiter_outreach', 'meeting_request')" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
					<textarea bind:value={newTemplate.response_template} placeholder="Response template..." rows="3" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"></textarea>
					<div class="flex items-center justify-between">
						<label class="flex items-center gap-2 text-sm text-gray-600">
							<input type="checkbox" bind:checked={newTemplate.auto_send} class="rounded" />
							Auto-send (don't wait for approval)
						</label>
						<button onclick={addTemplate} class="bg-gray-900 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors">Add template</button>
					</div>
				</div>
			</div>

			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				{#each templates as t}
					<div class="px-5 py-4 border-b border-gray-50 hover:bg-gray-50 group">
						<div class="flex items-start justify-between gap-4">
							<div class="flex-1">
								<div class="flex items-center gap-2 mb-1">
									<span class="text-sm font-medium text-gray-900">{t.trigger_pattern}</span>
									{#if t.auto_send}
										<span class="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">auto</span>
									{/if}
								</div>
								<p class="text-sm text-gray-500">{t.response_template}</p>
							</div>
							<button onclick={() => deleteTemplate(t.id)} class="text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
						</div>
					</div>
				{/each}
				{#if templates.length === 0}
					<div class="px-5 py-16 text-center">
						<p class="text-gray-400 text-sm mb-1">No templates yet</p>
						<p class="text-gray-400 text-xs">Templates auto-respond to common patterns (recruiters, vague collabs, etc.)</p>
					</div>
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
										<span class="text-xs text-gray-500 font-medium">{i.sender_name}</span>
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
					<div class="px-5 py-16 text-center">
						<p class="text-gray-400 text-sm mb-1">No interactions yet</p>
						<p class="text-gray-400 text-xs">Once people start talking to your surrogate, interactions will appear here.</p>
					</div>
				{/if}
			</div>

		{:else if activeTab === 'contacts'}
			<div class="bg-white rounded-xl border border-gray-200 p-6">
				<div class="text-center">
					<h3 class="text-lg font-semibold text-gray-900 mb-2">Manage Contacts</h3>
					<p class="text-gray-600 mb-4">Full contact management is available on the dedicated contacts page.</p>
					<a 
						href="/admin/contacts" 
						class="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
					>
						Go to Contacts
					</a>
				</div>
			</div>

		{:else if activeTab === 'settings'}
			<div class="bg-white rounded-xl border border-gray-200 p-6">
				<div class="text-center">
					<h3 class="text-lg font-semibold text-gray-900 mb-2">System Settings</h3>
					<p class="text-gray-600 mb-4">View configuration and test the system on the dedicated settings page.</p>
					<a 
						href="/admin/settings" 
						class="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
					>
						Go to Settings
					</a>
				</div>
			</div>
		{/if}
	</div>
</div>
