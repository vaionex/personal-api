import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase.js';

export async function GET() {
	const healthCheck = {
		status: 'ok',
		version: '0.1.0',
		uptime: process.uptime()
	};

	// Test Supabase connectivity
	try {
		const { error } = await supabase
			.from('knowledge')
			.select('id')
			.limit(1);
			
		if (error) {
			healthCheck.status = 'degraded';
			healthCheck.supabase = 'error';
			healthCheck.error = error.message;
		} else {
			healthCheck.supabase = 'ok';
		}
	} catch (e) {
		healthCheck.status = 'degraded';
		healthCheck.supabase = 'error';
		healthCheck.error = e.message;
	}

	const statusCode = healthCheck.status === 'ok' ? 200 : 503;
	
	return json(healthCheck, { status: statusCode });
}