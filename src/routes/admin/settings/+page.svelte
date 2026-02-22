<script>
	import { enhance } from '$app/forms';
	
	let { data, form } = $props();
	let testResult = $state(null);
	let testLoading = $state(false);
	
	async function runTest() {
		testLoading = true;
		testResult = null;
		
		try {
			const res = await fetch('/api/ask', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					query: 'Hello, can you tell me a bit about yourself?', 
					name: 'Test User',
					channel: 'settings-test' 
				}),
			});
			
			const result = await res.json();
			testResult = { success: true, data: result };
		} catch (e) {
			testResult = { success: false, error: e.message };
		}
		
		testLoading = false;
	}
</script>

<svelte:head>
	<title>Settings - Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<div class="max-w-7xl mx-auto p-6">
		<div class="mb-6">
			<h1 class="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
			<p class="text-gray-600">View current configuration and test the system</p>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
			<!-- App Configuration -->
			<div class="bg-white rounded-xl border border-gray-200 p-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">App Configuration</h2>
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
						<div class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{data.config.ownerName}</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">App Name</label>
						<div class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{data.config.appName}</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">App URL</label>
						<div class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{data.config.appUrl}</div>
					</div>
				</div>
			</div>

			<!-- Services Status -->
			<div class="bg-white rounded-xl border border-gray-200 p-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">Services Status</h2>
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-gray-700">AI Model</span>
						<div class="flex items-center gap-2">
							<div class="w-2 h-2 rounded-full bg-{data.config.anthropicEnabled ? 'green' : 'red'}-500"></div>
							<span class="text-sm text-gray-600">{data.config.anthropicEnabled ? 'Connected' : 'Not configured'}</span>
						</div>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-gray-700">Database</span>
						<div class="flex items-center gap-2">
							<div class="w-2 h-2 rounded-full bg-{data.config.supabaseEnabled ? 'green' : 'red'}-500"></div>
							<span class="text-sm text-gray-600">{data.config.supabaseEnabled ? 'Connected' : 'Not configured'}</span>
						</div>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-gray-700">Telegram Bot</span>
						<div class="flex items-center gap-2">
							<div class="w-2 h-2 rounded-full bg-{data.config.telegramEnabled ? 'green' : 'red'}-500"></div>
							<span class="text-sm text-gray-600">{data.config.telegramEnabled ? 'Configured' : 'Not configured'}</span>
						</div>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-gray-700">Admin Auth</span>
						<div class="flex items-center gap-2">
							<div class="w-2 h-2 rounded-full bg-{data.config.adminEnabled ? 'green' : 'orange'}-500"></div>
							<span class="text-sm text-gray-600">{data.config.adminEnabled ? 'Enabled' : 'No password set'}</span>
						</div>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-gray-700">API Keys</span>
						<div class="flex items-center gap-2">
							<div class="w-2 h-2 rounded-full bg-{data.config.apiKeysEnabled ? 'green' : 'orange'}-500"></div>
							<span class="text-sm text-gray-600">{data.config.apiKeysEnabled ? 'Required' : 'Open access'}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Test System -->
		<div class="bg-white rounded-xl border border-gray-200 p-6">
			<div class="flex items-center justify-between mb-4">
				<div>
					<h2 class="text-lg font-semibold text-gray-900">Test System</h2>
					<p class="text-sm text-gray-600">Send a test query through the engine to verify everything works</p>
				</div>
				<button 
					onclick={runTest}
					disabled={testLoading}
					class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
				>
					{testLoading ? 'Testing...' : 'Run Test'}
				</button>
			</div>

			{#if testResult}
				<div class="border-t border-gray-200 pt-4">
					{#if testResult.success}
						<div class="bg-green-50 border border-green-200 rounded-lg p-4">
							<h3 class="font-medium text-green-800 mb-2">✅ Test Successful</h3>
							<div class="text-sm text-green-700 space-y-2">
								<p><strong>Classification:</strong> {testResult.data.type}</p>
								<p><strong>Response:</strong> {testResult.data.response}</p>
							</div>
						</div>
					{:else}
						<div class="bg-red-50 border border-red-200 rounded-lg p-4">
							<h3 class="font-medium text-red-800 mb-2">❌ Test Failed</h3>
							<p class="text-sm text-red-700">{testResult.error}</p>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>