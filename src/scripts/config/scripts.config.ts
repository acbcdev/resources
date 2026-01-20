import { resolve } from 'path';

// Project root directory
const PROJECT_ROOT = resolve(import.meta.dir, '../../..');

// Data directories (corrected to match actual structure)
const DATA_DIR = resolve(PROJECT_ROOT, 'src/data');
const SCRIPTS_OUTPUT_DIR = resolve(DATA_DIR, 'scripts-output');
const PUBLIC_DIR = resolve(PROJECT_ROOT, 'public');
const SCREENSHOTS_DIR = resolve(PUBLIC_DIR, 'screenshots');

/**
 * Centralized configuration for all scripts
 */
export const SCRIPTS_CONFIG = {
	// ============ File Paths ============
	paths: {
		// Input files
		input: {
			newUrls: resolve(DATA_DIR, 'new.json'),
			existingData: resolve(DATA_DIR, 'data.json'),
			backup: resolve(DATA_DIR, 'backup.json'),
			pending: resolve(DATA_DIR, 'pending.json'),
		},
		// Output files (scripts-output directory)
		output: {
			ogData: resolve(SCRIPTS_OUTPUT_DIR, 'ogData.json'),
			backupOG: resolve(SCRIPTS_OUTPUT_DIR, 'backupOG.json'),
			failedOG: resolve(SCRIPTS_OUTPUT_DIR, 'failedOG.json'),
			aiEnriched: resolve(SCRIPTS_OUTPUT_DIR, 'aiEnriched.json'),
			backupAI: resolve(SCRIPTS_OUTPUT_DIR, 'backupAI.json'),
			failedAI: resolve(SCRIPTS_OUTPUT_DIR, 'failedAI.json'),
			withScreenshots: resolve(SCRIPTS_OUTPUT_DIR, 'withScreenshots.json'),
			backupScreenshots: resolve(SCRIPTS_OUTPUT_DIR, 'backupScreenshots.json'),
			failedScreenshots: resolve(SCRIPTS_OUTPUT_DIR, 'failedScreenshots.json'),
		},
		// Screenshot storage
		screenshots: {
			directory: SCREENSHOTS_DIR,
			publicPath: '/screenshots',
		},
	},

	// ============ Browser Settings ============
	browser: {
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
		timeout: 10000, // ms
		viewport: {
			width: 1280,
			height: 720,
		},
	},

	// ============ Network Settings ============
	network: {
		fetchTimeout: 10000, // ms
		userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
		retryMaxAttempts: 3,
		retryInitialDelay: 1000, // ms
		retryMaxDelay: 30000, // ms
	},

	// ============ Open Graph Extraction Settings ============
	og: {
		timeout: 10000, // ms
		navigateTimeout: 10000, // ms
		contentTimeout: 5000, // ms
		extractMetaTags: true,
		extractFavicon: true,
		useFetchFirst: true, // Try fetch before Playwright
	},

	// ============ Screenshot Settings ============
	screenshot: {
		enabled: true,
		format: 'jpeg' as const,
		quality: 80,
		timeout: 10000, // ms
		navigateTimeout: 10000, // ms
		fullPage: false,
		scale: 'device',
		maxSize: 1024 * 1024, // 1MB max file size
	},

	// ============ AI Enrichment Settings ============
	ai: {
		// Temperature for creativity (0-1, lower = more deterministic)
		temperature: 0.7,
		// Max content to send to AI (characters)
		maxContentLength: 1500,
		// Max tokens in response
		maxTokens: 1000,
		// Models to randomly select from
		models: {
			google: process.env.GOOGLE_MODEL || 'gemini-1.5-flash',
			mistral: process.env.MISTRAL_MODEL || 'mistral-small-latest',
			groq: process.env.GROQ_MODEL || 'mixtral-8x7b-32768',
		},
		// Weights for model selection (higher = more likely)
		modelWeights: {
			google: 0.4,
			mistral: 0.3,
			groq: 0.3,
		},
	},

	// ============ Retry Settings ============
	retry: {
		maxAttempts: 3,
		// Exponential backoff: delay = initialDelay * (2 ^ attempt)
		initialDelay: 1000, // ms
		maxDelay: 30000, // ms
	},

	// ============ Logging Settings ============
	logging: {
		timestamps: false, // Set to false by default to reduce log clutter
		colors: true,
		debug: process.env.DEBUG === 'true',
	},

	// ============ Processing Settings ============
	processing: {
		batchSize: 10, // URLs to process before saving progress
		resumeFromBackup: true, // Continue from last successful backup
		deletePartialBackups: false, // Keep incomplete backups for debugging
	},
} as const;

/**
 * Validate that all necessary environment variables are set
 */
export function validateConfig() {
	const requiredEnvVars = [
		'GOOGLE_API_KEY', // For Google Gemini
		'MISTRAL_API_KEY', // For Mistral
		'GROQ_API_KEY', // For Groq
	];

	const missing = requiredEnvVars.filter(v => !process.env[v]);

	if (missing.length > 0) {
		console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
		console.warn('📝 Some scripts may not work properly without these API keys.');
	}
}

/**
 * Get a random AI model name based on configured weights
 */
export function getRandomAIModel(): 'google' | 'mistral' | 'groq' {
	const models = ['google', 'mistral', 'groq'] as const;
	const weights = [
		SCRIPTS_CONFIG.ai.modelWeights.google,
		SCRIPTS_CONFIG.ai.modelWeights.mistral,
		SCRIPTS_CONFIG.ai.modelWeights.groq,
	];

	// Weighted random selection
	const totalWeight = weights.reduce((a, b) => a + b, 0);
	let random = Math.random() * totalWeight;

	for (let i = 0; i < models.length; i++) {
		random -= weights[i];
		if (random <= 0) {
			return models[i];
		}
	}

	return models[0];
}

/**
 * Get model name by key
 */
export function getModelName(key: 'google' | 'mistral' | 'groq'): string {
	return SCRIPTS_CONFIG.ai.models[key];
}

export default SCRIPTS_CONFIG;
