import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit } from '../src/lib/server/ratelimit.js';

describe('Rate Limit System', () => {
	const testIP = '192.168.1.100';
	const otherIP = '192.168.1.101';

	beforeEach(() => {
		// Clear any existing rate limit data by using different IPs for each test
		// Note: The rate limiter uses an in-memory Map, so we can't directly clear it
		// We'll use unique IPs or wait for cleanup
	});

	it('should allow first request', () => {
		const result = checkRateLimit(`${testIP}-1`);
		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(19); // REQUESTS_PER_MINUTE - 1
	});

	it('should allow requests under the limit', () => {
		const ip = `${testIP}-2`;
		
		// Make first request
		let result = checkRateLimit(ip);
		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(19);
		
		// Make second request
		result = checkRateLimit(ip);
		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(18);
		
		// Make third request
		result = checkRateLimit(ip);
		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(17);
	});

	it('should block requests over the limit', () => {
		const ip = `${testIP}-3`;
		
		// Make 20 requests (the limit)
		for (let i = 0; i < 20; i++) {
			const result = checkRateLimit(ip);
			expect(result.allowed).toBe(true);
		}
		
		// 21st request should be blocked
		const result = checkRateLimit(ip);
		expect(result.allowed).toBe(false);
		expect(result.remaining).toBe(0);
		expect(result.resetAt).toBeDefined();
	});

	it('should track different IPs separately', () => {
		const ip1 = `${testIP}-4`;
		const ip2 = `${testIP}-5`;
		
		// Make requests from first IP
		let result1 = checkRateLimit(ip1);
		expect(result1.allowed).toBe(true);
		expect(result1.remaining).toBe(19);
		
		// Make requests from second IP - should start fresh
		let result2 = checkRateLimit(ip2);
		expect(result2.allowed).toBe(true);
		expect(result2.remaining).toBe(19);
		
		// Make another request from first IP
		result1 = checkRateLimit(ip1);
		expect(result1.allowed).toBe(true);
		expect(result1.remaining).toBe(18);
	});
});