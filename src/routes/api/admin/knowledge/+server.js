import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase.js';
import { sanitizeForPrompt, sanitizeInput } from '$lib/server/sanitize.js';

export async function GET({ url }) {
	const format = url.searchParams.get('format');
	
	if (format === 'json') {
		// Export all knowledge as JSON
		const { data: knowledge } = await supabase
			.from('knowledge')
			.select('*')
			.order('category, key');
			
		return json(knowledge || []);
	}
	
	return json({ error: 'Invalid format' }, { status: 400 });
}

export async function POST({ request }) {
	const contentType = request.headers.get('content-type');
	
	if (contentType === 'application/json') {
		const body = await request.json();
		
		// Check if this is a bulk import (array of knowledge items)
		if (Array.isArray(body)) {
			// Bulk import
			const knowledgeItems = body.map(item => ({
				category: item.category || 'bio',
				key: sanitizeInput(item.key),
				value: sanitizeForPrompt(item.value),
				context: item.context ? sanitizeForPrompt(item.context) : null,
				priority: item.priority || 0
			})).filter(item => item.key && item.value); // Only valid items

			if (knowledgeItems.length === 0) {
				return json({ error: 'No valid knowledge items found' }, { status: 400 });
			}

			const { data, error } = await supabase
				.from('knowledge')
				.insert(knowledgeItems)
				.select();
				
			if (error) return json({ error: error.message }, { status: 500 });
			return json({ imported: data.length, items: data });
		} else {
			// Single item creation
			const { category, key, value, context } = body;
			const { data, error } = await supabase
				.from('knowledge')
				.insert({ 
					category, 
					key: sanitizeInput(key), 
					value: sanitizeForPrompt(value), 
					context: context ? sanitizeForPrompt(context) : null 
				})
				.select()
				.single();
			if (error) return json({ error: error.message }, { status: 500 });
			return json(data);
		}
	}
	
	return json({ error: 'Invalid content type' }, { status: 400 });
}

export async function DELETE({ url }) {
	const id = url.searchParams.get('id');
	if (!id) return json({ error: 'id required' }, { status: 400 });
	await supabase.from('knowledge').delete().eq('id', id);
	return json({ ok: true });
}
