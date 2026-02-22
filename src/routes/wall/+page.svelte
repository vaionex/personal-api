<script>
	import { onMount, onDestroy } from 'svelte';

	let { data } = $props();
	const ownerName = data.ownerName;

	let events = $state(data.initialEvents || []);
	let stats = $state(data.stats || {});
	let refreshInterval = null;

	onMount(() => {
		// Auto-refresh every 30 seconds
		refreshInterval = setInterval(refreshData, 30000);
	});

	onDestroy(() => {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
	});

	async function refreshData() {
		try {
			const res = await fetch('/api/proof');
			const data = await res.json();
			
			// Only update if we have new data
			if (data.events && data.events.length > 0) {
				// Simple check: if the first event ID changed, we have new data
				const hasNewEvents = events.length === 0 || 
					(data.events[0] && data.events[0].id !== events[0]?.id);
				
				if (hasNewEvents) {
					// Animate in new events
					events = data.events;
				}
				
				stats = data.stats;
			}
		} catch (error) {
			console.error('Failed to refresh data:', error);
		}
	}

	function formatTimeAgo(dateString) {
		const date = new Date(dateString);
		const now = new Date();
		const diffInMinutes = Math.floor((now - date) / (1000 * 60));

		if (diffInMinutes < 1) return 'just now';
		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
		
		const diffInHours = Math.floor(diffInMinutes / 60);
		if (diffInHours < 24) return `${diffInHours}h ago`;
		
		const diffInDays = Math.floor(diffInHours / 24);
		return `${diffInDays}d ago`;
	}

	function getEventIcon(eventType) {
		switch (eventType) {
			case 'qualified':
				return '✅';
			case 'booked':
				return '📅';
			case 'completed':
				return '🎯';
			case 'referred':
				return '👥';
			default:
				return '💬';
		}
	}
</script>

<svelte:head>
	<title>{ownerName}'s Activity Wall</title>
	<meta name="description" content="Live feed of recent activity and interactions with {ownerName}" />
</svelte:head>

<div class="min-h-screen bg-white">
	<header class="border-b border-gray-100">
		<div class="max-w-2xl mx-auto px-6 py-4">
			<div class="flex items-center gap-3">
				<div class="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
					<span class="text-white text-xs font-bold">{ownerName.split(' ').map(n => n[0]).join('')}</span>
				</div>
				<div>
					<h1 class="font-semibold text-gray-900">{ownerName}'s Activity</h1>
					<p class="text-xs text-gray-500">Live feed of recent interactions</p>
				</div>
			</div>
		</div>
	</header>

	<div class="max-w-2xl mx-auto px-6 py-8">
		<!-- Stats bar -->
		{#if stats.totalQualified > 0 || stats.totalMeetings > 0}
			<div class="bg-gray-50 rounded-xl p-4 mb-8">
				<div class="flex justify-center gap-8">
					<div class="text-center">
						<div class="text-2xl font-bold text-gray-900">{stats.totalQualified}</div>
						<div class="text-xs text-gray-500">qualified this week</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-gray-900">{stats.totalMeetings}</div>
						<div class="text-xs text-gray-500">meetings booked</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-gray-900">{stats.totalInteractions}</div>
						<div class="text-xs text-gray-500">total interactions</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Activity feed -->
		<div class="space-y-3">
			{#each events as event, index (event.id)}
				<div 
					class="bg-white border border-gray-100 rounded-xl p-4 animate-fade-in"
					style="animation-delay: {index * 0.1}s"
				>
					<div class="flex items-start gap-3">
						<div class="text-lg">{getEventIcon(event.event_type)}</div>
						<div class="flex-1">
							<p class="text-gray-900 text-sm">{event.display_text}</p>
							<div class="flex items-center gap-3 mt-2">
								<span class="text-xs text-gray-400">{formatTimeAgo(event.created_at)}</span>
								{#if event.topic}
									<span class="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{event.topic}</span>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/each}

			{#if events.length === 0}
				<div class="text-center py-12">
					<div class="text-4xl mb-4">🕐</div>
					<h3 class="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
					<p class="text-gray-500">Check back later to see recent interactions!</p>
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div class="border-t border-gray-100 mt-12 pt-6 text-center">
			<p class="text-xs text-gray-400">
				Want to talk to {ownerName}? <a href="/" class="text-gray-600 hover:text-gray-800 underline">Start a conversation</a>
			</p>
		</div>
	</div>
</div>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.3s ease-out forwards;
	}
</style>