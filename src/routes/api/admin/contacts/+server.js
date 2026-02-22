import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase.js';

export async function GET() {
	const { data: contacts } = await supabase
		.from('contacts')
		.select('*')
		.order('name');

	return json({ contacts: contacts || [] });
}

export async function POST({ request }) {
	const contactData = await request.json();
	
	if (!contactData.name) {
		return json({ error: 'Name is required' }, { status: 400 });
	}

	const { data, error } = await supabase
		.from('contacts')
		.insert({
			name: contactData.name,
			email: contactData.email || null,
			company: contactData.company || null,
			relationship: contactData.relationship || 'unknown',
			notes: contactData.notes || null,
			always_escalate: contactData.always_escalate || false
		})
		.select()
		.single();

	if (error) {
		return json({ error: 'Failed to create contact' }, { status: 500 });
	}

	return json({ contact: data }, { status: 201 });
}

export async function PATCH({ request, url }) {
	const contactData = await request.json();
	const id = url.searchParams.get('id');
	
	if (!id) {
		return json({ error: 'Contact ID is required' }, { status: 400 });
	}

	if (!contactData.name) {
		return json({ error: 'Name is required' }, { status: 400 });
	}

	const { data, error } = await supabase
		.from('contacts')
		.update({
			name: contactData.name,
			email: contactData.email || null,
			company: contactData.company || null,
			relationship: contactData.relationship || 'unknown',
			notes: contactData.notes || null,
			always_escalate: contactData.always_escalate || false
		})
		.eq('id', id)
		.select()
		.single();

	if (error) {
		return json({ error: 'Failed to update contact' }, { status: 500 });
	}

	return json({ contact: data });
}

export async function DELETE({ url }) {
	const id = url.searchParams.get('id');
	
	if (!id) {
		return json({ error: 'Contact ID is required' }, { status: 400 });
	}

	const { error } = await supabase
		.from('contacts')
		.delete()
		.eq('id', id);

	if (error) {
		return json({ error: 'Failed to delete contact' }, { status: 500 });
	}

	return json({ success: true });
}