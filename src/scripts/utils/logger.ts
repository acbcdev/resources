import { SCRIPTS_CONFIG } from '../config/scripts.config';

type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';

interface LogOptions {
	context?: string;
	timestamp?: boolean;
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
	 * Log progress with percentage
	 */
	progress(current: number, total: number, message?: string): void {
		const percentage = ((current / total) * 100).toFixed(1);
		const progressBar = this.getProgressBar(current, total);
		const msg = `${progressBar} ${percentage}% (${current}/${total})`;
		const fullMessage = message ? `${message} ${msg}` : msg;
		this.info(fullMessage);
	}

	/**
	 * Get a simple text-based progress bar
	 */
	private getProgressBar(current: number, total: number): string {
		const barLength = 20;
		const filled = Math.round((current / total) * barLength);
		const empty = barLength - filled;
		return `[${this.colorize('█'.repeat(filled), 'green')}${this.colorize('░'.repeat(empty), 'dim')}]`;
	}

	/**
	 * Log section header
	 */
	section(title: string): void {
		console.log('');
		console.log(this.colorize('─'.repeat(60), 'dim'));
		console.log(this.colorize(` ${title}`, 'brightBlue'));
		console.log(this.colorize('─'.repeat(60), 'dim'));
	}

	/**
	 * Log a table of results
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
}

// Export singleton instance
export const logger = new Logger('scripts');

export default logger;
