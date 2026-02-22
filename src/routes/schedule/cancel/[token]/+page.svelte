<script>
	let { data } = $props();
	const { booking, token, ownerName } = data;
	let cancelled = $state(false);
	let cancelling = $state(false);
	let error = $state(null);

	const isCancelled = booking.status === 'cancelled';

	async function cancel() {
		cancelling = true;
		try {
			const res = await fetch('/api/schedule/cancel', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token }),
			});
			const d = await res.json();
			if (d.error) error = d.error;
			else cancelled = true;
		} catch { error = 'Failed to cancel'; }
		cancelling = false;
	}

	function formatDateTime(iso) {
		const d = new Date(iso);
		return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) +
			' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
	}
</script>

<svelte:head><title>Cancel booking — {ownerName}</title></svelte:head>

<div class="min-h-screen bg-white flex items-center justify-center">
	<div class="max-w-md w-full px-6">
		{#if isCancelled || cancelled}
			<div class="text-center">
				<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
					<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
				</div>
				<h1 class="text-xl font-bold text-gray-900 mb-2">Booking cancelled</h1>
				<p class="text-sm text-gray-500">This meeting has been cancelled. The calendar invite has been removed.</p>
				<a href="/schedule" class="inline-block mt-6 text-sm text-gray-500 hover:text-gray-700 underline">Book a new time</a>
			</div>
		{:else}
			<div class="text-center">
				<h1 class="text-xl font-bold text-gray-900 mb-2">Cancel this booking?</h1>
				<div class="bg-gray-50 rounded-xl p-5 text-left my-6 text-sm space-y-2">
					<div class="flex justify-between"><span class="text-gray-500">Meeting</span><span class="font-medium text-gray-900">{booking.event_types?.name || 'Meeting'}</span></div>
					<div class="flex justify-between"><span class="text-gray-500">When</span><span class="font-medium text-gray-900">{formatDateTime(booking.start_time)}</span></div>
					<div class="flex justify-between"><span class="text-gray-500">With</span><span class="font-medium text-gray-900">{ownerName}</span></div>
				</div>
				{#if error}
					<p class="text-sm text-red-500 mb-4">{error}</p>
				{/if}
				<button onclick={cancel} disabled={cancelling} class="w-full py-3 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all">
					{cancelling ? 'Cancelling...' : 'Yes, cancel this booking'}
				</button>
				<a href="/" class="block mt-3 text-sm text-gray-400 hover:text-gray-600">Never mind</a>
			</div>
		{/if}
	</div>
</div>
