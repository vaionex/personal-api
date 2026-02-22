import { LLM_PROVIDER } from '$env/static/private';
import { callLLM as callAnthropicLLM } from './anthropic.js';
import { callLLM as callOpenAILLM } from './openai.js';

const providers = {
	'anthropic': callAnthropicLLM,
	'openai': callOpenAILLM
};

export async function callLLM({ system, messages, model }) {
	const provider = LLM_PROVIDER || 'anthropic';
	
	if (!providers[provider]) {
		throw new Error(`Unknown LLM provider: ${provider}`);
	}
	
	return await providers[provider]({ system, messages, model });
}