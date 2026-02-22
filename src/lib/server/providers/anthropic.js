import { ANTHROPIC_API_KEY, LLM_MODEL } from '$env/static/private';

export async function callLLM({ system, messages, model }) {
	const res = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': ANTHROPIC_API_KEY,
			'anthropic-version': '2023-06-01',
		},
		body: JSON.stringify({
			model: model || LLM_MODEL || 'claude-sonnet-4-20250514',
			max_tokens: 1024,
			system: system,
			messages: messages,
		}),
	});

	const data = await res.json();
	
	if (!res.ok) {
		throw new Error(`Anthropic API error: ${data.error?.message || 'Unknown error'}`);
	}
	
	return {
		text: data.content?.[0]?.text || '',
		usage: data.usage
	};
}