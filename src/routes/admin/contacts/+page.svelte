<script>
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	
	let editingContact = $state(null);
	let showForm = $state(false);
	let contacts = $state(data.contacts || []);
	
	function editContact(contact) {
		editingContact = contact;
		showForm = true;
	}
	
	function newContact() {
		editingContact = null;
		showForm = true;
	}
	
	function cancelEdit() {
		editingContact = null;
		showForm = false;
	}
</script>

<svelte:head>
	<title>Contacts - Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<div class="max-w-7xl mx-auto p-6">
		<div class="flex items-center justify-between mb-6">
			<div>
				<h1 class="text-2xl font-bold text-gray-900">Contacts</h1>
				<p class="text-gray-600">Manage people the AI assistant knows about</p>
			</div>
			<button 
				onclick={newContact}
				class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
			>
				Add Contact
			</button>
		</div>

		{#if showForm}
			<div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
				<h2 class="text-lg font-semibold mb-4">
					{editingContact ? 'Edit Contact' : 'New Contact'}
				</h2>
				
				<form 
					method="POST" 
					action="?/{editingContact ? 'update' : 'create'}"
					use:enhance={() => {
						return async ({ result, update }) => {
							if (result.type === 'success') {
								contacts = result.data?.contacts || contacts;
								cancelEdit();
							}
							await update();
						};
					}}
				>
					{#if editingContact}
						<input type="hidden" name="id" value={editingContact.id} />
					{/if}
					
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Name *
							</label>
							<input 
								name="name" 
								type="text" 
								value={editingContact?.name || ''}
								required
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
							/>
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Email
							</label>
							<input 
								name="email" 
								type="email" 
								value={editingContact?.email || ''}
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
							/>
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Company
							</label>
							<input 
								name="company" 
								type="text" 
								value={editingContact?.company || ''}
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
							/>
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Relationship
							</label>
							<select 
								name="relationship" 
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							>
								<option value="unknown" selected={editingContact?.relationship === 'unknown'}>Unknown</option>
								<option value="acquaintance" selected={editingContact?.relationship === 'acquaintance'}>Acquaintance</option>
								<option value="professional" selected={editingContact?.relationship === 'professional'}>Professional</option>
								<option value="close" selected={editingContact?.relationship === 'close'}>Close</option>
							</select>
						</div>
					</div>
					
					<div class="mb-4">
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Notes
						</label>
						<textarea 
							name="notes" 
							rows="3"
							value={editingContact?.notes || ''}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						></textarea>
					</div>
					
					<div class="mb-6">
						<label class="flex items-center">
							<input 
								name="always_escalate" 
								type="checkbox" 
								checked={editingContact?.always_escalate || false}
								class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
							/>
							<span class="ml-2 text-sm text-gray-700">Always escalate messages from this contact</span>
						</label>
					</div>
					
					<div class="flex gap-3">
						<button 
							type="submit"
							class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
						>
							{editingContact ? 'Update' : 'Create'} Contact
						</button>
						<button 
							type="button"
							onclick={cancelEdit}
							class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 font-medium"
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		{/if}

		<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
			{#if contacts.length === 0}
				<div class="p-8 text-center">
					<p class="text-gray-500">No contacts yet. Add your first contact above.</p>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-gray-50 border-b border-gray-200">
							<tr>
								<th class="text-left py-3 px-4 font-medium text-gray-900">Name</th>
								<th class="text-left py-3 px-4 font-medium text-gray-900">Email</th>
								<th class="text-left py-3 px-4 font-medium text-gray-900">Company</th>
								<th class="text-left py-3 px-4 font-medium text-gray-900">Relationship</th>
								<th class="text-left py-3 px-4 font-medium text-gray-900">Always Escalate</th>
								<th class="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each contacts as contact}
								<tr class="border-b border-gray-100 hover:bg-gray-50">
									<td class="py-3 px-4 font-medium text-gray-900">{contact.name}</td>
									<td class="py-3 px-4 text-gray-600">{contact.email || '-'}</td>
									<td class="py-3 px-4 text-gray-600">{contact.company || '-'}</td>
									<td class="py-3 px-4">
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
											{contact.relationship === 'close' ? 'bg-green-100 text-green-800' : 
											contact.relationship === 'professional' ? 'bg-blue-100 text-blue-800' : 
											contact.relationship === 'acquaintance' ? 'bg-yellow-100 text-yellow-800' : 
											'bg-gray-100 text-gray-800'}">
											{contact.relationship}
										</span>
									</td>
									<td class="py-3 px-4">
										{#if contact.always_escalate}
											<span class="text-orange-600 font-medium">Yes</span>
										{:else}
											<span class="text-gray-400">No</span>
										{/if}
									</td>
									<td class="py-3 px-4">
										<div class="flex gap-2">
											<button 
												onclick={() => editContact(contact)}
												class="text-blue-600 hover:text-blue-800 text-sm font-medium"
											>
												Edit
											</button>
											<form method="POST" action="?/delete" class="inline" use:enhance>
												<input type="hidden" name="id" value={contact.id} />
												<button 
													type="submit"
													onclick={() => confirm('Delete this contact?')}
													class="text-red-600 hover:text-red-800 text-sm font-medium"
												>
													Delete
												</button>
											</form>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
</div>