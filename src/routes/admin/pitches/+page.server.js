import { redirect } from '@sveltejs/kit';
import { ADMIN_PASSWORD } from '$env/static/private';

export async function load({ cookies }) {
	const session = cookies.get('admin-session');
	if (session !== ADMIN_PASSWORD) {
		throw redirect(302, '/admin/login');
	}
	
	return {};
}