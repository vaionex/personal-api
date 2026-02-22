import { describe, it, expect } from 'vitest';
import { getTier } from '../src/lib/server/trust.js';

describe('Trust System', () => {
	describe('getTier()', () => {
		it('should return "new" for score 0', () => {
			expect(getTier(0)).toBe('new');
		});

		it('should return "known" for score 15', () => {
			expect(getTier(15)).toBe('known');
		});

		it('should return "trusted" for score 40', () => {
			expect(getTier(40)).toBe('trusted');
		});

		it('should return "vip" for score 70', () => {
			expect(getTier(70)).toBe('vip');
		});

		// Test boundary values
		it('should return "new" for score 10 (boundary)', () => {
			expect(getTier(10)).toBe('new');
		});

		it('should return "known" for score 11 (boundary)', () => {
			expect(getTier(11)).toBe('known');
		});

		it('should return "known" for score 30 (boundary)', () => {
			expect(getTier(30)).toBe('known');
		});

		it('should return "trusted" for score 31 (boundary)', () => {
			expect(getTier(31)).toBe('trusted');
		});

		it('should return "trusted" for score 60 (boundary)', () => {
			expect(getTier(60)).toBe('trusted');
		});

		it('should return "vip" for score 61 (boundary)', () => {
			expect(getTier(61)).toBe('vip');
		});
	});
});