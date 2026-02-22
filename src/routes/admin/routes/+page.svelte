<script>
	let { data } = $props();
	const ownerName = data.ownerName;

	let routes = $state([]);
	let eventTypes = $state([]);
	let loading = $state(false);
	let showAddForm = $state(false);
	
	// Form state
	let newRoute = $state({
		topic: '',
		description: '',
		event_type_slug: '',
		auto_qualify: false,
		priority: 0,
		keywords: '',
		response_hint: ''
	});

	// Load data
	$effect(() => {
		loadRoutes();
		loadEventTypes();
	});

	async function loadRoutes() {
		loading = true;
		try {
			const res = await fetch('/api/admin/routes');
			const data = await res.json();
			routes = data;
		} catch (error) {
			console.error('Failed to load routes:', error);
		}
		loading = false;
	}

	async function loadEventTypes() {
		try {
			const res = await fetch('/api/schedule/types');
			const data = await res.json();
			eventTypes = data;
		} catch (error) {
			console.error('Failed to load event types:', error);
		}
	}

	async function createRoute() {
		if (!newRoute.topic || !newRoute.description) return;

		try {
			const keywords = newRoute.keywords ? 
				newRoute.keywords.split(',').map(k => k.trim()).filter(Boolean) : [];

			const res = await fetch('/api/admin/routes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...newRoute,
					keywords
				})
			});

			if (res.ok) {
				await loadRoutes();
				newRoute = {
					topic: '',
					description: '',
					event_type_slug: '',
					auto_qualify: false,
					priority: 0,
					keywords: '',
					response_hint: ''
				};
				showAddForm = false;
			}
		} catch (error) {
			console.error('Failed to create route:', error);
		}
	}

	async function deleteRoute(id) {
		if (!confirm('Are you sure you want to delete this route?')) return;

		try {
			const res = await fetch(`/api/admin/routes?id=${id}`, {
				method: 'DELETE'
			});

			if (res.ok) {
				await loadRoutes();
			}
		} catch (error) {
			console.error('Failed to delete route:', error);
		}
	}

	function formatKeywords(keywords) {
		if (!keywords || !Array.isArray(keywords)) return '';
		return keywords.join(', ');
	}
</script>

<svelte:head>
	<title>Topic Routes — {ownerName}</title>
</svelte:head>

<div class="p-6">
	<div class="flex justify-between items-center mb-8">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Topic Routes</h1>
			<p class="text-gray-500 mt-1">Automatically route conversations to specific meeting types based on topics</p>
		</div>
		<button
			onclick={() => showAddForm = !showAddForm}
			class="px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
		>
			{showAddForm ? 'Cancel' : 'Add Route'}
		</button>
	</div>

	{#if showAddForm}
		<div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Add Topic Route</h2>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Topic Name</label>
					<input
						bind:value={newRoute.topic}
						type="text"
						placeholder="e.g., technical"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
					<input
						bind:value={newRoute.description}
						type="text"
						placeholder="e.g., Technical consulting and architecture"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Route to Event Type</label>
					<select
						bind:value={newRoute.event_type_slug}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
					>
						<option value="">No specific routing</option>
						{#each eventTypes as eventType}
							<option value={eventType.slug}>{eventType.name}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Priority</label>
					<input
						bind:value={newRoute.priority}
						type="number"
						min="0"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
					/>
				</div>
				<div class="col-span-2">
					<label class="block text-sm font-medium text-gray-700 mb-2">Keywords (comma-separated)</label>
					<input
						bind:value={newRoute.keywords}
						type="text"
						placeholder="technical, architecture, code, engineering"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
					/>
				</div>
				<div class="col-span-2">
					<label class="block text-sm font-medium text-gray-700 mb-2">Response Hint</label>
					<textarea
						bind:value={newRoute.response_hint}
						rows="2"
						placeholder="Hint for the AI on how to handle this topic"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
					></textarea>
				</div>
				<div class="col-span-2">
					<label class="flex items-center">
						<input
							bind:checked={newRoute.auto_qualify}
							type="checkbox"
							class="mr-2"
						/>
						<span class="text-sm font-medium text-gray-700">Auto-qualify (automatically qualify users with this topic)</span>
					</label>
				</div>
			</div>
			<div class="flex gap-3 mt-6">
				<button
					onclick={createRoute}
					disabled={!newRoute.topic || !newRoute.description}
					class="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Create Route
				</button>
				<button
					onclick={() => showAddForm = false}
					class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
				>
					Cancel
				</button>
			</div>
		</div>
	{/if}

	{#if loading}
		<div class="flex justify-center py-8">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
		</div>
	{:else}
		<div class="grid gap-4">
			{#each routes as route}
				<div class="bg-white rounded-xl border border-gray-200 p-6">
					<div class="flex justify-between items-start">
						<div class="flex-1">
							<div class="flex items-center gap-3 mb-2">
								<h3 class="text-lg font-semibold text-gray-900">{route.topic}</h3>
								{#if route.auto_qualify}
									<span class="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Auto-qualify</span>
								{/if}
								{#if route.priority > 0}
									<span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Priority: {route.priority}</span>
								{/if}
							</div>
							<p class="text-gray-600 mb-3">{route.description}</p>
							
							{#if route.event_type_slug}
								<p class="text-sm text-gray-500 mb-2">
									<strong>Routes to:</strong> {eventTypes.find(et => et.slug === route.event_type_slug)?.name || route.event_type_slug}
								</p>
							{/if}
							
							{#if route.keywords && route.keywords.length > 0}
								<p class="text-sm text-gray-500 mb-2">
									<strong>Keywords:</strong> {formatKeywords(route.keywords)}
								</p>
							{/if}
							
							{#if route.response_hint}
								<p class="text-sm text-gray-500">
									<strong>AI Hint:</strong> {route.response_hint}
								</p>
							{/if}
						</div>
						<button
							onclick={() => deleteRoute(route.id)}
							class="px-3 py-1.5 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 text-sm"
						>
							Delete
						</button>
					</div>
				</div>
			{/each}

			{#if routes.length === 0}
				<div class="text-center py-12">
					<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
					</svg>
					<h3 class="mt-4 text-lg font-medium text-gray-900">No topic routes yet</h3>
					<p class="mt-1 text-gray-500">Add your first route to start automatically categorizing conversations.</p>
				</div>
			{/if}
		</div>
	{/if}
</div>