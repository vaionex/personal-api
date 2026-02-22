<script>
	let { data } = $props();
	const { ownerName, eventTypes } = data;
</script>

<svelte:head>
	<title>Schedule a meeting — {ownerName}</title>
	<meta name="description" content="Book a time with {ownerName}. Pick a meeting type and choose a time that works." />
</svelte:head>

<div class="min-h-screen bg-white">
	<header class="border-b border-gray-100">
		<div class="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
			<a href="/" class="flex items-center gap-3">
				<div class="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
					<span class="text-white text-xs font-bold">{ownerName.split(' ').map(n => n[0]).join('')}</span>
				</div>
				<span class="text-sm font-semibold text-gray-900">{ownerName}</span>
			</a>
		</div>
	</header>

	<div class="max-w-2xl mx-auto px-6 py-16">
		<h1 class="text-2xl font-bold text-gray-900 mb-2">Book a time</h1>
		<p class="text-base text-gray-500 mb-10">Pick a meeting type below, then choose a time that works for you.</p>

		{#if eventTypes.length === 0}
			<div class="bg-gray-50 rounded-2xl border border-gray-100 p-12 text-center">
				<svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
				<p class="text-sm text-gray-500">No meeting types available right now.</p>
				<p class="text-xs text-gray-400 mt-1">Check back later or reach out directly.</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each eventTypes as et}
					<a href="/schedule/{et.slug}" class="block bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-sm transition-all group">
						<div class="flex items-start justify-between">
							<div>
								<div class="flex items-center gap-3 mb-1">
									<div class="w-3 h-3 rounded-full" style="background-color: {et.color}"></div>
									<h3 class="text-base font-semibold text-gray-900 group-hover:text-gray-700">{et.name}</h3>
								</div>
								{#if et.description}
									<p class="text-sm text-gray-500 ml-6">{et.description}</p>
								{/if}
							</div>
							<div class="flex items-center gap-2 text-sm text-gray-400 flex-shrink-0">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
								{et.duration_minutes} min
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}

		<div class="mt-12 text-center">
			<a href="/" class="text-xs text-gray-400 hover:text-gray-600">← Back to {ownerName}'s page</a>
		</div>
	</div>
</div>
