import { SCRIPTS_CONFIG } from '../config';

type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';
type FetchMethod = 'fetch' | 'playwright';
type OperationType = 'Fetch' | 'Navigate';

interface LogOptions {
	context?: string;
	timestamp?: boolean;
}

interface NetworkLogOptions extends LogOptions {
	method?: FetchMethod;
	operationType?: OperationType;
	statusCode?: number;
	fields?: string[];
}

/**
 * Utility for consistent, colored logging across all scripts
 */
export class Logger {
	private context: string;
	private debugEnabled: boolean;

	constructor(context: string = 'script') {
		this.context = context;
		this.debugEnabled = SCRIPTS_CONFIG.logging.debug;
	}

	private getTimestamp(): string {
		return new Date().toISOString();
	}

	private formatMessage(message: string, options?: LogOptions): string {
		const parts: string[] = [];

		if (options?.timestamp ?? SCRIPTS_CONFIG.logging.timestamps) {
			parts.push(`[${this.getTimestamp()}]`);
		}

		if (options?.context ?? this.context) {
			parts.push(`[${options?.context ?? this.context}]`);
		}

		parts.push(message);
		return parts.join(' ');
	}

	private colorize(text: string, color: string): string {
		if (!SCRIPTS_CONFIG.logging.colors) {
			return text;
		}

		const colors: Record<string, string> = {
			reset: '\x1b[0m',
			bright: '\x1b[1m',
			dim: '\x1b[2m',
			// Foreground colors
			black: '\x1b[30m',
			red: '\x1b[31m',
			green: '\x1b[32m',
			yellow: '\x1b[33m',
			blue: '\x1b[34m',
			magenta: '\x1b[35m',
			cyan: '\x1b[36m',
			white: '\x1b[37m',
			// Bright foreground colors
			brightRed: '\x1b[91m',
			brightGreen: '\x1b[92m',
			brightYellow: '\x1b[93m',
			brightBlue: '\x1b[94m',
		};

		const colorCode = colors[color] || '';
		return colorCode ? `${colorCode}${text}${colors.reset}` : text;
	}

	info(message: string, options?: LogOptions): void {
		const formatted = this.formatMessage(message, options);
		console.log(this.colorize(formatted, 'cyan'));
	}

	success(message: string, options?: LogOptions): void {
		const formatted = this.formatMessage(message, options);
		console.log(this.colorize(formatted, 'green'));
	}

	warning(message: string, options?: LogOptions): void {
		const formatted = this.formatMessage(message, options);
		console.warn(this.colorize(formatted, 'yellow'));
	}

	error(message: string, error?: unknown, options?: LogOptions): void {
		const formatted = this.formatMessage(message, options);
		console.error(this.colorize(formatted, 'red'));

		if (error) {
			if (error instanceof Error) {
				console.error(this.colorize(`  → ${error.message}`, 'dim'));
				if (this.debugEnabled && error.stack) {
					console.error(error.stack);
				}
			} else {
				console.error(this.colorize(`  → ${String(error)}`, 'dim'));
			}
		}
	}

	debug(message: string, options?: LogOptions): void {
		if (!this.debugEnabled) return;
		const formatted = this.formatMessage(message, options);
		console.log(this.colorize(formatted, 'dim'));
	}

	/**
	 * Log progress with visual bar and percentage
	 */
	progress(current: number, total: number, message?: string): void {
		const percentage = ((current / total) * 100).toFixed(0);
		const progressBar = this.getProgressBar(current, total);
		const remaining = total - current;
		const status = remaining > 0 ? `${remaining} remaining` : 'complete';
		const msg = `${progressBar} ${percentage}% | ${current}/${total} | ${status}`;
		const fullMessage = message ? `${message} ${msg}` : msg;
		const formatted = this.formatMessage(fullMessage, { timestamp: false });
		console.log(this.colorize(formatted, 'cyan'));
	}

	/**
	 * Get a clean text-based progress bar
	 */
	private getProgressBar(current: number, total: number): string {
		const barLength = 30;
		const filled = Math.round((current / total) * barLength);
		const empty = barLength - filled;
		const filledBar = '='.repeat(filled);
		const emptyBar = '-'.repeat(empty);
		return `[${this.colorize(filledBar, 'green')}${emptyBar}]`;
	}

	/**
	 * Log section header with visual styling
	 */
	section(title: string): void {
		console.log('');
		console.log(this.colorize('─'.repeat(60), 'brightBlue'));
		console.log(this.colorize(` ${title}`, 'brightBlue'));
		console.log(this.colorize('─'.repeat(60), 'brightBlue'));
		console.log('');
	}

	/**
	 * Log a formatted table of results
	 */
	table(data: Record<string, number | string>): void {
		const entries = Object.entries(data);
		const maxKeyLength = Math.max(...entries.map(([k]) => k.length));

		for (const [key, value] of entries) {
			const paddedKey = key.padEnd(maxKeyLength);
			console.log(`  ${paddedKey} : ${value}`);
		}
	}

	/**
	 * Create a new logger instance with a different context
	 */
	withContext(context: string): Logger {
		const logger = new Logger(context);
		logger.debugEnabled = this.debugEnabled;
		return logger;
	}

	/**
	 * Log network operation (fetch or playwright) with URL and fields
	 * Format: {Method} {Operation} GET {url} [fields]
	 * Examples: "Fetch GET", "Playwright Fetch GET", "Playwright Navigate GET"
	 */
	networkRequest(
		url: string,
		method: FetchMethod = 'fetch',
		fields: string[] = [],
		operationType: OperationType = 'Fetch',
		options?: NetworkLogOptions,
	): void {
		const methodLabel = method === 'fetch' ? 'Fetch' : `Playwright ${operationType}`;
		const fieldsList = fields.length > 0 ? ` [${fields.join(',')}]` : '';
		const message = `${methodLabel} GET ${url}${fieldsList}`;
		const formatted = this.formatMessage(message, options);
		console.log(this.colorize(formatted, 'cyan'));
	}

	/**
	 * Log successful network response with extracted fields
	 * Format: {Method} {Operation} GET {url} [fields_found]
	 */
	networkSuccess(
		url: string,
		method: FetchMethod = 'fetch',
		fields: string[] = [],
		statusCode: number = 200,
		operationType: OperationType = 'Fetch',
		options?: NetworkLogOptions,
	): void {
		const methodLabel = method === 'fetch' ? 'Fetch' : `Playwright ${operationType}`;
		const fieldsList = fields.length > 0 ? ` [${fields.join(',')}]` : '';
		const message = `${methodLabel} GET ${url}${fieldsList}`;
		const formatted = this.formatMessage(message, options);
		console.log(this.colorize(formatted, 'green'));
	}

	/**
	 * Log failed network response with fields that were attempted
	 * Format: {Method} {Operation} GET {url} [fields_attempted]
	 * Error details shown below
	 */
	networkError(
		url: string,
		method: FetchMethod = 'fetch',
		error?: string | Error,
		statusCode?: number,
		fields: string[] = [],
		operationType: OperationType = 'Fetch',
		options?: NetworkLogOptions,
	): void {
		const methodLabel = method === 'fetch' ? 'Fetch' : `Playwright ${operationType}`;
		const fieldsList = fields.length > 0 ? ` [${fields.join(',')}]` : '';
		const message = `${methodLabel} GET ${url}${fieldsList} - ERROR`;
		const formatted = this.formatMessage(message, options);
		console.error(this.colorize(formatted, 'red'));

		if (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			const statusStr = statusCode ? ` [HTTP ${statusCode}]` : '';
			console.error(this.colorize(`  ${errorMsg}${statusStr}`, 'dim'));
		}
	}
}

// Export singleton instance
export const logger = new Logger('scripts');

export default logger;
