import { PUBLIC_OWNER_NAME } from '$env/static/public';

export function load({ url }) {
	const conversationId = url.searchParams.get('conversation_id');
	
	return {
		ownerName: PUBLIC_OWNER_NAME || 'the owner',
		conversationId,
	};
}