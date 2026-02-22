/**
 * Sanitize text for use in AI prompts to prevent prompt injection attacks
 */
export function sanitizeForPrompt(text) {
	if (!text || typeof text !== 'string') return '';

	// Limit length to prevent excessively long inputs
	const maxLength = 500;
	let cleaned = text.slice(0, maxLength);

	// Remove potential prompt injection tokens
	cleaned = cleaned.replace(/<\|.*?\|>/g, ''); // Remove <|...|> tokens

	// Remove common prompt injection patterns (case insensitive)
	const injectionPatterns = [
		/ignore\s+previous\s+instructions?/gi,
		/ignore\s+all\s+previous\s+instructions?/gi,
		/forget\s+previous\s+instructions?/gi,
		/disregard\s+previous\s+instructions?/gi,
		/system\s*:/gi,
		/assistant\s*:/gi,
		/user\s*:/gi,
		/human\s*:/gi,
		/ai\s*:/gi,
		/\[system\]/gi,
		/\[assistant\]/gi,
		/\[user\]/gi,
		/\[human\]/gi,
		/\[ai\]/gi,
		/```.*?system.*?```/gis,
		/```.*?assistant.*?```/gis
	];

	for (const pattern of injectionPatterns) {
		cleaned = cleaned.replace(pattern, '');
	}

	// Remove control characters but preserve common whitespace
	cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

	// Remove excessive whitespace
	cleaned = cleaned.replace(/\s+/g, ' ').trim();

	// If the text was heavily modified or is now very short, it might have been an injection attempt
	if (cleaned.length < text.length * 0.5 && text.length > 50) {
		console.warn('Potential prompt injection attempt detected and sanitized:', {
			original_length: text.length,
			cleaned_length: cleaned.length,
			original_preview: text.substring(0, 100)
		});
	}

	return cleaned;
}

/**
 * Basic HTML sanitization for user-rendered content
 */
export function sanitizeHtml(text) {
	if (!text || typeof text !== 'string') return '';

	// HTML encode basic characters
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#x27;')
		.replace(/\//g, '&#x2F;');
}

/**
 * Sanitize user input for storage in database
 */
export function sanitizeInput(text) {
	if (!text || typeof text !== 'string') return '';

	// Trim whitespace
	let cleaned = text.trim();

	// Remove null bytes
	cleaned = cleaned.replace(/\0/g, '');

	// Normalize line endings
	cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

	// Limit to reasonable length for storage
	const maxLength = 2000;
	if (cleaned.length > maxLength) {
		cleaned = cleaned.substring(0, maxLength);
	}

	return cleaned;
}

/**
 * Validate and sanitize email addresses
 */
export function sanitizeEmail(email) {
	if (!email || typeof email !== 'string') return null;

	const cleaned = email.trim().toLowerCase();
	
	// Basic email validation
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(cleaned)) {
		return null;
	}

	// Additional checks for suspicious patterns
	if (cleaned.includes('..') || cleaned.startsWith('.') || cleaned.endsWith('.')) {
		return null;
	}

	return cleaned;
}

/**
 * Sanitize names for display
 */
export function sanitizeName(name) {
	if (!name || typeof name !== 'string') return '';

	// Remove control characters and excessive whitespace
	let cleaned = name.replace(/[\x00-\x1F\x7F]/g, '').replace(/\s+/g, ' ').trim();

	// Limit length
	if (cleaned.length > 100) {
		cleaned = cleaned.substring(0, 100);
	}

	// Remove potentially dangerous characters for display
	cleaned = cleaned.replace(/[<>'"&]/g, '');

	return cleaned;
}