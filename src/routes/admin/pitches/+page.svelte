<script>
	let { data } = $props();
	
	let pitches = $state([]);
	let loading = $state(true);
	let statusFilter = $state('all');
	let expandedPitch = $state(null);
	
	async function load() {
		loading = true;
		try {
			const url = statusFilter === 'all' 
				? '/api/admin/pitches'
				: `/api/admin/pitches?status=${statusFilter}`;
			
			const res = await fetch(url, {
				headers: { 'Authorization': `Bearer ${document.cookie.split('admin-session=')[1]?.split(';')[0]}` }
			});
			const data = await res.json();
			pitches = data.pitches || [];
		} catch (err) {
			console.error('Load error:', err);
		} finally {
			loading = false;
		}
	}
	
	async function updatePitchStatus(pitchId, status, adminNotes = '') {
		try {
			const res = await fetch('/api/admin/pitches', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${document.cookie.split('admin-session=')[1]?.split(';')[0]}`
				},
				body: JSON.stringify({
					pitch_id: pitchId,
					status,
					admin_notes: adminNotes || null
				})
			});
			
			if (res.ok) {
				await load();
				expandedPitch = null; // Close expanded view
			}
		} catch (err) {
			console.error('Update pitch error:', err);
		}
	}
	
	function toggleExpanded(pitchId) {
		expandedPitch = expandedPitch === pitchId ? null : pitchId;
	}
	
	function getStatusBadgeClass(status) {
		switch (status) {
			case 'pending': return 'bg-yellow-100 text-yellow-700';
			case 'reviewed': return 'bg-blue-100 text-blue-700';
			case 'approved': return 'bg-green-100 text-green-700';
			case 'rejected': return 'bg-red-100 text-red-700';
			default: return 'bg-gray-100 text-gray-700';
		}
	}
	
	function getScoreBadgeClass(score) {
		if (score >= 8) return 'bg-green-100 text-green-700';
		if (score >= 6) return 'bg-yellow-100 text-yellow-700';
		if (score >= 4) return 'bg-orange-100 text-orange-700';
		return 'bg-red-100 text-red-700';
	}
	
	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
	
	function formatDuration(seconds) {
		if (!seconds) return 'Unknown';
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
	}
	
	$effect(() => { load(); });
</script>

<svelte:head>
	<title>Video Pitches — Admin</title>
</svelte:head>



	<div class="max-w-6xl mx-auto px-6 py-8">
		{#if loading}
			<div class="text-center py-8">
				<div class="text-gray-400">Loading pitches...</div>
			</div>
		{:else}
			<!-- Filter Controls -->
			<div class="bg-white rounded-xl border border-gray-200 p-4 mb-6">
				<div class="flex items-center gap-4">
					<label class="text-sm font-medium text-gray-700">Filter by status:</label>
					<select
						bind:value={statusFilter}
						onchange={load}
						class="border border-gray-300 rounded-md px-3 py-1 text-sm"
					>
						<option value="all">All statuses</option>
						<option value="pending">Pending</option>
						<option value="reviewed">Reviewed</option>
						<option value="approved">Approved</option>
						<option value="rejected">Rejected</option>
					</select>
					
					<div class="text-sm text-gray-500 ml-auto">
						{pitches.length} pitches
					</div>
				</div>
			</div>

			<!-- Pitches List -->
			<div class="space-y-4">
				{#if pitches.length === 0}
					<div class="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
						No pitches found{statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}.
					</div>
				{:else}
					{#each pitches as pitch}
						<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
							<!-- Pitch Summary -->
							<div
								class="p-6 cursor-pointer hover:bg-gray-50"
								onclick={() => toggleExpanded(pitch.id)}
							>
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<div class="flex items-center gap-3 mb-2">
											<h3 class="text-lg font-semibold text-gray-900">{pitch.sender_name}</h3>
											<span class="inline-block px-2 py-1 text-xs font-medium rounded-full {getStatusBadgeClass(pitch.status)}">
												{pitch.status}
											</span>
											{#if pitch.ai_score}
												<span class="inline-block px-2 py-1 text-xs font-medium rounded-full {getScoreBadgeClass(pitch.ai_score)}">
													AI Score: {pitch.ai_score}/10
												</span>
											{/if}
										</div>
										
										<div class="text-sm text-gray-600 mb-2">
											<span>{pitch.sender_email}</span>
											<span class="mx-2">•</span>
											<span>{formatDate(pitch.created_at)}</span>
											{#if pitch.duration_seconds}
												<span class="mx-2">•</span>
												<span>{formatDuration(pitch.duration_seconds)}</span>
											{/if}
										</div>
										
										{#if pitch.trust_scores}
											<div class="text-sm text-blue-600 mb-2">
												Trust: {pitch.trust_scores.tier} (score: {pitch.trust_scores.score})
											</div>
										{/if}
										
										{#if pitch.ai_evaluation}
											<div class="text-sm text-gray-700 italic line-clamp-2">
												{pitch.ai_evaluation.substring(0, 200)}...
											</div>
										{/if}
									</div>
									
									<div class="flex items-center gap-2 ml-4">
										{#if pitch.status === 'reviewed' || pitch.status === 'pending'}
											<button
												onclick={() => updatePitchStatus(pitch.id, 'approved')}
												class="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
											>
												Approve
											</button>
											<button
												onclick={() => updatePitchStatus(pitch.id, 'rejected')}
												class="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
											>
												Reject
											</button>
										{/if}
										
										<div class="text-gray-400">
											{expandedPitch === pitch.id ? '▲' : '▼'}
										</div>
									</div>
								</div>
							</div>

							<!-- Expanded Details -->
							{#if expandedPitch === pitch.id}
								<div class="border-t border-gray-200 p-6 bg-gray-50">
									<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
										<!-- Video Player -->
										<div>
											<h4 class="font-semibold text-gray-900 mb-3">Video Pitch</h4>
											{#if pitch.video_url}
												<video
													controls
													class="w-full rounded-lg border border-gray-300"
													style="max-height: 400px;"
												>
													<source src={pitch.video_url} type="video/webm" />
													<source src={pitch.video_url} type="video/mp4" />
													Your browser does not support the video tag.
												</video>
											{:else}
												<div class="bg-gray-200 rounded-lg h-64 flex items-center justify-center text-gray-500">
													Video not available
												</div>
											{/if}
										</div>

										<!-- Details and Transcript -->
										<div class="space-y-4">
											{#if pitch.transcript}
												<div>
													<h4 class="font-semibold text-gray-900 mb-2">Transcript</h4>
													<div class="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-700 max-h-40 overflow-y-auto">
														{pitch.transcript}
													</div>
												</div>
											{/if}

											{#if pitch.ai_evaluation}
												<div>
													<h4 class="font-semibold text-gray-900 mb-2">AI Evaluation</h4>
													<div class="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
														{pitch.ai_evaluation}
													</div>
												</div>
											{/if}

											{#if pitch.metadata?.admin_notes}
												<div>
													<h4 class="font-semibold text-gray-900 mb-2">Admin Notes</h4>
													<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
														{pitch.metadata.admin_notes}
													</div>
												</div>
											{/if}

											<!-- Status Actions -->
											{#if pitch.status !== 'approved' && pitch.status !== 'rejected'}
												<div class="pt-4 border-t border-gray-200">
													<h4 class="font-semibold text-gray-900 mb-3">Actions</h4>
													<div class="flex gap-2">
														<button
															onclick={() => updatePitchStatus(pitch.id, 'approved')}
															class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
														>
															✅ Approve & Qualify Sender
														</button>
														<button
															onclick={() => updatePitchStatus(pitch.id, 'rejected')}
															class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
														>
															❌ Reject
														</button>
													</div>
												</div>
											{/if}
										</div>
									</div>
								</div>
							{/if}
						</div>
					{/each}
				{/if}
			</div>
		{/if}
	</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>