<script>
	import { page } from '$app/stores';

	let mobileMenuOpen = $state(false);

	// Navigation items with SVG icons
	const navItems = [
		{
			name: 'Overview',
			path: '/admin',
			icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m8 5 4-4 4 4"></path></svg>`
		},
		{
			name: 'Knowledge',
			path: '/admin/knowledge',
			icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>`
		},
		{
			name: 'Interactions',
			path: '/admin',
			icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>`,
			hash: '#interactions'
		},
		{
			name: 'Bookings',
			path: '/admin/bookings',
			icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`
		},
		{
			name: 'Trust',
			path: '/admin/trust',
			icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>`
		},
		{
			name: 'Referrals',
			path: '/admin/referrals',
			icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>`
		},
		{
			name: 'Contacts',
			path: '/admin/contacts',
			icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>`
		},
		{
			name: 'Routes',
			path: '/admin/routes',
			icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>`
		},
		{
			name: 'Pitches',
			path: '/admin/pitches',
			icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18l8.5-5L5 8v10zM5 8a2 2 0 012-2h6l2 2h5a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2V8z"></path></svg>`
		},
		{
			name: 'Dossiers',
			path: '/admin/dossiers',
			icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>`
		},
		{
			name: 'Settings',
			path: '/admin/settings',
			icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`
		}
	];

	// Check if current path is active
	function isActive(item) {
		const currentPath = $page.url.pathname;
		const currentHash = $page.url.hash;
		
		// Handle interaction tab (has hash)
		if (item.hash) {
			return currentPath === item.path && currentHash === item.hash;
		}
		
		// Exact match for overview
		if (item.path === '/admin') {
			return currentPath === '/admin' && !currentHash;
		}
		
		// Starts with for other pages
		return currentPath.startsWith(item.path) && item.path !== '/admin';
	}

	// Handle navigation
	function navigate(item) {
		if (item.hash) {
			// For interaction tab, scroll to the hash
			window.location.href = item.path + item.hash;
		} else {
			window.location.href = item.path;
		}
		mobileMenuOpen = false;
	}
</script>

<!-- Mobile menu overlay -->
{#if mobileMenuOpen}
	<div class="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onclick={() => mobileMenuOpen = false}></div>
{/if}

<!-- Mobile menu button -->
<div class="lg:hidden fixed top-4 left-4 z-50">
	<button
		onclick={() => mobileMenuOpen = !mobileMenuOpen}
		class="p-2 bg-white rounded-lg border border-gray-200 shadow-lg"
		aria-label="Toggle menu"
	>
		<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
		</svg>
	</button>
</div>

<!-- Sidebar -->
<nav class="
	fixed top-0 left-0 h-full w-60 bg-white border-r border-gray-200 z-30 
	transform transition-transform duration-300 ease-in-out
	{mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
">
	<div class="flex flex-col h-full">
		<!-- Logo/Header -->
		<div class="p-6 border-b border-gray-100">
			<a href="/" class="text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors">
				Personal API
			</a>
		</div>

		<!-- Navigation Items -->
		<div class="flex-1 py-6 px-3 overflow-y-auto">
			<ul class="space-y-1">
				{#each navItems as item}
					<li>
						<button
							onclick={() => navigate(item)}
							class="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left
								{isActive(item) 
									? 'bg-gray-100 text-gray-900' 
									: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
								}"
						>
							<span class="flex-shrink-0">{@html item.icon}</span>
							{item.name}
						</button>
					</li>
				{/each}
			</ul>
		</div>

		<!-- Footer -->
		<div class="p-4 border-t border-gray-100">
			<a 
				href="/" 
				class="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
				</svg>
				Back to Site
			</a>
		</div>
	</div>
</nav>