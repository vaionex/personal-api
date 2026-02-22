import { supabase } from './supabase.js';

/**
 * Create a proof event with anonymized data
 */
export async function createProofEvent({ eventType, senderName, company, topic, meetingType }) {
	if (!eventType) {
		console.error('createProofEvent: eventType is required');
		return;
	}

	// Anonymize the sender info
	const anonymizedCompany = anonymizeCompany(company, senderName);
	const displayText = generateDisplayText(eventType, anonymizedCompany, topic, meetingType);

	const { error } = await supabase
		.from('proof_events')
		.insert({
			event_type: eventType,
			display_text: displayText,
			company: anonymizedCompany,
			topic: topic || null,
			meeting_type: meetingType || null
		});

	if (error) {
		console.error('Failed to create proof event:', error);
	}
}

/**
 * Get recent proof events for the public feed
 */
export async function getRecentProofEvents(limit = 10) {
	const { data, error } = await supabase
		.from('proof_events')
		.select('*')
		.order('created_at', { ascending: false })
		.limit(limit);

	if (error) {
		console.error('Failed to fetch proof events:', error);
		return [];
	}

	return data || [];
}

/**
 * Get aggregated stats for proof events
 */
export async function getProofStats() {
	// Get stats for the current week
	const oneWeekAgo = new Date();
	oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

	const { data: weekData, error: weekError } = await supabase
		.from('proof_events')
		.select('event_type')
		.gte('created_at', oneWeekAgo.toISOString());

	if (weekError) {
		console.error('Failed to fetch weekly stats:', weekError);
		return {
			totalQualified: 0,
			totalMeetings: 0,
			totalInteractions: 0
		};
	}

	const weekEvents = weekData || [];
	
	return {
		totalQualified: weekEvents.filter(e => e.event_type === 'qualified').length,
		totalMeetings: weekEvents.filter(e => ['booked', 'completed'].includes(e.event_type)).length,
		totalInteractions: weekEvents.length
	};
}

/**
 * Anonymize company information
 */
function anonymizeCompany(company, senderName) {
	if (!company && !senderName) return 'someone';

	// If we have a company name, anonymize it
	if (company) {
		const lower = company.toLowerCase();
		if (lower.includes('startup') || lower.includes('inc') || lower.includes('llc')) {
			return 'a tech startup';
		}
		if (lower.includes('fortune') || lower.includes('enterprise') || company.length > 20) {
			return 'a Fortune 500';
		}
		if (lower.includes('agency') || lower.includes('consulting')) {
			return 'a consulting firm';
		}
		if (lower.includes('university') || lower.includes('college')) {
			return 'a university';
		}
		return 'a company';
	}

	// Fall back to generic descriptions
	return 'someone';
}

/**
 * Generate display text for different event types
 */
function generateDisplayText(eventType, company, topic, meetingType) {
	const companyDesc = company || 'someone';
	
	switch (eventType) {
		case 'qualified':
			if (topic && meetingType) {
				return `${capitalize(companyDesc)} qualified for ${topic} via ${meetingType}`;
			}
			if (topic) {
				return `${capitalize(companyDesc)} qualified for a ${topic} discussion`;
			}
			if (meetingType) {
				return `${capitalize(companyDesc)} qualified for a ${meetingType}`;
			}
			return `${capitalize(companyDesc)} qualified for a consultation`;

		case 'booked':
			if (meetingType) {
				return `Someone just booked a ${meetingType}`;
			}
			return 'Someone just booked a meeting';

		case 'completed':
			if (meetingType) {
				return `A ${meetingType} was completed with ${companyDesc}`;
			}
			return `A meeting was completed with ${companyDesc}`;

		case 'referred':
			return 'A new referral just arrived via a trusted contact';

		default:
			return `${capitalize(companyDesc)} had an interaction`;
	}
}

/**
 * Capitalize first letter of a string
 */
function capitalize(str) {
	if (!str) return str;
	return str.charAt(0).toUpperCase() + str.slice(1);
}

// TODO: integrate createProofEvent() calls in:
// - /api/ask — when someone qualifies (only qualification events, not every interaction)
// - /api/schedule/book — when a booking is confirmed
// - Where booking completion happens — when a meeting is completed
// - Where referrals are used — when a referral is redeemed