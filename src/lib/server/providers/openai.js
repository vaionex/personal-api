import { OPENAI_API_KEY, LLM_MODEL } from '$env/static/private';

export async function callLLM({ system, messages, model }) {
	// OpenAI expects system message as part of messages array
	const openaiMessages = [
		{ role: 'system', content: system },
		...messages
	];

	const res = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${OPENAI_API_KEY}`,
		},
		body: JSON.stringify({
			model: model || LLM_MODEL || 'gpt-4o',
			messages: openaiMessages,
			max_tokens: 1024,
		}),
	});

	const data = await res.json();
	
	if (!res.ok) {
		throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
	}
	
	return {
		text: data.choices?.[0]?.message?.content || '',
		usage: data.usage
	};
}