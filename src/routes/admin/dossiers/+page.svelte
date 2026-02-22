<script>
	let { data } = $props();
	const ownerName = data.ownerName;

	let dossiers = $state([]);
	let loading = $state(false);
	let expandedDossier = $state(null);
	let showAll = $state(false);

	// Load data
	$effect(() => {
		loadDossiers();
	});

	async function loadDossiers() {
		loading = true;
		try {
			const res = await fetch(`/api/admin/dossiers${showAll ? '?all=true' : ''}`);
			const data = await res.json();
			dossiers = data;
		} catch (error) {
			console.error('Failed to load dossiers:', error);
		}
		loading = false;
	}

	async function updateDossier(id, updates) {
		try {
			const res = await fetch(`/api/admin/dossiers?id=${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updates)
			});

			if (res.ok) {
				await loadDossiers();
			}
		} catch (error) {
			console.error('Failed to update dossier:', error);
		}
	}

	function formatDateTime(dateString) {
		return new Date(dateString).toLocaleString();
	}

	function toggleExpanded(dossierId) {
		expandedDossier = expandedDossier === dossierId ? null : dossierId;
	}

	function getStatusColor(status) {
		switch (status) {
			case 'reviewed': return 'bg-green-100 text-green-700';
			case 'archived': return 'bg-gray-100 text-gray-700';
			default: return 'bg-yellow-100 text-yellow-700';
		}
	}
</script>

<svelte:head>
	<title>Meeting Dossiers — {ownerName}</title>
</svelte:head>

<div class="p-6">
	<div class="flex justify-between items-center mb-8">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Meeting Dossiers</h1>
			<p class="text-gray-500 mt-1">AI-generated prep briefs for upcoming meetings</p>
		</div>
		<div class="flex gap-2">
			<button
				onclick={() => { showAll = false; loadDossiers(); }}
				class="px-4 py-2 text-sm border rounded-lg {showAll ? 'border-gray-300 text-gray-600' : 'bg-gray-900 text-white border-gray-900'}"
			>
				Upcoming
			</button>
			<button
				onclick={() => { showAll = true; loadDossiers(); }}
				class="px-4 py-2 text-sm border rounded-lg {showAll ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600'}"
			>
				All
			</button>
		</div>
	</div>

	{#if loading}
		<div class="flex justify-center py-8">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
		</div>
	{:else}
		<div class="space-y-4">
			{#each dossiers as dossier}
				<div class="bg-white rounded-xl border border-gray-200">
					<div class="p-6">
						<div class="flex justify-between items-start">
							<div class="flex-1">
								<div class="flex items-center gap-3 mb-2">
									<h3 class="text-lg font-semibold text-gray-900">{dossier.guest_name}</h3>
									<span class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(dossier.status)}">
										{dossier.status}
									</span>
								</div>
								<p class="text-gray-600 text-sm mb-2">{dossier.guest_email}</p>
								<div class="flex items-center gap-4 text-sm text-gray-500">
									<span>📅 {formatDateTime(dossier.meeting_at)}</span>
									{#if dossier.bookings?.event_types}
										<span>🕒 {dossier.bookings.event_types.name} ({dossier.bookings.event_types.duration_minutes}m)</span>
									{/if}
								</div>
								{#if dossier.conversation_summary}
									<p class="text-sm text-gray-700 mt-3 line-clamp-2">{dossier.conversation_summary}</p>
								{/if}
							</div>
							<button
								onclick={() => toggleExpanded(dossier.id)}
								class="px-3 py-1.5 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
							>
								{expandedDossier === dossier.id ? 'Collapse' : 'View Details'}
							</button>
						</div>
					</div>

					{#if expandedDossier === dossier.id}
						<div class="border-t border-gray-100 p-6">
							<div class="grid md:grid-cols-2 gap-6">
								<!-- Left column -->
								<div class="space-y-4">
									{#if dossier.guest_background}
										<div>
											<h4 class="font-medium text-gray-900 mb-2">Guest Background</h4>
											<p class="text-sm text-gray-700">{dossier.guest_background}</p>
										</div>
									{/if}

									{#if dossier.their_ask}
										<div>
											<h4 class="font-medium text-gray-900 mb-2">What They Want</h4>
											<p class="text-sm text-gray-700">{dossier.their_ask}</p>
										</div>
									{/if}

									{#if dossier.risks}
										<div>
											<h4 class="font-medium text-gray-900 mb-2">Risks/Concerns</h4>
											<p class="text-sm text-gray-700">{dossier.risks}</p>
										</div>
									{/if}
								</div>

								<!-- Right column -->
								<div class="space-y-4">
									{#if dossier.talking_points && dossier.talking_points.length > 0}
										<div>
											<h4 class="font-medium text-gray-900 mb-2">Suggested Talking Points</h4>
											<ul class="text-sm text-gray-700 space-y-1">
												{#each dossier.talking_points as point}
													<li class="flex items-start gap-2">
														<span class="text-gray-400">•</span>
														<span>{point}</span>
													</li>
												{/each}
											</ul>
										</div>
									{/if}

									{#if dossier.potential_outcomes && dossier.potential_outcomes.length > 0}
										<div>
											<h4 class="font-medium text-gray-900 mb-2">Potential Outcomes</h4>
											<ul class="text-sm text-gray-700 space-y-1">
												{#each dossier.potential_outcomes as outcome}
													<li class="flex items-start gap-2">
														<span class="text-gray-400">•</span>
														<span>{outcome}</span>
													</li>
												{/each}
											</ul>
										</div>
									{/if}

									{#if dossier.related_projects}
										<div>
											<h4 class="font-medium text-gray-900 mb-2">Related Projects</h4>
											<p class="text-sm text-gray-700">{dossier.related_projects}</p>
										</div>
									{/if}
								</div>
							</div>

							<!-- Owner notes -->
							<div class="mt-6 pt-4 border-t border-gray-100">
								<h4 class="font-medium text-gray-900 mb-2">Your Notes</h4>
								<textarea
									value={dossier.owner_notes || ''}
									onblur={(e) => updateDossier(dossier.id, { owner_notes: e.target.value })}
									rows="3"
									placeholder="Add your own notes about this meeting..."
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 text-sm"
								></textarea>
							</div>

							<!-- Actions -->
							<div class="mt-4 flex gap-3">
								<button
									onclick={() => updateDossier(dossier.id, { status: 'reviewed' })}
									disabled={dossier.status === 'reviewed'}
									class="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Mark as Reviewed
								</button>
								<button
									onclick={() => updateDossier(dossier.id, { status: 'archived' })}
									class="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
								>
									Archive
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/each}

			{#if dossiers.length === 0}
				<div class="text-center py-12">
					<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
					</svg>
					<h3 class="mt-4 text-lg font-medium text-gray-900">No dossiers yet</h3>
					<p class="mt-1 text-gray-500">Dossiers will be automatically generated when people book meetings.</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>