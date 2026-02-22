<script>
	import AdminNav from '$lib/components/AdminNav.svelte';
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Admin Navigation -->
	<AdminNav />
	
	<!-- Main Content Area -->
	<div class="lg:pl-60">
		<main class="min-h-screen">
			<slot />
		</main>
	</div>
</div>