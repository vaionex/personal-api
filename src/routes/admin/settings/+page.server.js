import { 
	PUBLIC_APP_NAME, 
	PUBLIC_OWNER_NAME, 
	PUBLIC_APP_URL 
} from '$env/static/public';
import { 
	ANTHROPIC_API_KEY,
	SUPABASE_URL,
	SUPABASE_SERVICE_ROLE_KEY,
	TELEGRAM_BOT_TOKEN,
	ADMIN_PASSWORD,
	PAPI_API_KEYS
} from '$env/static/private';

export async function load() {
	return {
		config: {
			ownerName: PUBLIC_OWNER_NAME || 'Not set',
			appName: PUBLIC_APP_NAME || 'Personal API',
			appUrl: PUBLIC_APP_URL || 'Not set',
			anthropicEnabled: ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== 'placeholder',
			supabaseEnabled: SUPABASE_URL && 
				SUPABASE_SERVICE_ROLE_KEY && 
				SUPABASE_URL !== 'placeholder' && 
				SUPABASE_SERVICE_ROLE_KEY !== 'placeholder',
			telegramEnabled: TELEGRAM_BOT_TOKEN && TELEGRAM_BOT_TOKEN !== 'placeholder',
			adminEnabled: ADMIN_PASSWORD && ADMIN_PASSWORD !== 'placeholder',
			apiKeysEnabled: PAPI_API_KEYS && PAPI_API_KEYS !== 'placeholder'
		}
	};
}