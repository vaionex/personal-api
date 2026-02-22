// Simple in-memory rate limiter
// Map<IP, { count: number, resetAt: number }>
const ipLimits = new Map();

const REQUESTS_PER_MINUTE = 20;
const WINDOW_MS = 60 * 1000; // 1 minute

export function checkRateLimit(ip) {
	const now = Date.now();
	const limit = ipLimits.get(ip);

	// If no previous requests or window expired, reset
	if (!limit || now > limit.resetAt) {
		ipLimits.set(ip, {
			count: 1,
			resetAt: now + WINDOW_MS
		});
		return { allowed: true, remaining: REQUESTS_PER_MINUTE - 1 };
	}

	// If within window, check if limit exceeded
	if (limit.count >= REQUESTS_PER_MINUTE) {
		return { 
			allowed: false, 
			remaining: 0,
			resetAt: limit.resetAt
		};
	}

	// Increment count
	limit.count++;
	ipLimits.set(ip, limit);

	return { 
		allowed: true, 
		remaining: REQUESTS_PER_MINUTE - limit.count 
	};
}

// Clean up old entries periodically
setInterval(() => {
	const now = Date.now();
	for (const [ip, limit] of ipLimits.entries()) {
		if (now > limit.resetAt) {
			ipLimits.delete(ip);
		}
	}
}, 5 * 60 * 1000); // cleanup every 5 minutes