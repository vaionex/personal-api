import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase.js';
import { ADMIN_PASSWORD } from '$env/static/private';

function requireAuth(request) {
	const auth = request.headers.get('authorization');
	if (!auth || auth !== `Bearer ${ADMIN_PASSWORD}`) {
		throw new Error('Unauthorized');
	}
}

export async function GET({ request }) {
	try {
		requireAuth(request);

		// Calculate date ranges
		const now = new Date();
		const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		const weekAgoISO = weekAgo.toISOString();
		
		// Get interactions stats
		const { data: interactions, error: interactionsError } = await supabase
			.from('interactions')
			.select('*')
			.order('created_at', { ascending: false });

		if (interactionsError) {
			console.error('Error fetching interactions:', interactionsError);
		}

		const allInteractions = interactions || [];
		const totalConversations = allInteractions.length;
		const qualifiedInteractions = allInteractions.filter(i => i.metadata?.qualified === true);
		const qualificationRate = totalConversations > 0 ? 
			Math.round((qualifiedInteractions.length / totalConversations) * 100) : 0;

		// Get meetings this week
		const { data: bookings, error: bookingsError } = await supabase
			.from('bookings')
			.select('*')
			.gte('start_time', weekAgoISO)
			.eq('status', 'confirmed');

		if (bookingsError) {
			console.error('Error fetching bookings:', bookingsError);
		}

		const meetingsThisWeek = (bookings || []).length;

		// Get pending reviews (pending interactions + pending pitches)
		const pendingInteractions = allInteractions.filter(i => i.status === 'pending');
		
		const { data: pendingPitches, error: pitchesError } = await supabase
			.from('video_pitches')
			.select('*')
			.eq('status', 'pending');

		if (pitchesError) {
			console.error('Error fetching pitches:', pitchesError);
		}

		const pendingReviews = pendingInteractions.length + (pendingPitches || []).length;

		// Get trust distribution
		const { data: trustScores, error: trustError } = await supabase
			.from('trust_scores')
			.select('tier');

		if (trustError) {
			console.error('Error fetching trust scores:', trustError);
		}

		const trustDistribution = {
			new: 0,
			known: 0,
			trusted: 0,
			vip: 0
		};

		(trustScores || []).forEach(ts => {
			if (trustDistribution.hasOwnProperty(ts.tier)) {
				trustDistribution[ts.tier]++;
			}
		});

		// Get recent activity (last 5 interactions)
		const recentActivity = allInteractions.slice(0, 5).map(interaction => ({
			id: interaction.id,
			sender: interaction.sender_name || 'Unknown',
			query: interaction.query ? 
				(interaction.query.length > 60 ? interaction.query.substring(0, 60) + '...' : interaction.query) : 
				'No query',
			classification: interaction.classification,
			status: interaction.status,
			qualified: interaction.metadata?.qualified || false,
			created_at: interaction.created_at
		}));

		// Get upcoming meetings (next 3)
		const { data: upcomingBookings, error: upcomingError } = await supabase
			.from('bookings')
			.select(`
				id,
				guest_name,
				start_time,
				event_types(name)
			`)
			.gte('start_time', now.toISOString())
			.eq('status', 'confirmed')
			.order('start_time', { ascending: true })
			.limit(3);

		if (upcomingError) {
			console.error('Error fetching upcoming bookings:', upcomingError);
		}

		const upcomingMeetings = (upcomingBookings || []).map(booking => ({
			id: booking.id,
			guestName: booking.guest_name,
			eventType: booking.event_types?.name || 'Meeting',
			startTime: booking.start_time
		}));

		return json({
			stats: {
				totalConversations,
				qualificationRate,
				meetingsThisWeek,
				pendingReviews
			},
			trustDistribution,
			recentActivity,
			upcomingMeetings
		});

	} catch (error) {
		console.error('Admin overview API error:', error);
		if (error.message === 'Unauthorized') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}