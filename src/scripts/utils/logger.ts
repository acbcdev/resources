import { SCRIPTS_CONFIG } from '../config';

type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';
export type FetchMethod = 'fetch' | 'playwright' | 'playwright-headless';
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

		if (SCRIPTS_CONFIG.logging.showPrefix && (options?.context ?? this.context)) {
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
	log(message: string, options?: LogOptions): void {
		const formatted = this.formatMessage(message, options);
		console.log(formatted);
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
		const status = remaining > 0 ? `${remaining} remaining` : 'COMPLETE';
		const msg = `${progressBar} ${percentage}% | ${current}/${total} | ${status}`;
		const fullMessage = message ? `${message}: ${msg}` : msg;
		const formatted = this.formatMessage(fullMessage, { timestamp: false });
		// Use carriage return for real-time progress updates on same line
		process.stdout.write(`\r${this.colorize(formatted, 'cyan')}`);
		// Add newline when complete
		if (remaining === 0) {
			console.log('');
		}
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
		const line = '═'.repeat(60);
		console.log(this.colorize(`╔${line}╗`, 'brightBlue'));
		const paddedTitle = ` ${title}`.padEnd(60);
		console.log(this.colorize(`║${paddedTitle}║`, 'brightBlue'));
		console.log(this.colorize(`╚${line}╝`, 'brightBlue'));
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
	 * Get status icon based on status type
	 */
	private getStatusIcon(status: 'success' | 'warning' | 'error'): string {
		if (!SCRIPTS_CONFIG.logging.useStatusIcons) {
			return '';
		}
		const icons: Record<'success' | 'warning' | 'error', string> = {
			success: ' ✓ ',
			warning: ' ⚠ ',
			error: ' ✗ ',
		};
		return icons[status];
	}

	/**
	 * Format duration in human-readable format (45s, 2m 15s)
	 */
	private formatDuration(ms: number): string {
		const totalSeconds = Math.floor(ms / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;

		if (minutes === 0) {
			return `${seconds}s`;
		}
		return `${minutes}m ${seconds}s`;
	}

	/**
	 * Get terminal width for responsive layout
	 */
	private getTerminalWidth(): number {
		return process.stdout.columns || 80;
	}

	/**
	 * Enhanced progress bar with status counts, ETA, and current item name
	 */
	progressAdvanced(
		current: number,
		total: number,
		status: { successful: number; warnings: number; failed: number },
		itemName?: string,
		startTime?: number,
	): void {
		const percentage = ((current / total) * 100).toFixed(0);
		const progressBar = this.getProgressBar(current, total);
		const remaining = total - current;

		// Build status icons
		const statusStr = `${this.colorize(String(status.successful), 'green')}${this.getStatusIcon('success')} ${this.colorize(String(status.warnings), 'yellow')}${this.getStatusIcon('warning')} ${this.colorize(String(status.failed), 'red')}${this.getStatusIcon('error')}`;

		// Calculate ETA if startTime provided
		let etaStr = '';
		if (SCRIPTS_CONFIG.logging.showETA && startTime && current > 0) {
			const elapsed = Date.now() - startTime;
			const avgTimePerItem = elapsed / current;
			const etaMs = avgTimePerItem * remaining;
			etaStr = remaining > 0 ? ` | ETA ${this.formatDuration(etaMs)}` : '';
		}

		// Truncate itemName if it's too long
		let itemStr = '';
		if (itemName) {
			const terminalWidth = this.getTerminalWidth();
			const maxItemLength = Math.max(20, terminalWidth - 100);
			const truncatedItem =
				itemName.length > maxItemLength
					? itemName.substring(0, maxItemLength - 3) + '...'
					: itemName;
			itemStr = ` | ${truncatedItem}`;
		}

		const msg = `${progressBar} ${percentage}% | ${current}/${total} | ${statusStr}${etaStr}${itemStr}`;
		const formatted = this.formatMessage(msg, { timestamp: false });
		process.stdout.write(`\r${this.colorize(formatted, 'cyan')}\n`);

		// Add newline when complete
		if (remaining === 0) {
			console.log('');
		}
	}

	/**
	 * Clean, one-line status output with icon
	 * Success: ✓ example.com
	 * Warning: ⚠ example.com (Succeeded after 2 retries)
	 * Error: ✗ example.com (HTTP 404)
	 */
	itemStatus(
		status: 'success' | 'warning' | 'error',
		url: string,
		details?: string,
		retriesRequired?: number,
	): void {
		const icon = this.getStatusIcon(status);
		let message = `${icon} ${url}`;

		if (details) {
			message += ` (${details})`;
		}

		const colorMap: Record<'success' | 'warning' | 'error', string> = {
			success: 'green',
			warning: 'yellow',
			error: 'red',
		};

		const formatted = this.formatMessage(message, { timestamp: false });
		const color = colorMap[status];
		console.log(this.colorize(formatted, color));
	}

	/**
	 * Enhanced table method with color-coding support
	 * Auto-detects colors based on key patterns (Successful=green, Warnings=yellow, Failed=red, etc.)
	 */
	tableWithColors(data: Record<string, number | string>): void {
		const entries = Object.entries(data);
		const maxKeyLength = Math.max(...entries.map(([k]) => k.length));

		for (const [key, value] of entries) {
			const paddedKey = key.padEnd(maxKeyLength);
			let valueStr = String(value);

			// Auto-detect colors based on key patterns
			let color = 'reset';
			if (key.toLowerCase().includes('success') || key.toLowerCase().includes('successful')) {
				color = 'green';
			} else if (key.toLowerCase().includes('warning')) {
				color = 'yellow';
			} else if (key.toLowerCase().includes('fail') || key.toLowerCase().includes('error')) {
				color = 'red';
			}

			const coloredValue = color !== 'reset' ? this.colorize(valueStr, color) : valueStr;
			console.log(`  ${paddedKey} : ${coloredValue}`);
		}
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
	 * Format: {Method} {url} • {fields_found}
	 */
	networkSuccess(
		url: string,
		method: FetchMethod = 'fetch',
		fields: string[] = [],
		statusCode: number = 200,
		operationType: OperationType = 'Fetch',
		options?: NetworkLogOptions,
	): void {
		const methodLabel = method === 'fetch' ? 'Fetch' : 'Playwright';
		const fieldsList = fields.length > 0 ? ` • ${fields.join(', ')}` : '';
		const message = `${methodLabel} ${url}${fieldsList}`;
		const formatted = this.formatMessage(message, options);
		console.log(this.colorize(formatted, 'green'));
	}

	/**
	 * Log failed network response with fields that were attempted
	 * Format: {Method} {url} • error details
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
		const methodLabel = method === 'fetch' ? 'Fetch' : 'Playwright';
		const message = `${methodLabel} ${url}`;
		const formatted = this.formatMessage(message, options);
		console.error(this.colorize(formatted, 'red'));

		if (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			const statusStr = statusCode ? ` [HTTP ${statusCode}]` : '';
			console.error(this.colorize(`  → ${errorMsg}${statusStr}`, 'dim'));
		}
	}
}

// Export singleton instance
export const logger = new Logger('scripts');

export default logger;
