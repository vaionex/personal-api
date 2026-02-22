<script>
	import { PUBLIC_APP_URL } from '$env/static/public';
	
	let { data } = $props();
	
	let referrals = $state([]);
	let contacts = $state([]);
	let loading = $state(true);
	
	// Create referral form
	let newReferral = $state({
		contact_id: '',
		referrer_name: '',
		note: '',
		max_uses: 1,
		expires_at: ''
	});
	let creating = $state(false);
	
	async function load() {
		loading = true;
		try {
			const [referralsRes, contactsRes] = await Promise.all([
				fetch('/api/admin/referrals', {
					headers: { 'Authorization': `Bearer ${document.cookie.split('admin-session=')[1]?.split(';')[0]}` }
				}),
				fetch('/api/admin/contacts', {
					headers: { 'Authorization': `Bearer ${document.cookie.split('admin-session=')[1]?.split(';')[0]}` }
				})
			]);
			
			const [referralsData, contactsData] = await Promise.all([
				referralsRes.json(),
				contactsRes.json()
			]);
			
			referrals = referralsData.referrals || [];
			contacts = contactsData.contacts || [];
		} catch (err) {
			console.error('Load error:', err);
		} finally {
			loading = false;
		}
	}
	
	async function createReferral() {
		if (!newReferral.referrer_name) return;
		
		creating = true;
		try {
			const res = await fetch('/api/admin/referrals', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${document.cookie.split('admin-session=')[1]?.split(';')[0]}`
				},
				body: JSON.stringify(newReferral)
			});
			
			if (res.ok) {
				newReferral = {
					contact_id: '',
					referrer_name: '',
					note: '',
					max_uses: 1,
					expires_at: ''
				};
				await load();
			}
		} catch (err) {
			console.error('Create referral error:', err);
		} finally {
			creating = false;
		}
	}
	
	async function deactivateReferral(referralId) {
		if (!confirm('Deactivate this referral?')) return;
		
		try {
			const res = await fetch(`/api/admin/referrals?id=${referralId}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${document.cookie.split('admin-session=')[1]?.split(';')[0]}`
				}
			});
			
			if (res.ok) {
				await load();
			}
		} catch (err) {
			console.error('Deactivate referral error:', err);
		}
	}
	
	function copyReferralLink(token) {
		const link = `${PUBLIC_APP_URL}/?ref=${token}`;
		navigator.clipboard.writeText(link).then(() => {
			// Show some feedback (you could add a toast notification here)
			console.log('Referral link copied!');
		});
	}
	
	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
	
	function isExpired(expiresAt) {
		return expiresAt && new Date(expiresAt) < new Date();
	}
	
	function getStatusBadgeClass(referral) {
		if (!referral.active) return 'bg-gray-100 text-gray-700';
		if (isExpired(referral.expires_at)) return 'bg-red-100 text-red-700';
		if (referral.uses >= referral.max_uses) return 'bg-orange-100 text-orange-700';
		return 'bg-green-100 text-green-700';
	}
	
	function getStatus(referral) {
		if (!referral.active) return 'Inactive';
		if (isExpired(referral.expires_at)) return 'Expired';
		if (referral.uses >= referral.max_uses) return 'Used up';
		return 'Active';
	}
	
	$effect(() => { load(); });
</script>

<svelte:head>
	<title>Referrals — Admin</title>
</svelte:head>



	<div class="max-w-5xl mx-auto px-6 py-8">
		{#if loading}
			<div class="text-center py-8">
				<div class="text-gray-400">Loading referrals...</div>
			</div>
		{:else}
			<!-- Create Referral -->
			<div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Create New Referral</h3>
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Referrer Contact</label>
						<select
							bind:value={newReferral.contact_id}
							class="w-full border border-gray-300 rounded-lg px-3 py-2"
						>
							<option value="">Select a contact (optional)</option>
							{#each contacts as contact}
								<option value={contact.id}>{contact.name} - {contact.email || contact.company || 'No details'}</option>
							{/each}
						</select>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Referrer Name</label>
						<input
							bind:value={newReferral.referrer_name}
							type="text"
							placeholder="Jane Smith"
							class="w-full border border-gray-300 rounded-lg px-3 py-2"
							required
						/>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Max Uses</label>
						<input
							bind:value={newReferral.max_uses}
							type="number"
							min="1"
							class="w-full border border-gray-300 rounded-lg px-3 py-2"
						/>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Expires At (optional)</label>
						<input
							bind:value={newReferral.expires_at}
							type="datetime-local"
							class="w-full border border-gray-300 rounded-lg px-3 py-2"
						/>
					</div>
				</div>
				
				<div class="mb-4">
					<label class="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
					<textarea
						bind:value={newReferral.note}
						rows="2"
						placeholder="Introducing Jane, she's working on an AI project..."
						class="w-full border border-gray-300 rounded-lg px-3 py-2"
					></textarea>
				</div>
				
				<button
					onclick={createReferral}
					disabled={creating || !newReferral.referrer_name}
					class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
				>
					{creating ? 'Creating...' : 'Create Referral'}
				</button>
			</div>

			<!-- Referrals List -->
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<div class="px-6 py-4 border-b border-gray-200">
					<h3 class="text-lg font-semibold text-gray-900">All Referrals</h3>
				</div>
				
				{#if referrals.length === 0}
					<div class="p-8 text-center text-gray-500">
						No referrals created yet.
					</div>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead class="bg-gray-50">
								<tr>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referrer</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-200">
								{#each referrals as referral}
									<tr class="hover:bg-gray-50">
										<td class="px-6 py-4">
											<div>
												<div class="font-medium text-gray-900">{referral.referrer_name}</div>
												{#if referral.note}
													<div class="text-sm text-gray-500 mt-1 italic">"{referral.note}"</div>
												{/if}
												{#if referral.contacts}
													<div class="text-xs text-blue-600 mt-1">
														Contact: {referral.contacts.name}
													</div>
												{/if}
											</div>
										</td>
										<td class="px-6 py-4">
											<div class="text-sm">
												<div class="font-medium">{referral.uses} / {referral.max_uses} uses</div>
												{#if referral.expires_at}
													<div class="text-gray-500">Expires: {formatDate(referral.expires_at)}</div>
												{/if}
											</div>
											
											{#if referral.used_by && referral.used_by.length > 0}
												<div class="mt-2 space-y-1">
													{#each referral.used_by as user}
														<div class="text-xs bg-gray-100 px-2 py-1 rounded">
															{user.name} ({user.email}) - {formatDate(user.used_at)}
														</div>
													{/each}
												</div>
											{/if}
										</td>
										<td class="px-6 py-4">
											<span class="inline-block px-2 py-1 text-xs font-medium rounded-full {getStatusBadgeClass(referral)}">
												{getStatus(referral)}
											</span>
										</td>
										<td class="px-6 py-4 text-sm text-gray-500">
											{formatDate(referral.created_at)}
										</td>
										<td class="px-6 py-4">
											<div class="flex items-center gap-2">
												<button
													onclick={() => copyReferralLink(referral.token)}
													class="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
													title="Copy referral link"
												>
													Copy Link
												</button>
												
												{#if referral.active}
													<button
														onclick={() => deactivateReferral(referral.id)}
														class="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
													>
														Deactivate
													</button>
												{/if}
											</div>
											
											<div class="mt-2 text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
												{PUBLIC_APP_URL}/?ref={referral.token}
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		{/if}
	</div>
