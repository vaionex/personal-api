import { describe, it, expect } from 'vitest';
import { matchTopic } from '../src/lib/server/routing.js';

describe('Routing System', () => {
	describe('matchTopic()', () => {
		const mockRoutes = [
			{
				id: 1,
				name: 'Technical Support',
				keywords: ['technical', 'API', 'bug', 'error', 'help'],
				priority: 2,
				event_type_slug: 'technical'
			},
			{
				id: 2,
				name: 'Business Discussion',
				keywords: ['business', 'partnership', 'collaboration'],
				priority: 1,
				event_type_slug: 'business'
			},
			{
				id: 3,
				name: 'General Chat',
				keywords: ['chat', 'talk', 'discuss'],
				priority: 0,
				event_type_slug: 'general'
			}
		];

		it('should match keyword correctly', () => {
			const result = matchTopic('I need technical help with my API', mockRoutes);
			expect(result).toBeDefined();
			expect(result.name).toBe('Technical Support');
			expect(result.event_type_slug).toBe('technical');
		});

		it('should return null for no match', () => {
			const result = matchTopic('This is completely unrelated content', mockRoutes);
			expect(result).toBeNull();
		});

		it('should prioritize higher priority routes', () => {
			// Both routes might match "technical" and "business" words
			const result = matchTopic('I need technical business help', mockRoutes);
			// Should match technical support due to higher priority (2 > 1)
			expect(result.name).toBe('Technical Support');
		});

		it('should handle case insensitive matching', () => {
			const result = matchTopic('I NEED TECHNICAL HELP', mockRoutes);
			expect(result).toBeDefined();
			expect(result.name).toBe('Technical Support');
		});

		it('should handle empty or null text', () => {
			expect(matchTopic('', mockRoutes)).toBeNull();
			expect(matchTopic(null, mockRoutes)).toBeNull();
			expect(matchTopic(undefined, mockRoutes)).toBeNull();
		});

		it('should handle empty routes array', () => {
			const result = matchTopic('I need help', []);
			expect(result).toBeNull();
		});

		it('should handle routes with invalid keywords', () => {
			const invalidRoutes = [
				{
					id: 1,
					name: 'Invalid Route',
					keywords: null,
					priority: 1,
					event_type_slug: 'invalid'
				},
				{
					id: 2,
					name: 'Valid Route',
					keywords: ['help'],
					priority: 1,
					event_type_slug: 'valid'
				}
			];

			const result = matchTopic('I need help', invalidRoutes);
			expect(result).toBeDefined();
			expect(result.name).toBe('Valid Route');
		});

		it('should weight longer keywords more heavily', () => {
			const routes = [
				{
					id: 1,
					name: 'Short Keyword',
					keywords: ['API'],
					priority: 1,
					event_type_slug: 'short'
				},
				{
					id: 2,
					name: 'Long Keyword',
					keywords: ['technical support'],
					priority: 1,
					event_type_slug: 'long'
				}
			];

			const result = matchTopic('I need technical support with API', routes);
			// "technical support" is longer than "API", so it should win
			expect(result.name).toBe('Long Keyword');
		});
	});
});