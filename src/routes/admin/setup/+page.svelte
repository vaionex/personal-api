<script>
	import { page } from '$app/stores';
	
	let { data } = $props();
	let currentStep = $state(1);
	let isLoading = $state(false);
	let error = $state(null);
	
	// Form data for each step
	let aboutYouData = $state({
		name: data.ownerName || '',
		role: '',
		location: '',
		background: '',
		techStack: '',
		declineReason: ''
	});
	
	let availabilityData = $state({
		monday: { enabled: true, start: '09:00', end: '17:00' },
		tuesday: { enabled: true, start: '09:00', end: '17:00' },
		wednesday: { enabled: true, start: '09:00', end: '17:00' },
		thursday: { enabled: true, start: '09:00', end: '17:00' },
		friday: { enabled: true, start: '09:00', end: '17:00' },
		saturday: { enabled: false, start: '09:00', end: '17:00' },
		sunday: { enabled: false, start: '09:00', end: '17:00' }
	});
	
	let meetingTypesData = $state([
		{ name: 'Quick Chat', duration: 15, description: 'Brief conversation or quick question' },
		{ name: 'Consultation', duration: 30, description: 'In-depth discussion or advice session' },
		{ name: 'Deep Dive', duration: 60, description: 'Comprehensive meeting or detailed review' }
	]);
	
	async function nextStep() {
		if (currentStep === 1) {
			await saveAboutYou();
		} else if (currentStep === 2) {
			await saveAvailability();
		} else if (currentStep === 3) {
			await saveMeetingTypes();
		}
		
		if (!error) {
			currentStep++;
		}
	}
	
	async function saveAboutYou() {
		isLoading = true;
		error = null;
		
		try {
			const knowledgeEntries = [];
			
			if (aboutYouData.name) knowledgeEntries.push({ topic: 'Name', content: aboutYouData.name, category: 'personal' });
			if (aboutYouData.role) knowledgeEntries.push({ topic: 'Role', content: aboutYouData.role, category: 'professional' });
			if (aboutYouData.location) knowledgeEntries.push({ topic: 'Location', content: aboutYouData.location, category: 'personal' });
			if (aboutYouData.background) knowledgeEntries.push({ topic: 'Background', content: aboutYouData.background, category: 'professional' });
			if (aboutYouData.techStack) knowledgeEntries.push({ topic: 'Tech Stack', content: aboutYouData.techStack, category: 'technical' });
			if (aboutYouData.declineReason) knowledgeEntries.push({ topic: 'Decline Guidelines', content: aboutYouData.declineReason, category: 'guidelines' });
			
			for (const entry of knowledgeEntries) {
				const response = await fetch('/api/admin/knowledge', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(entry)
				});
				
				if (!response.ok) {
					throw new Error(`Failed to save ${entry.topic}`);
				}
			}
		} catch (e) {
			error = e.message;
		}
		
		isLoading = false;
	}
	
	async function saveAvailability() {
		isLoading = true;
		error = null;
		
		try {
			const rules = [];
			
			for (const [day, schedule] of Object.entries(availabilityData)) {
				if (schedule.enabled) {
					rules.push({
						day_of_week: getDayNumber(day),
						start_time: schedule.start,
						end_time: schedule.end,
						active: true
					});
				}
			}
			
			for (const rule of rules) {
				const response = await fetch('/api/admin/bookings', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ type: 'scheduling_rule', ...rule })
				});
				
				if (!response.ok) {
					throw new Error(`Failed to save availability for ${getDayName(rule.day_of_week)}`);
				}
			}
		} catch (e) {
			error = e.message;
		}
		
		isLoading = false;
	}
	
	async function saveMeetingTypes() {
		isLoading = true;
		error = null;
		
		try {
			for (const meetingType of meetingTypesData) {
				const response = await fetch('/api/admin/bookings', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ 
						type: 'event_type',
						name: meetingType.name,
						duration: meetingType.duration,
						description: meetingType.description || '',
						slug: meetingType.name.toLowerCase().replace(/\s+/g, '-'),
						active: true
					})
				});
				
				if (!response.ok) {
					throw new Error(`Failed to save meeting type: ${meetingType.name}`);
				}
			}
		} catch (e) {
			error = e.message;
		}
		
		isLoading = false;
	}
	
	function getDayNumber(dayName) {
		const days = { 
			sunday: 0, monday: 1, tuesday: 2, wednesday: 3, 
			thursday: 4, friday: 5, saturday: 6 
		};
		return days[dayName] ?? 1;
	}
	
	function getDayName(dayNumber) {
		const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		return days[dayNumber] || 'Unknown';
	}
	
	function addMeetingType() {
		meetingTypesData.push({ name: '', duration: 30, description: '' });
	}
	
	function removeMeetingType(index) {
		meetingTypesData.splice(index, 1);
	}
</script>

<svelte:head>
	<title>Setup Wizard - Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<div class="max-w-4xl mx-auto p-6">
		{#if data.setupComplete}
			<!-- Already set up -->
			<div class="bg-white rounded-xl border border-gray-200 p-8 text-center">
				<div class="text-green-500 mb-4">
					<svg class="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
					</svg>
				</div>
				<h1 class="text-2xl font-bold text-gray-900 mb-2">Setup Already Complete!</h1>
				<p class="text-gray-600 mb-6">Your Personal API is already configured and ready to use.</p>
				<div class="space-x-4">
					<a href="/admin" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
						View Dashboard
					</a>
					<a href="/" target="_blank" class="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
						View Public Page
					</a>
				</div>
			</div>
		{:else}
			<!-- Setup Wizard -->
			<div class="mb-8">
				<h1 class="text-3xl font-bold text-gray-900 mb-2">Setup Your Personal API</h1>
				<p class="text-gray-600">Let's get you set up in just a few steps</p>
			</div>

			<!-- Progress Bar -->
			<div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
				<div class="flex items-center justify-between mb-4">
					{#each [1, 2, 3, 4] as step}
						<div class="flex items-center">
							<div class="flex items-center justify-center w-8 h-8 rounded-full {step <= currentStep ? 'bg-blue-600 text-white' : step < currentStep ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}">
								{#if step < currentStep}
									<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
									</svg>
								{:else}
									{step}
								{/if}
							</div>
							{#if step < 4}
								<div class="w-12 h-1 mx-2 {step < currentStep ? 'bg-green-600' : 'bg-gray-200'}"></div>
							{/if}
						</div>
					{/each}
				</div>
				<div class="flex justify-between text-sm text-gray-600">
					<span class={currentStep === 1 ? 'font-medium text-blue-600' : ''}>About You</span>
					<span class={currentStep === 2 ? 'font-medium text-blue-600' : ''}>Availability</span>
					<span class={currentStep === 3 ? 'font-medium text-blue-600' : ''}>Meeting Types</span>
					<span class={currentStep === 4 ? 'font-medium text-blue-600' : ''}>Done</span>
				</div>
			</div>

			<!-- Error Display -->
			{#if error}
				<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
					<div class="flex">
						<svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
						</svg>
						<div class="ml-3">
							<p class="text-red-800">{error}</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Step Content -->
			<div class="bg-white rounded-xl border border-gray-200 p-6">
				{#if currentStep === 1}
					<!-- Step 1: About You -->
					<h2 class="text-xl font-bold text-gray-900 mb-4">Tell us about yourself</h2>
					<p class="text-gray-600 mb-6">This information will help personalize your API responses.</p>
					
					<div class="space-y-6">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
							<input bind:value={aboutYouData.name} type="text" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Your full name">
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">Role/Title</label>
							<input bind:value={aboutYouData.role} type="text" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., Software Developer, Consultant, Designer">
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">Location</label>
							<input bind:value={aboutYouData.location} type="text" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., San Francisco, CA">
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">Background</label>
							<textarea bind:value={aboutYouData.background} rows="3" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Brief description of your professional background"></textarea>
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">Tech Stack</label>
							<input bind:value={aboutYouData.techStack} type="text" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., React, Node.js, Python, AWS">
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">What should I decline?</label>
							<textarea bind:value={aboutYouData.declineReason} rows="3" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="What types of requests or meetings should I politely decline?"></textarea>
						</div>
					</div>

				{:else if currentStep === 2}
					<!-- Step 2: Availability -->
					<h2 class="text-xl font-bold text-gray-900 mb-4">Set your availability</h2>
					<p class="text-gray-600 mb-6">When are you available for meetings?</p>
					
					<div class="space-y-4">
						{#each Object.entries(availabilityData) as [day, schedule]}
							<div class="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
								<div class="w-24">
									<label class="flex items-center">
										<input bind:checked={schedule.enabled} type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
										<span class="ml-2 text-sm font-medium text-gray-700 capitalize">{day}</span>
									</label>
								</div>
								{#if schedule.enabled}
									<div class="flex items-center space-x-2">
										<input bind:value={schedule.start} type="time" class="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
										<span class="text-gray-500">to</span>
										<input bind:value={schedule.end} type="time" class="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
									</div>
								{/if}
							</div>
						{/each}
					</div>

				{:else if currentStep === 3}
					<!-- Step 3: Meeting Types -->
					<h2 class="text-xl font-bold text-gray-900 mb-4">Configure meeting types</h2>
					<p class="text-gray-600 mb-6">What types of meetings do you offer?</p>
					
					<div class="space-y-4">
						{#each meetingTypesData as meetingType, index}
							<div class="p-4 border border-gray-200 rounded-lg">
								<div class="flex items-start justify-between mb-4">
									<div class="flex-1 space-y-4">
										<div class="grid grid-cols-2 gap-4">
											<div>
												<label class="block text-sm font-medium text-gray-700 mb-1">Meeting Name</label>
												<input bind:value={meetingType.name} type="text" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
											</div>
											<div>
												<label class="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
												<input bind:value={meetingType.duration} type="number" min="15" max="240" step="15" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
											</div>
										</div>
										<div>
											<label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
											<input bind:value={meetingType.description} type="text" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Brief description of this meeting type">
										</div>
									</div>
									{#if meetingTypesData.length > 1}
										<button onclick={() => removeMeetingType(index)} class="ml-4 p-2 text-red-600 hover:bg-red-50 rounded">
											<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
												<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
											</svg>
										</button>
									{/if}
								</div>
							</div>
						{/each}
						
						<button onclick={addMeetingType} class="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800">
							+ Add Meeting Type
						</button>
					</div>

				{:else if currentStep === 4}
					<!-- Step 4: Done -->
					<div class="text-center py-8">
						<div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 rounded-2xl mb-8">
							<div class="relative">
								<!-- Confetti-like animation background -->
								<div class="absolute inset-0 overflow-hidden rounded-2xl">
									<div class="absolute top-0 left-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
									<div class="absolute top-4 right-1/3 w-1 h-1 bg-pink-300 rounded-full animate-bounce" style="animation-delay: 0.5s"></div>
									<div class="absolute bottom-4 left-1/3 w-1 h-1 bg-green-300 rounded-full animate-ping" style="animation-delay: 1s"></div>
									<div class="absolute bottom-0 right-1/4 w-2 h-2 bg-blue-300 rounded-full animate-pulse" style="animation-delay: 1.5s"></div>
								</div>
								<div class="relative z-10">
									<svg class="w-20 h-20 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
									</svg>
									<h2 class="text-3xl font-bold mb-2">Your Personal API is ready! 🎉</h2>
									<p class="text-blue-100">Everything is configured and ready to use.</p>
								</div>
							</div>
						</div>
						
						<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
							<a href="/" target="_blank" class="flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
								<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
								</svg>
								View your public page
							</a>
							<a href="/admin/knowledge" class="flex items-center justify-center px-6 py-4 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
								<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
								</svg>
								Manage knowledge
							</a>
							<button onclick="navigator.clipboard?.writeText('{data.appUrl}')" class="flex items-center justify-center px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
								<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
								</svg>
								Share your link
							</button>
						</div>
						
						<p class="text-gray-600">
							Your public API is now live at <strong>{data.appUrl}</strong>
						</p>
					</div>
				{/if}

				<!-- Navigation Buttons -->
				{#if currentStep < 4}
					<div class="flex justify-between pt-6 mt-6 border-t border-gray-200">
						<button 
							onclick={() => currentStep--} 
							disabled={currentStep === 1}
							class="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
							← Previous
						</button>
						<button 
							onclick={nextStep}
							disabled={isLoading}
							class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
							{#if isLoading}
								<svg class="animate-spin w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24">
									<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle>
									<path fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" class="opacity-75"></path>
								</svg>
							{/if}
							{currentStep === 3 ? 'Complete Setup' : 'Next'} →
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>