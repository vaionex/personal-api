<script>
	import { enhance } from '$app/forms';

	let { form } = $props();
	let password = $state('');
	let loading = $state(false);
</script>

<main class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<div class="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
			<div class="text-center mb-8">
				<h1 class="text-2xl font-bold text-gray-900 mb-2">Admin Login</h1>
				<p class="text-gray-600">Enter the admin password to continue</p>
			</div>

			<form 
				method="POST" 
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						await update();
					};
				}}
			>
				<div class="mb-6">
					<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
						Password
					</label>
					<input
						id="password"
						name="password"
						type="password"
						bind:value={password}
						required
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
						placeholder="Enter admin password"
					/>
				</div>

				{#if form?.error}
					<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
						<p class="text-sm text-red-700">{form.error}</p>
					</div>
				{/if}

				<button
					type="submit"
					disabled={loading || !password}
					class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{loading ? 'Checking...' : 'Login'}
				</button>
			</form>
		</div>
	</div>
</main>