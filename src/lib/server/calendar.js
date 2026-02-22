import { google } from 'googleapis';
import { supabase } from './supabase.js';
import {
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	GOOGLE_REFRESH_TOKEN,
	GOOGLE_CALENDAR_ID,
} from '$env/static/private';
import { PUBLIC_APP_URL, PUBLIC_OWNER_NAME } from '$env/static/public';

// ---------------------------------------------------------------------------
// Google Calendar OAuth2 client
// ---------------------------------------------------------------------------
function getAuth() {
	if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) return null;
	const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
	auth.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
	return auth;
}

function getCalendar() {
	const auth = getAuth();
	if (!auth) return null;
	return google.calendar({ version: 'v3', auth });
}

const calendarId = () => GOOGLE_CALENDAR_ID || 'primary';

// ---------------------------------------------------------------------------
// Availability rules (from Supabase `scheduling_rules` table)
// ---------------------------------------------------------------------------
export async function getSchedulingRules() {
	const { data } = await supabase
		.from('scheduling_rules')
		.select('*')
		.order('day_of_week');
	return data || [];
}

export async function getEventTypes() {
	const { data } = await supabase
		.from('event_types')
		.select('*')
		.eq('active', true)
		.order('duration_minutes');
	return data || [];
}

export async function getEventType(slug) {
	const { data } = await supabase
		.from('event_types')
		.select('*')
		.eq('slug', slug)
		.eq('active', true)
		.single();
	return data;
}

// ---------------------------------------------------------------------------
// Fetch busy times from Google Calendar
// ---------------------------------------------------------------------------
export async function getBusyTimes(startDate, endDate) {
	const cal = getCalendar();
	if (!cal) return [];

	try {
		const res = await cal.freebusy.query({
			requestBody: {
				timeMin: startDate.toISOString(),
				timeMax: endDate.toISOString(),
				items: [{ id: calendarId() }],
			},
		});
		return res.data.calendars?.[calendarId()]?.busy || [];
	} catch (err) {
		console.error('Google Calendar freebusy error:', err.message);
		return [];
	}
}

// ---------------------------------------------------------------------------
// Get booked slots from Supabase (in case Google is not connected)
// ---------------------------------------------------------------------------
async function getBookedSlots(startDate, endDate) {
	const { data } = await supabase
		.from('bookings')
		.select('start_time, end_time')
		.gte('start_time', startDate.toISOString())
		.lte('start_time', endDate.toISOString())
		.neq('status', 'cancelled');
	return data || [];
}

// ---------------------------------------------------------------------------
// Compute available slots for a given date range + event type
// ---------------------------------------------------------------------------
export async function getAvailableSlots(eventTypeSlug, startDate, endDate) {
	const eventType = await getEventType(eventTypeSlug);
	if (!eventType) return { error: 'Event type not found', slots: [] };

	const rules = await getSchedulingRules();
	if (!rules.length) return { error: 'No scheduling rules configured', slots: [] };

	const [busyTimes, bookedSlots] = await Promise.all([
		getBusyTimes(startDate, endDate),
		getBookedSlots(startDate, endDate),
	]);

	// Merge Google busy times and booked slots
	const allBusy = [
		...busyTimes.map(b => ({ start: new Date(b.start), end: new Date(b.end) })),
		...bookedSlots.map(b => ({ start: new Date(b.start_time), end: new Date(b.end_time) })),
	];

	const slots = [];
	const duration = eventType.duration_minutes;
	const buffer = eventType.buffer_minutes || 0;
	const slotStep = 15; // 15-min increments

	// Iterate each day
	const current = new Date(startDate);
	while (current < endDate) {
		const dayOfWeek = current.getDay(); // 0=Sun, 6=Sat
		const dayRules = rules.filter(r => r.day_of_week === dayOfWeek && r.available);

		for (const rule of dayRules) {
			const [startH, startM] = rule.start_time.split(':').map(Number);
			const [endH, endM] = rule.end_time.split(':').map(Number);

			let slotStart = new Date(current);
			slotStart.setHours(startH, startM, 0, 0);

			const windowEnd = new Date(current);
			windowEnd.setHours(endH, endM, 0, 0);

			while (slotStart.getTime() + duration * 60000 <= windowEnd.getTime()) {
				const slotEnd = new Date(slotStart.getTime() + duration * 60000);
				const slotWithBuffer = new Date(slotEnd.getTime() + buffer * 60000);

				// Check if slot is in the future (at least 2 hours from now)
				const minBookAhead = new Date(Date.now() + 2 * 3600000);
				if (slotStart > minBookAhead) {
					// Check conflicts
					const hasConflict = allBusy.some(b =>
						slotStart < b.end && slotWithBuffer > b.start
					);

					if (!hasConflict) {
						slots.push({
							start: slotStart.toISOString(),
							end: slotEnd.toISOString(),
							date: slotStart.toISOString().split('T')[0],
							time: slotStart.toTimeString().slice(0, 5),
						});
					}
				}

				slotStart = new Date(slotStart.getTime() + slotStep * 60000);
			}
		}

		current.setDate(current.getDate() + 1);
	}

	return { eventType, slots };
}

// ---------------------------------------------------------------------------
// Book a slot
// ---------------------------------------------------------------------------
export async function bookSlot({ eventTypeSlug, startTime, name, email, notes, timezone }) {
	const eventType = await getEventType(eventTypeSlug);
	if (!eventType) return { error: 'Event type not found' };

	const start = new Date(startTime);
	const end = new Date(start.getTime() + eventType.duration_minutes * 60000);
	const owner = PUBLIC_OWNER_NAME || 'Owner';

	// Double-check availability
	const busyCheck = await getBusyTimes(start, end);
	const bookedCheck = await getBookedSlots(start, end);
	const allBusy = [
		...busyCheck.map(b => ({ start: new Date(b.start), end: new Date(b.end) })),
		...bookedCheck.map(b => ({ start: new Date(b.start_time), end: new Date(b.end_time) })),
	];
	const hasConflict = allBusy.some(b => start < b.end && end > b.start);
	if (hasConflict) return { error: 'This slot is no longer available' };

	// Create Google Calendar event if connected
	let googleEventId = null;
	const cal = getCalendar();
	if (cal) {
		try {
			const res = await cal.events.insert({
				calendarId: calendarId(),
				requestBody: {
					summary: `${eventType.name} — ${name}`,
					description: `Booked via Personal API\n\nName: ${name}\nEmail: ${email}${notes ? `\nNotes: ${notes}` : ''}`,
					start: { dateTime: start.toISOString(), timeZone: timezone || 'UTC' },
					end: { dateTime: end.toISOString(), timeZone: timezone || 'UTC' },
					attendees: [{ email }],
					reminders: { useDefault: true },
				},
				sendUpdates: 'all',
			});
			googleEventId = res.data.id;
		} catch (err) {
			console.error('Failed to create Google Calendar event:', err.message);
		}
	}

	// Store in Supabase
	const { data, error } = await supabase
		.from('bookings')
		.insert({
			event_type_id: eventType.id,
			start_time: start.toISOString(),
			end_time: end.toISOString(),
			guest_name: name,
			guest_email: email,
			guest_notes: notes || null,
			guest_timezone: timezone || 'UTC',
			google_event_id: googleEventId,
			status: 'confirmed',
		})
		.select()
		.single();

	if (error) return { error: error.message };

	return {
		booking: data,
		event: eventType,
		message: `Booked! ${eventType.name} with ${owner} on ${start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.`,
	};
}

// ---------------------------------------------------------------------------
// Cancel a booking
// ---------------------------------------------------------------------------
export async function cancelBooking(bookingId) {
	const { data: booking } = await supabase
		.from('bookings')
		.select('*')
		.eq('id', bookingId)
		.single();

	if (!booking) return { error: 'Booking not found' };

	// Cancel Google Calendar event
	if (booking.google_event_id) {
		const cal = getCalendar();
		if (cal) {
			try {
				await cal.events.delete({
					calendarId: calendarId(),
					eventId: booking.google_event_id,
					sendUpdates: 'all',
				});
			} catch (err) {
				console.error('Failed to cancel Google event:', err.message);
			}
		}
	}

	await supabase
		.from('bookings')
		.update({ status: 'cancelled' })
		.eq('id', bookingId);

	return { ok: true };
}

// ---------------------------------------------------------------------------
// Check if Google Calendar is connected
// ---------------------------------------------------------------------------
export function isCalendarConnected() {
	return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REFRESH_TOKEN);
}
