<script>
	let { data } = $props();
	let activeTab = $state('upcoming');
	let bookings = $state([]);
	let eventTypes = $state([]);
	let rules = $state([]);
	let loading = $state(true);

	// New event type form
	let newET = $state({ slug: '', name: '', description: '', duration_minutes: 30, buffer_minutes: 0, color: '#2563eb' });
	// New rule form
	let newRule = $state({ day_of_week: 1, start_time: '09:00', end_time: '17:00', available: true });

	const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

	async function load() {
		loading = true;
		const res = await fetch('/api/admin/bookings');
		const d = await res.json();
		bookings = d.bookings || [];
		eventTypes = d.eventTypes || [];
		rules = d.rules || [];
		loading = false;
	}

	async function addEventType() {
		if (!newET.slug || !newET.name) return;
		await fetch('/api/admin/bookings', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'create_event_type', ...newET }),
		});
		newET = { slug: '', name: '', description: '', duration_minutes: 30, buffer_minutes: 0, color: '#2563eb' };
		await load();
	}

	async function deleteEventType(id) {
		await fetch('/api/admin/bookings', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'delete_event_type', id }),
		});
		await load();
	}

	async function addRule() {
		await fetch('/api/admin/bookings', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'create_rule', ...newRule }),
		});
		await load();
	}

	async function deleteRule(id) {
		await fetch('/api/admin/bookings', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'delete_rule', id }),
		});
		await load();
	}

	async function cancelBooking(id) {
		await fetch('/api/admin/bookings', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'cancel_booking', id }),
		});
		await load();
	}

	async function completeBooking(id) {
		await fetch('/api/admin/bookings', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'complete_booking', id }),
		});
		await load();
	}

	async function markNoShow(id) {
		await fetch('/api/admin/bookings', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'no_show', id }),
		});
		await load();
	}

	$effect(() => { load(); });

	function timeAgo(ts) {
		const diff = Date.now() - new Date(ts).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		return `${Math.floor(hrs / 24)}d ago`;
	}

	function formatDT(iso) {
		const d = new Date(iso);
		return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' ' +
			d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
	}
</script>

<svelte:head><title>Bookings — Admin</title></svelte:head>

<div class="max-w-5xl mx-auto px-6 py-8">
		<!-- Tabs -->
		<div class="flex gap-1 mb-6 bg-white rounded-lg border border-gray-200 p-1 w-fit">
			{#each ['upcoming', 'event_types', 'availability'] as tab}
				<button
					onclick={() => activeTab = tab}
					class="px-4 py-2 text-sm font-medium rounded-md transition-colors {activeTab === tab ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'}"
				>{tab === 'event_types' ? 'Meeting Types' : tab === 'availability' ? 'Availability' : 'Upcoming'}</button>
			{/each}
		</div>

		{#if activeTab === 'upcoming'}
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				{#each bookings.filter(b => b.status !== 'cancelled') as b}
					<div class="px-5 py-4 border-b border-gray-50 hover:bg-gray-50 flex items-center justify-between group">
						<div>
							<div class="flex items-center gap-2 mb-1">
								<span class="text-sm font-medium text-gray-900">{b.guest_name}</span>
								<span class="text-xs text-gray-400">{b.guest_email}</span>
							</div>
							<div class="flex items-center gap-3 text-xs text-gray-500">
								<span>{formatDT(b.start_time)}</span>
								<span>·</span>
								<span>{b.event_types?.name || 'Meeting'}</span>
								<span>·</span>
								<span class="px-1.5 py-0.5 rounded-full {b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">{b.status}</span>
							</div>
							{#if b.guest_notes}
								<p class="text-xs text-gray-400 mt-1 italic">"{b.guest_notes}"</p>
							{/if}
						</div>
						<div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
							{#if b.status === 'confirmed'}
								<button onclick={() => completeBooking(b.id)} class="text-xs text-green-600 hover:text-green-700">Complete</button>
								<button onclick={() => markNoShow(b.id)} class="text-xs text-orange-600 hover:text-orange-700">No-show</button>
							{/if}
							<button onclick={() => cancelBooking(b.id)} class="text-xs text-red-500 hover:text-red-700">Cancel</button>
						</div>
					</div>
				{/each}
				{#if bookings.filter(b => b.status !== 'cancelled').length === 0}
					<div class="px-5 py-16 text-center">
						<p class="text-gray-400 text-sm">No upcoming bookings</p>
						<p class="text-gray-400 text-xs mt-1">Share your scheduling link: <code class="bg-gray-100 px-1 rounded">/schedule</code></p>
					</div>
				{/if}
			</div>

		{:else if activeTab === 'event_types'}
			<!-- Add event type -->
			<div class="bg-white rounded-xl border border-gray-200 p-5 mb-4">
				<h3 class="text-sm font-semibold text-gray-900 mb-3">Add meeting type</h3>
				<div class="grid grid-cols-[1fr_1fr_80px_80px_60px_80px] gap-3 items-end">
					<div>
						<label class="text-xs text-gray-500 mb-1 block">Slug</label>
						<input bind:value={newET.slug} placeholder="quick-chat" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
					</div>
					<div>
						<label class="text-xs text-gray-500 mb-1 block">Name</label>
						<input bind:value={newET.name} placeholder="Quick Chat" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
					</div>
					<div>
						<label class="text-xs text-gray-500 mb-1 block">Duration</label>
						<input type="number" bind:value={newET.duration_minutes} class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
					</div>
					<div>
						<label class="text-xs text-gray-500 mb-1 block">Buffer</label>
						<input type="number" bind:value={newET.buffer_minutes} class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
					</div>
					<div>
						<label class="text-xs text-gray-500 mb-1 block">Color</label>
						<input type="color" bind:value={newET.color} class="w-full h-[38px] border border-gray-200 rounded-lg cursor-pointer" />
					</div>
					<button onclick={addEventType} class="bg-gray-900 text-white text-sm font-medium rounded-lg py-2 hover:bg-gray-800 transition-colors">Add</button>
				</div>
				<input bind:value={newET.description} placeholder="Description (optional)" class="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
			</div>

			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				{#each eventTypes as et}
					<div class="px-5 py-4 border-b border-gray-50 hover:bg-gray-50 flex items-center justify-between group">
						<div class="flex items-center gap-3">
							<div class="w-3 h-3 rounded-full" style="background-color: {et.color}"></div>
							<div>
								<span class="text-sm font-medium text-gray-900">{et.name}</span>
								<span class="text-xs text-gray-400 ml-2">/{et.slug}</span>
								<span class="text-xs text-gray-400 ml-2">{et.duration_minutes}min</span>
								{#if et.buffer_minutes}<span class="text-xs text-gray-400 ml-1">+{et.buffer_minutes}min buffer</span>{/if}
							</div>
						</div>
						<button onclick={() => deleteEventType(et.id)} class="text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
					</div>
				{/each}
				{#if eventTypes.length === 0}
					<div class="px-5 py-16 text-center">
						<p class="text-gray-400 text-sm">No meeting types yet</p>
						<p class="text-gray-400 text-xs mt-1">Add one above to start accepting bookings.</p>
					</div>
				{/if}
			</div>

		{:else if activeTab === 'availability'}
			<!-- Add rule -->
			<div class="bg-white rounded-xl border border-gray-200 p-5 mb-4">
				<h3 class="text-sm font-semibold text-gray-900 mb-3">Add availability window</h3>
				<div class="grid grid-cols-[160px_120px_120px_80px] gap-3 items-end">
					<div>
						<label class="text-xs text-gray-500 mb-1 block">Day</label>
						<select bind:value={newRule.day_of_week} class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
							{#each dayNames as name, i}
								<option value={i}>{name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="text-xs text-gray-500 mb-1 block">From</label>
						<input type="time" bind:value={newRule.start_time} class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
					</div>
					<div>
						<label class="text-xs text-gray-500 mb-1 block">To</label>
						<input type="time" bind:value={newRule.end_time} class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
					</div>
					<button onclick={addRule} class="bg-gray-900 text-white text-sm font-medium rounded-lg py-2 hover:bg-gray-800 transition-colors">Add</button>
				</div>
			</div>

			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				{#each dayNames as dayName, dayIdx}
					{@const dayRules = rules.filter(r => r.day_of_week === dayIdx)}
					<div class="px-5 py-3 border-b border-gray-50 flex items-center justify-between {dayRules.length === 0 ? 'opacity-40' : ''}">
						<span class="text-sm font-medium text-gray-900 w-24">{dayName}</span>
						<div class="flex-1 flex flex-wrap gap-2">
							{#each dayRules as rule}
								<div class="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 text-xs group">
									<span class="text-gray-700">{rule.start_time} – {rule.end_time}</span>
									<button onclick={() => deleteRule(rule.id)} class="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100">×</button>
								</div>
							{/each}
							{#if dayRules.length === 0}
								<span class="text-xs text-gray-400">Unavailable</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
