import { redirect } from '@sveltejs/kit';
import { ADMIN_PASSWORD } from '$env/static/private';
import { createHash } from 'crypto';

function hashPassword(password) {
	return createHash('sha256').update(password).digest('hex');
}

export async function load({ cookies, url }) {
	// If no admin password is set, allow access
	if (!ADMIN_PASSWORD) {
		return {};
	}

	// Check if user is authenticated
	const adminCookie = cookies.get('papi_admin');
	const expectedHash = hashPassword(ADMIN_PASSWORD);
	
	// If not authenticated and not on login page, redirect to login
	if (adminCookie !== expectedHash && !url.pathname.includes('/admin/login')) {
		throw redirect(302, '/admin/login');
	}
	
	// If authenticated and on login page, redirect to admin
	if (adminCookie === expectedHash && url.pathname.includes('/admin/login')) {
		throw redirect(302, '/admin');
	}

	return {};
}