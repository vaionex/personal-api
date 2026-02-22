<script>
	let { data } = $props();
	let activeTab = $state('overview');
	let overview = $state(null);
	let interactions = $state([]);
	let loading = $state(true);

	async function loadOverview() {
		loading = true;
		try {
			const res = await fetch('/api/admin/overview', {
				headers: { 'Authorization': `Bearer ${document.cookie.split('admin-session=')[1]?.split(';')[0]}` }
			});
			const data = await res.json();
			overview = data;
		} catch (err) {
			console.error('Load overview error:', err);
		} finally {
			loading = false;
		}
	}

	async function loadInteractions() {
		const res = await fetch('/api/admin/data');
		const d = await res.json();
		interactions = d.interactions || [];
	}

	async function updateInteraction(id, status) {
		await fetch('/api/admin/interactions', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id, status }),
		});
		await loadInteractions();
		await loadOverview(); // Refresh stats
	}

	$effect(() => { 
		loadOverview();
		if (activeTab === 'interactions') {
			loadInteractions();
		}
	});

	function timeAgo(ts) {
		const diff = Date.now() - new Date(ts).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		return `${Math.floor(hrs / 24)}d ago`;
	}

	function formatDateTime(iso) {
		const d = new Date(iso);
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
			d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
	}
</script>

<svelte:head>
	<title>Admin — Personal API</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-6 py-8">
	{#if loading && !overview}
		<div class="text-center py-12">
			<div class="text-gray-400">Loading dashboard...</div>
		</div>
	{:else if overview}
		<!-- Page Header -->
		<div class="mb-8">
			<h1 class="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
			<p class="text-gray-600">Overview of your Personal API activity and performance.</p>
		</div>

		<!-- Tabs -->
		<div class="flex gap-1 mb-6 bg-white rounded-lg border border-gray-200 p-1 w-fit">
			{#each ['overview', 'interactions'] as tab}
				<button
					onclick={() => activeTab = tab}
					class="px-4 py-2 text-sm font-medium rounded-md transition-colors {activeTab === tab ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'}"
				>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
			{/each}
		</div>

		{#if activeTab === 'overview'}
			<!-- Stats Row -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
				<div class="bg-white rounded-xl border border-gray-200 p-6">
					<p class="text-3xl font-bold text-gray-900">{overview.stats.totalConversations}</p>
					<p class="text-sm text-gray-500 mt-1">Total conversations</p>
				</div>
				<div class="bg-white rounded-xl border border-gray-200 p-6">
					<p class="text-3xl font-bold text-blue-600">{overview.stats.qualificationRate}%</p>
					<p class="text-sm text-gray-500 mt-1">Qualification rate</p>
				</div>
				<div class="bg-white rounded-xl border border-gray-200 p-6">
					<p class="text-3xl font-bold text-green-600">{overview.stats.meetingsThisWeek}</p>
					<p class="text-sm text-gray-500 mt-1">Meetings this week</p>
				</div>
				<div class="bg-white rounded-xl border border-gray-200 p-6">
					<p class="text-3xl font-bold text-amber-600">{overview.stats.pendingReviews}</p>
					<p class="text-sm text-gray-500 mt-1">Pending reviews</p>
				</div>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<!-- Trust Distribution -->
				<div class="bg-white rounded-xl border border-gray-200 p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">Trust Distribution</h3>
					<div class="space-y-3">
						{#each Object.entries(overview.trustDistribution) as [tier, count]}
							{@const total = Object.values(overview.trustDistribution).reduce((a, b) => a + b, 0)}
							{@const percentage = total > 0 ? Math.round((count / total) * 100) : 0}
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div class="w-3 h-3 rounded-full 
										{tier === 'new' ? 'bg-gray-400' : 
										tier === 'known' ? 'bg-blue-400' : 
										tier === 'trusted' ? 'bg-green-400' : 'bg-purple-400'}">
									</div>
									<span class="text-sm font-medium text-gray-900 capitalize">{tier}</span>
								</div>
								<div class="flex items-center gap-2">
									<div class="w-20 bg-gray-200 rounded-full h-2">
										<div class="h-2 rounded-full 
											{tier === 'new' ? 'bg-gray-400' : 
											tier === 'known' ? 'bg-blue-400' : 
											tier === 'trusted' ? 'bg-green-400' : 'bg-purple-400'}" 
											style="width: {percentage}%"></div>
									</div>
									<span class="text-sm text-gray-500 w-8 text-right">{count}</span>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Recent Activity -->
				<div class="bg-white rounded-xl border border-gray-200 p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
					<div class="space-y-3">
						{#each overview.recentActivity as activity}
							<div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
								<span class="px-2 py-1 text-xs font-medium rounded-full
									{activity.classification === 'auto' ? 'bg-green-100 text-green-700' : 
									activity.classification === 'draft' ? 'bg-amber-100 text-amber-700' : 
									'bg-red-100 text-red-700'}">
									{activity.classification}
								</span>
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 mb-1">
										<span class="text-sm font-medium text-gray-900">{activity.sender}</span>
										<span class="text-xs text-gray-400">{timeAgo(activity.created_at)}</span>
										{#if activity.qualified}
											<span class="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">qualified</span>
										{/if}
									</div>
									<p class="text-sm text-gray-600">{activity.query}</p>
								</div>
							</div>
						{/each}
						{#if overview.recentActivity.length === 0}
							<p class="text-sm text-gray-400 text-center py-4">No recent activity</p>
						{/if}
					</div>
				</div>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
				<!-- Upcoming Meetings -->
				<div class="bg-white rounded-xl border border-gray-200 p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">Upcoming Meetings</h3>
					<div class="space-y-3">
						{#each overview.upcomingMeetings as meeting}
							<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
								<div>
									<p class="text-sm font-medium text-gray-900">{meeting.guestName}</p>
									<p class="text-xs text-gray-500">{meeting.eventType}</p>
								</div>
								<div class="text-right">
									<p class="text-sm text-gray-900">{formatDateTime(meeting.startTime)}</p>
								</div>
							</div>
						{/each}
						{#if overview.upcomingMeetings.length === 0}
							<p class="text-sm text-gray-400 text-center py-4">No upcoming meetings</p>
						{/if}
					</div>
				</div>

				<!-- Pending Items -->
				<div class="bg-white rounded-xl border border-gray-200 p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">Pending Items</h3>
					<div class="space-y-3">
						{#if overview.stats.pendingReviews > 0}
							<div class="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
								<div>
									<p class="text-sm font-medium text-gray-900">Interaction Reviews</p>
									<p class="text-xs text-gray-500">Draft responses awaiting approval</p>
								</div>
								<a href="/admin#interactions" class="text-sm font-medium text-amber-600 hover:text-amber-700">
									View →
								</a>
							</div>
							<div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
								<div>
									<p class="text-sm font-medium text-gray-900">Video Pitches</p>
									<p class="text-xs text-gray-500">Submissions awaiting review</p>
								</div>
								<a href="/admin/pitches" class="text-sm font-medium text-blue-600 hover:text-blue-700">
									Review →
								</a>
							</div>
						{:else}
							<p class="text-sm text-gray-400 text-center py-4">All caught up! 🎉</p>
						{/if}
					</div>
				</div>
			</div>

		{:else if activeTab === 'interactions'}
			<!-- Interactions Tab Content -->
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
		{/if}
	{/if}
</div>