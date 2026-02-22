import { PUBLIC_OWNER_NAME } from '$env/static/public';
export function load() { return { ownerName: PUBLIC_OWNER_NAME || 'Owner' }; }
