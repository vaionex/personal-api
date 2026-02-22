<script>
	let { data } = $props();
	const { ownerName, eventType } = data;

	let step = $state('date'); // 'date' → 'time' → 'form' → 'confirmed'
	let selectedDate = $state(null);
	let selectedSlot = $state(null);
	let slots = $state([]);
	let loadingSlots = $state(false);
	let booking = $state(false);
	let confirmation = $state(null);
	let error = $state(null);

	let name = $state('');
	let email = $state('');
	let notes = $state('');
	let timezone = $state(Intl.DateTimeFormat().resolvedOptions().timeZone);

	// Generate next 14 days
	const days = Array.from({ length: 14 }, (_, i) => {
		const d = new Date();
		d.setDate(d.getDate() + i);
		return {
			date: d.toISOString().split('T')[0],
			label: d.toLocaleDateString('en-US', { weekday: 'short' }),
			day: d.getDate(),
			month: d.toLocaleDateString('en-US', { month: 'short' }),
			isToday: i === 0,
		};
	});

	async function selectDate(date) {
		selectedDate = date;
		selectedSlot = null;
		loadingSlots = true;
		error = null;

		try {
			const from = date;
			const to = new Date(new Date(date).getTime() + 86400000).toISOString().split('T')[0];
			const res = await fetch(`/api/schedule/slots?type=${eventType.slug}&from=${from}&to=${to}`);
			const data = await res.json();
			if (data.error) {
				error = data.error;
				slots = [];
			} else {
				slots = data.dates?.[0]?.slots || [];
			}
		} catch {
			error = 'Failed to load available times';
			slots = [];
		}
		loadingSlots = false;
		if (slots.length > 0) step = 'time';
	}

	function selectSlot(slot) {
		selectedSlot = slot;
		step = 'form';
	}

	async function book() {
		if (!name || !email || !selectedSlot) return;
		booking = true;
		error = null;

		try {
			const res = await fetch('/api/schedule/book', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					eventType: eventType.slug,
					startTime: selectedSlot.start,
					name,
					email,
					notes: notes || undefined,
					timezone,
				}),
			});
			const data = await res.json();
			if (data.error) {
				error = data.error;
			} else {
				confirmation = data;
				step = 'confirmed';
			}
		} catch {
			error = 'Failed to book. Please try again.';
		}
		booking = false;
	}

	function formatTime(iso) {
		return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: timezone });
	}

	function formatDate(dateStr) {
		return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
	}
</script>

<svelte:head>
	<title>{eventType.name} — {ownerName}</title>
</svelte:head>

<div class="min-h-screen bg-white">
	<header class="border-b border-gray-100">
		<div class="max-w-3xl mx-auto px-6 py-4">
			<a href="/schedule" class="flex items-center gap-3">
				<div class="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
					<span class="text-white text-xs font-bold">{ownerName.split(' ').map(n => n[0]).join('')}</span>
				</div>
				<span class="text-sm font-semibold text-gray-900">{ownerName}</span>
			</a>
		</div>
	</header>

	<div class="max-w-3xl mx-auto px-6 py-10">
		{#if step === 'confirmed'}
			<!-- Confirmation -->
			<div class="max-w-md mx-auto text-center py-12">
				<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
					<svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
				</div>
				<h1 class="text-2xl font-bold text-gray-900 mb-2">You're booked!</h1>
				<p class="text-gray-500 mb-6">{confirmation.message}</p>
				<div class="bg-gray-50 rounded-xl p-5 text-left mb-6">
					<div class="text-sm space-y-2">
						<div class="flex justify-between"><span class="text-gray-500">What</span><span class="font-medium text-gray-900">{eventType.name}</span></div>
						<div class="flex justify-between"><span class="text-gray-500">When</span><span class="font-medium text-gray-900">{formatDate(selectedDate)}, {formatTime(selectedSlot.start)}</span></div>
						<div class="flex justify-between"><span class="text-gray-500">Duration</span><span class="font-medium text-gray-900">{eventType.duration_minutes} minutes</span></div>
					</div>
				</div>
				{#if confirmation.booking?.cancelUrl}
					<p class="text-xs text-gray-400">Need to cancel? <a href={confirmation.booking.cancelUrl} class="text-gray-500 underline">Cancel booking</a></p>
				{/if}
			</div>

		{:else}
			<!-- Booking flow -->
			<div class="flex gap-8">
				<!-- Left: event info -->
				<div class="w-64 flex-shrink-0">
					<div class="sticky top-10">
						<div class="flex items-center gap-2 mb-3">
							<div class="w-3 h-3 rounded-full" style="background-color: {eventType.color}"></div>
							<h1 class="text-lg font-bold text-gray-900">{eventType.name}</h1>
						</div>
						{#if eventType.description}
							<p class="text-sm text-gray-500 mb-4">{eventType.description}</p>
						{/if}
						<div class="text-sm text-gray-400 space-y-2">
							<div class="flex items-center gap-2">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
								{eventType.duration_minutes} minutes
							</div>
							<div class="flex items-center gap-2">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
								{timezone}
							</div>
						</div>

						{#if selectedDate}
							<div class="mt-6 pt-6 border-t border-gray-100">
								<p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Selected</p>
								<p class="text-sm font-medium text-gray-900">{formatDate(selectedDate)}</p>
								{#if selectedSlot}
									<p class="text-sm text-gray-500">{formatTime(selectedSlot.start)}</p>
								{/if}
							</div>
						{/if}
					</div>
				</div>

				<!-- Right: picker -->
				<div class="flex-1 min-w-0">
					{#if step === 'date' || step === 'time'}
						<!-- Date picker -->
						<h2 class="text-sm font-semibold text-gray-900 mb-4">Select a date</h2>
						<div class="flex gap-2 overflow-x-auto pb-2 mb-6">
							{#each days as day}
								<button
									onclick={() => selectDate(day.date)}
									class="flex-shrink-0 w-16 py-3 rounded-xl border text-center transition-all
										{selectedDate === day.date ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 hover:border-gray-300 text-gray-700'}"
								>
									<div class="text-[10px] uppercase tracking-wider {selectedDate === day.date ? 'text-gray-400' : 'text-gray-400'}">{day.label}</div>
									<div class="text-lg font-semibold">{day.day}</div>
									<div class="text-[10px] {selectedDate === day.date ? 'text-gray-400' : 'text-gray-400'}">{day.month}</div>
								</button>
							{/each}
						</div>

						<!-- Time slots -->
						{#if selectedDate}
							{#if loadingSlots}
								<div class="py-8 text-center text-sm text-gray-400">Loading available times...</div>
							{:else if error}
								<div class="py-8 text-center text-sm text-red-500">{error}</div>
							{:else if slots.length === 0}
								<div class="py-8 text-center text-sm text-gray-400">No available times on this date.</div>
							{:else}
								<h2 class="text-sm font-semibold text-gray-900 mb-3">Available times</h2>
								<div class="grid grid-cols-3 gap-2">
									{#each slots as slot}
										<button
											onclick={() => selectSlot(slot)}
											class="py-2.5 px-3 rounded-lg border text-sm font-medium transition-all
												{selectedSlot?.start === slot.start ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 hover:border-gray-400 text-gray-700'}"
										>{formatTime(slot.start)}</button>
									{/each}
								</div>
							{/if}
						{/if}

					{:else if step === 'form'}
						<!-- Booking form -->
						<button onclick={() => { step = 'time'; }} class="text-sm text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
							Back
						</button>

						<h2 class="text-lg font-semibold text-gray-900 mb-6">Your details</h2>

						<div class="space-y-4 max-w-sm">
							<div>
								<label for="name" class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
								<input id="name" bind:value={name} required class="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400" placeholder="Jane Smith" />
							</div>
							<div>
								<label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
								<input id="email" type="email" bind:value={email} required class="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400" placeholder="jane@example.com" />
							</div>
							<div>
								<label for="notes" class="block text-sm font-medium text-gray-700 mb-1">Notes <span class="text-gray-400 font-normal">(optional)</span></label>
								<textarea id="notes" bind:value={notes} rows="3" class="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 resize-none" placeholder="Anything you'd like to discuss?"></textarea>
							</div>

							{#if error}
								<p class="text-sm text-red-500">{error}</p>
							{/if}

							<button
								onclick={book}
								disabled={booking || !name || !email}
								class="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
							>
								{booking ? 'Booking...' : 'Confirm booking'}
							</button>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
