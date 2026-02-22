<script>
	let { data } = $props();
	
	let trustRecords = $state([]);
	let stats = $state({ total: 0, byTier: {}, avgScore: 0 });
	let loading = $state(true);
	let sortBy = $state('score');
	let sortOrder = $state('desc');
	let filter = $state('all');
	
	async function load() {
		loading = true;
		try {
			const res = await fetch('/api/admin/trust', {
				headers: { 'Authorization': `Bearer ${document.cookie.split('admin-session=')[1]?.split(';')[0]}` }
			});
			const data = await res.json();
			trustRecords = data.trust_records || [];
			stats = data.stats || {};
		} catch (err) {
			console.error('Load error:', err);
		} finally {
			loading = false;
		}
	}
	
	async function adjustTrust(trustId, points, reason) {
		try {
			const res = await fetch('/api/admin/trust', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${document.cookie.split('admin-session=')[1]?.split(';')[0]}`
				},
				body: JSON.stringify({ trust_id: trustId, points, reason })
			});
			
			if (res.ok) {
				await load(); // Reload data
			}
		} catch (err) {
			console.error('Adjust trust error:', err);
		}
	}
	
	$effect(() => { load(); });
	
	function getTierBadgeClass(tier) {
		switch (tier) {
			case 'new': return 'bg-gray-100 text-gray-700';
			case 'known': return 'bg-blue-100 text-blue-700';
			case 'trusted': return 'bg-green-100 text-green-700';
			case 'vip': return 'bg-purple-100 text-purple-700';
			default: return 'bg-gray-100 text-gray-700';
		}
	}
	
	function getTierIcon(tier) {
		switch (tier) {
			case 'new': return '👋';
			case 'known': return '👤';
			case 'trusted': return '⭐';
			case 'vip': return '👑';
			default: return '❓';
		}
	}
	
	function sortRecords(records) {
		return [...records].sort((a, b) => {
			let aVal = a[sortBy];
			let bVal = b[sortBy];
			
			if (sortBy === 'score' || sortBy === 'total_interactions') {
				aVal = aVal || 0;
				bVal = bVal || 0;
			}
			
			if (typeof aVal === 'string') {
				aVal = aVal.toLowerCase();
				bVal = bVal.toLowerCase();
			}
			
			if (sortOrder === 'desc') {
				return bVal > aVal ? 1 : -1;
			} else {
				return aVal > bVal ? 1 : -1;
			}
		});
	}
	
	function filterRecords(records) {
		if (filter === 'all') return records;
		return records.filter(r => r.tier === filter);
	}
	
	let filteredRecords = $derived.by(() => sortRecords(filterRecords(trustRecords)));
	
	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Trust Dashboard — Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Nav -->
	<nav class="bg-white border-b border-gray-200">
		<div class="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<a href="/admin" class="text-sm text-gray-400 hover:text-gray-600">← Admin</a>
				<span class="text-gray-200">|</span>
				<h1 class="text-sm font-semibold text-gray-900">Trust Dashboard</h1>
			</div>
		</div>
	</nav>

	<div class="max-w-6xl mx-auto px-6 py-8">
		{#if loading}
			<div class="text-center py-8">
				<div class="text-gray-400">Loading trust data...</div>
			</div>
		{:else}
			<!-- Stats Overview -->
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
				<div class="bg-white rounded-xl border border-gray-200 p-5">
					<p class="text-2xl font-bold text-gray-900">{stats.total}</p>
					<p class="text-xs text-gray-500 mt-1">Total contacts</p>
				</div>
				<div class="bg-white rounded-xl border border-gray-200 p-5">
					<p class="text-2xl font-bold text-blue-600">{stats.avgScore}</p>
					<p class="text-xs text-gray-500 mt-1">Average score</p>
				</div>
				<div class="bg-white rounded-xl border border-gray-200 p-5">
					<p class="text-2xl font-bold text-green-600">{stats.totalMeetings}</p>
					<p class="text-xs text-gray-500 mt-1">Meetings completed</p>
				</div>
				<div class="bg-white rounded-xl border border-gray-200 p-5">
					<p class="text-2xl font-bold text-amber-600">{stats.noShowRate}%</p>
					<p class="text-xs text-gray-500 mt-1">No-show rate</p>
				</div>
			</div>

			<!-- Tier Distribution -->
			<div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Trust Tier Distribution</h3>
				<div class="grid grid-cols-4 gap-4">
					{#each ['new', 'known', 'trusted', 'vip'] as tier}
						<div class="text-center">
							<div class="text-2xl mb-2">{getTierIcon(tier)}</div>
							<div class="text-lg font-semibold text-gray-900">{stats.byTier[tier] || 0}</div>
							<div class="text-xs text-gray-500 capitalize">{tier}</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Controls -->
			<div class="bg-white rounded-xl border border-gray-200 p-4 mb-6">
				<div class="flex flex-wrap items-center gap-4">
					<div>
						<label class="text-sm font-medium text-gray-700 mr-2">Filter:</label>
						<select bind:value={filter} class="border border-gray-300 rounded-md px-3 py-1 text-sm">
							<option value="all">All tiers</option>
							<option value="new">New</option>
							<option value="known">Known</option>
							<option value="trusted">Trusted</option>
							<option value="vip">VIP</option>
						</select>
					</div>
					<div>
						<label class="text-sm font-medium text-gray-700 mr-2">Sort by:</label>
						<select bind:value={sortBy} class="border border-gray-300 rounded-md px-3 py-1 text-sm">
							<option value="score">Score</option>
							<option value="sender_name">Name</option>
							<option value="total_interactions">Interactions</option>
							<option value="last_interaction_at">Last interaction</option>
						</select>
					</div>
					<div>
						<label class="text-sm font-medium text-gray-700 mr-2">Order:</label>
						<select bind:value={sortOrder} class="border border-gray-300 rounded-md px-3 py-1 text-sm">
							<option value="desc">Descending</option>
							<option value="asc">Ascending</option>
						</select>
					</div>
				</div>
			</div>

			<!-- Trust Records Table -->
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-gray-50 border-b border-gray-200">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trust</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meetings</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Seen</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200">
							{#each filteredRecords as record}
								<tr class="hover:bg-gray-50">
									<td class="px-6 py-4">
										<div>
											<div class="font-medium text-gray-900">{record.sender_name || 'Unknown'}</div>
											<div class="text-sm text-gray-500">{record.sender_email || record.sender_id || 'No contact info'}</div>
											{#if record.referred_by_contact}
												<div class="text-xs text-blue-600 mt-1">
													Referred by {record.referred_by_contact.name}
												</div>
											{/if}
										</div>
									</td>
									<td class="px-6 py-4">
										<div class="flex items-center gap-2">
											<span class="text-lg">{getTierIcon(record.tier)}</span>
											<div>
												<span class="inline-block px-2 py-1 text-xs font-medium rounded-full {getTierBadgeClass(record.tier)}">
													{record.tier}
												</span>
												<div class="text-sm font-medium text-gray-900 mt-1">Score: {record.score}</div>
											</div>
										</div>
									</td>
									<td class="px-6 py-4 text-sm text-gray-500">
										<div>{record.total_interactions} interactions</div>
										<div>{record.qualified_count} qualified</div>
									</td>
									<td class="px-6 py-4 text-sm text-gray-500">
										<div class="text-green-600">{record.meetings_completed} completed</div>
										<div>{record.meetings_booked} booked</div>
										{#if record.no_shows > 0}
											<div class="text-red-600">{record.no_shows} no-shows</div>
										{/if}
									</td>
									<td class="px-6 py-4 text-sm text-gray-500">
										{formatDate(record.last_interaction_at)}
									</td>
									<td class="px-6 py-4">
										<div class="flex items-center gap-2">
											<button
												onclick={() => adjustTrust(record.id, 5, 'manual_bonus')}
												class="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
												title="Add 5 points"
											>
												+5
											</button>
											<button
												onclick={() => adjustTrust(record.id, -5, 'manual_penalty')}
												class="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
												title="Remove 5 points"
											>
												-5
											</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
					
					{#if filteredRecords.length === 0}
						<div class="text-center py-8 text-gray-500">
							No trust records found{filter !== 'all' ? ` for ${filter} tier` : ''}.
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>