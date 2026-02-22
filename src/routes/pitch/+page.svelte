<script>
	let { data } = $props();
	
	let videoRef = $state(null);
	let recordedVideo = $state(null);
	let mediaRecorder = $state(null);
	let recordedChunks = $state([]);
	let isRecording = $state(false);
	let isPreview = $state(false);
	let stream = $state(null);
	let countdown = $state(0);
	let recordingTime = $state(0);
	let recordingInterval = $state(null);
	
	// Form data
	let senderName = $state('');
	let senderEmail = $state('');
	let isSubmitting = $state(false);
	let submissionStatus = $state('');
	let error = $state('');
	
	const MAX_RECORDING_TIME = 60; // 60 seconds
	
	async function startCamera() {
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				video: { width: 640, height: 480 },
				audio: true
			});
			if (videoRef) {
				videoRef.srcObject = stream;
			}
		} catch (err) {
			error = 'Camera access denied. Please allow camera permissions and refresh the page.';
			console.error('Camera error:', err);
		}
	}
	
	async function startRecording() {
		if (!stream) {
			await startCamera();
			if (!stream) return;
		}
		
		recordedChunks = [];
		
		mediaRecorder = new MediaRecorder(stream, {
			mimeType: 'video/webm;codecs=vp9'
		});
		
		mediaRecorder.ondataavailable = (event) => {
			if (event.data.size > 0) {
				recordedChunks = [...recordedChunks, event.data];
			}
		};
		
		mediaRecorder.onstop = () => {
			const blob = new Blob(recordedChunks, { type: 'video/webm' });
			const url = URL.createObjectURL(blob);
			recordedVideo = { blob, url };
			isPreview = true;
			
			// Stop camera stream
			if (stream) {
				stream.getTracks().forEach(track => track.stop());
				stream = null;
			}
		};
		
		// Countdown before recording starts
		countdown = 3;
		const countdownInterval = setInterval(() => {
			countdown--;
			if (countdown === 0) {
				clearInterval(countdownInterval);
				// Start actual recording
				mediaRecorder.start();
				isRecording = true;
				recordingTime = 0;
				
				// Update recording timer
				recordingInterval = setInterval(() => {
					recordingTime++;
					if (recordingTime >= MAX_RECORDING_TIME) {
						stopRecording();
					}
				}, 1000);
			}
		}, 1000);
	}
	
	function stopRecording() {
		if (mediaRecorder && mediaRecorder.state === 'recording') {
			mediaRecorder.stop();
		}
		isRecording = false;
		if (recordingInterval) {
			clearInterval(recordingInterval);
			recordingInterval = null;
		}
	}
	
	function resetRecording() {
		if (recordedVideo) {
			URL.revokeObjectURL(recordedVideo.url);
			recordedVideo = null;
		}
		isPreview = false;
		recordingTime = 0;
		startCamera();
	}
	
	async function submitPitch() {
		if (!recordedVideo || !senderName || !senderEmail) {
			error = 'Please complete all fields and record a video.';
			return;
		}
		
		isSubmitting = true;
		error = '';
		submissionStatus = 'Uploading your pitch...';
		
		try {
			// Create form data
			const formData = new FormData();
			formData.append('video', recordedVideo.blob, 'pitch.webm');
			formData.append('sender_name', senderName);
			formData.append('sender_email', senderEmail);
			if (data.conversationId) {
				formData.append('conversation_id', data.conversationId);
			}
			
			// Upload video
			const uploadResponse = await fetch('/api/pitch/upload', {
				method: 'POST',
				body: formData
			});
			
			const uploadResult = await uploadResponse.json();
			
			if (!uploadResponse.ok) {
				throw new Error(uploadResult.error || 'Upload failed');
			}
			
			submissionStatus = 'Analyzing your pitch...';
			
			// Start transcription/evaluation
			const transcribeResponse = await fetch('/api/pitch/transcribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ pitch_id: uploadResult.pitch_id })
			});
			
			const transcribeResult = await transcribeResponse.json();
			
			if (!transcribeResponse.ok) {
				throw new Error(transcribeResult.error || 'Analysis failed');
			}
			
			// Show result
			if (transcribeResult.status === 'approved') {
				submissionStatus = '✅ Great pitch! You\'ve been qualified for a meeting. You should hear back soon.';
			} else if (transcribeResult.status === 'reviewed') {
				submissionStatus = '📋 Thanks for your pitch! It\'s being reviewed and you\'ll hear back within 24 hours.';
			} else {
				submissionStatus = '🤔 Thanks for your pitch. While it didn\'t meet the current criteria, you\'re welcome to try reaching out via the chat for specific questions.';
			}
			
		} catch (err) {
			error = err.message;
			submissionStatus = '';
		} finally {
			isSubmitting = false;
		}
	}
	
	$effect(() => {
		startCamera();
		
		// Cleanup on component destroy
		return () => {
			if (stream) {
				stream.getTracks().forEach(track => track.stop());
			}
			if (recordingInterval) {
				clearInterval(recordingInterval);
			}
			if (recordedVideo) {
				URL.revokeObjectURL(recordedVideo.url);
			}
		};
	});
</script>

<svelte:head>
	<title>Record a Pitch — {data.ownerName}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
	<div class="max-w-2xl w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
		<!-- Header -->
		<div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
			<h1 class="text-2xl font-bold">Record a 60-Second Pitch</h1>
			<p class="text-blue-100 mt-2">for {data.ownerName}</p>
		</div>
		
		{#if submissionStatus}
			<!-- Success/Status Screen -->
			<div class="p-8 text-center">
				<div class="text-4xl mb-4">
					{#if submissionStatus.includes('✅')}
						🎉
					{:else if submissionStatus.includes('📋')}
						⏳
					{:else}
						📝
					{/if}
				</div>
				<p class="text-lg text-gray-700 leading-relaxed">{submissionStatus}</p>
				<div class="mt-6">
					<a href="/" class="text-blue-600 hover:text-blue-700 font-medium">
						← Back to main chat
					</a>
				</div>
			</div>
		{:else}
			<!-- Recording Interface -->
			<div class="p-6">
				{#if error}
					<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
						{error}
					</div>
				{/if}
				
				<!-- Video Area -->
				<div class="bg-gray-900 rounded-lg overflow-hidden mb-6 relative">
					{#if isPreview && recordedVideo}
						<video
							src={recordedVideo.url}
							controls
							class="w-full h-80 object-cover"
						/>
					{:else}
						<video
							bind:this={videoRef}
							autoplay
							muted
							playsinline
							class="w-full h-80 object-cover {isRecording ? 'ring-4 ring-red-500' : ''}"
						/>
					{/if}
					
					<!-- Recording UI Overlays -->
					{#if countdown > 0}
						<div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
							<div class="text-white text-6xl font-bold">{countdown}</div>
						</div>
					{/if}
					
					{#if isRecording}
						<div class="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
							<div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
							Recording: {recordingTime}s / {MAX_RECORDING_TIME}s
						</div>
					{/if}
				</div>
				
				<!-- Controls -->
				<div class="flex justify-center gap-3 mb-6">
					{#if !isPreview}
						{#if !isRecording && countdown === 0}
							<button
								onclick={startRecording}
								class="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
							>
								<div class="w-4 h-4 bg-white rounded-full"></div>
								Start Recording
							</button>
						{:else if isRecording}
							<button
								onclick={stopRecording}
								class="bg-gray-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors"
							>
								Stop Recording
							</button>
						{/if}
					{:else}
						<button
							onclick={resetRecording}
							class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
						>
							Re-record
						</button>
					{/if}
				</div>
				
				{#if isPreview}
					<!-- Form -->
					<div class="space-y-4 mb-6">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
							<input
								bind:value={senderName}
								type="text"
								placeholder="Full name"
								class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								disabled={isSubmitting}
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
							<input
								bind:value={senderEmail}
								type="email"
								placeholder="your@email.com"
								class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								disabled={isSubmitting}
							/>
						</div>
					</div>
					
					<!-- Submit -->
					<button
						onclick={submitPitch}
						disabled={isSubmitting || !senderName || !senderEmail}
						class="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
					>
						{isSubmitting ? 'Submitting...' : 'Submit Pitch'}
					</button>
				{:else}
					<!-- Instructions -->
					<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
						<h3 class="font-medium mb-2">Tips for a great pitch:</h3>
						<ul class="space-y-1 text-blue-600">
							<li>• Be specific about what you want to discuss</li>
							<li>• Explain why it's relevant to {data.ownerName}'s work</li>
							<li>• Show you've done your homework</li>
							<li>• Keep it under 60 seconds</li>
							<li>• Speak clearly and look at the camera</li>
						</ul>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>