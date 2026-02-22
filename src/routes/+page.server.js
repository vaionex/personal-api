import { PUBLIC_OWNER_NAME, PUBLIC_APP_NAME } from '$env/static/public';

export function load() {
	return {
		ownerName: PUBLIC_OWNER_NAME || 'Owner',
		appName: PUBLIC_APP_NAME || 'Personal API',
	};
}
