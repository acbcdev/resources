import { SCRIPTS_CONFIG } from '../config';
import { logger } from './logger';

/**
 * Calculate delay with exponential backoff
 * delay = initialDelay * (2 ^ attempt), capped at maxDelay
 */
function calculateBackoffDelay(attempt: number, initialDelay: number, maxDelay: number): number {
	const exponentialDelay = initialDelay * Math.pow(2, attempt);
	return Math.min(exponentialDelay, maxDelay);
}

/**
 * Sleep for specified milliseconds using Bun.sleep for better performance
 */
function sleep(ms: number): Promise<void> {
	return Bun.sleep(ms);
}

interface RetryOptions {
	maxAttempts?: number;
	initialDelay?: number;
	maxDelay?: number;
	onRetry?: (attempt: number, error: Error) => void;
}

interface RetryResult<T> {
	result: T;
	retriesRequired: number;
}

/**
 * Retry async operations with exponential backoff
 * Returns result with count of retries required
 */
export async function withRetry<T>(
	fn: () => Promise<T>,
	description: string,
	options?: RetryOptions
): Promise<RetryResult<T>> {
	const {
		maxAttempts = SCRIPTS_CONFIG.retry.maxAttempts,
		initialDelay = SCRIPTS_CONFIG.retry.initialDelay,
		maxDelay = SCRIPTS_CONFIG.retry.maxDelay,
		onRetry,
	} = options || {};

	let lastError: Error | null = null;

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		try {
			const result = await fn();
			return { result, retriesRequired: attempt };
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			if (attempt < maxAttempts - 1) {
				const delay = calculateBackoffDelay(attempt, initialDelay, maxDelay);
				logger.warning(
					`${description} failed (attempt ${attempt + 1}/${maxAttempts}): ${lastError.message}`
				);
				logger.debug(`Retrying in ${delay}ms...`);

				if (onRetry) {
					onRetry(attempt + 1, lastError);
				}

				await sleep(delay);
			} else {
				logger.error(`${description} failed after ${maxAttempts} attempts`, lastError);
			}
		}
	}

	throw lastError || new Error(`${description} failed`);
}


/**
 * Batch execute operations with retry and error collection
 */
export async function batchExecuteWithRetry<T, R>(
	items: T[],
	fn: (item: T) => Promise<R>,
	options?: {
		maxAttempts?: number;
		initialDelay?: number;
		maxDelay?: number;
		onProgress?: (current: number, total: number) => void;
		onError?: (item: T, error: Error) => void;
		onSuccess?: (item: T, result: R, retriesRequired: number) => void;
	}
): Promise<{ successful: R[]; failed: Array<{ item: T; error: Error }> }> {
	const successful: R[] = [];
	const failed: Array<{ item: T; error: Error }> = [];

	for (let i = 0; i < items.length; i++) {
		const item = items[i];

		try {
			const { result, retriesRequired } = await withRetry(
				() => fn(item),
				`Processing item ${i + 1}/${items.length}`,
				options
			);
			successful.push(result);

			if (options?.onSuccess) {
				options.onSuccess(item, result, retriesRequired);
			}
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			failed.push({ item, error: err });

			if (options?.onError) {
				options.onError(item, err);
			}
		}

		if (options?.onProgress) {
			options.onProgress(i + 1, items.length);
		}
	}

	return { successful, failed };
}

export default {
	withRetry,
	batchExecuteWithRetry,
};
