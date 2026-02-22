import { PUBLIC_OWNER_NAME } from '$env/static/public';

export async function load() {
	return {
		ownerName: PUBLIC_OWNER_NAME || 'Owner'
	};
}