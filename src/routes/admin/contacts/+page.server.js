import { supabase } from '$lib/server/supabase.js';
import { fail } from '@sveltejs/kit';

export async function load() {
	const { data: contacts } = await supabase
		.from('contacts')
		.select('*')
		.order('name');

	return {
		contacts: contacts || []
	};
}

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		
		const contactData = {
			name: data.get('name'),
			email: data.get('email') || null,
			company: data.get('company') || null,
			relationship: data.get('relationship') || 'unknown',
			notes: data.get('notes') || null,
			always_escalate: data.get('always_escalate') === 'on'
		};

		if (!contactData.name) {
			return fail(400, { error: 'Name is required' });
		}

		const { error } = await supabase
			.from('contacts')
			.insert(contactData);

		if (error) {
			console.error('Failed to create contact:', error);
			return fail(500, { error: 'Failed to create contact' });
		}

		// Return updated contacts list
		const { data: contacts } = await supabase
			.from('contacts')
			.select('*')
			.order('name');

		return { success: true, contacts };
	},

	update: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id');
		
		const contactData = {
			name: data.get('name'),
			email: data.get('email') || null,
			company: data.get('company') || null,
			relationship: data.get('relationship') || 'unknown',
			notes: data.get('notes') || null,
			always_escalate: data.get('always_escalate') === 'on'
		};

		if (!contactData.name) {
			return fail(400, { error: 'Name is required' });
		}

		const { error } = await supabase
			.from('contacts')
			.update(contactData)
			.eq('id', id);

		if (error) {
			console.error('Failed to update contact:', error);
			return fail(500, { error: 'Failed to update contact' });
		}

		// Return updated contacts list
		const { data: contacts } = await supabase
			.from('contacts')
			.select('*')
			.order('name');

		return { success: true, contacts };
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id');

		const { error } = await supabase
			.from('contacts')
			.delete()
			.eq('id', id);

		if (error) {
			console.error('Failed to delete contact:', error);
			return fail(500, { error: 'Failed to delete contact' });
		}

		// Return updated contacts list
		const { data: contacts } = await supabase
			.from('contacts')
			.select('*')
			.order('name');

		return { success: true, contacts };
	}
};