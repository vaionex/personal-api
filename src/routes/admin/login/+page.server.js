import { fail, redirect } from '@sveltejs/kit';
import { ADMIN_PASSWORD } from '$env/static/private';
import { createHash } from 'crypto';

function hashPassword(password) {
	return createHash('sha256').update(password).digest('hex');
}

export const actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const password = data.get('password');

		if (!ADMIN_PASSWORD) {
			return fail(400, { error: 'Admin password not configured' });
		}

		if (!password || password !== ADMIN_PASSWORD) {
			return fail(400, { error: 'Invalid password' });
		}

		// Set secure cookie
		const hashedPassword = hashPassword(ADMIN_PASSWORD);
		cookies.set('papi_admin', hashedPassword, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 7 // 7 days
		});

		throw redirect(302, '/admin');
	}
};