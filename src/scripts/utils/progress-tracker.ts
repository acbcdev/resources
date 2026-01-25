import { logger } from './logger';
import { updateShutdownStats } from './graceful-shutdown';

/**
 * Create a progress callback for batch operations
 * Handles logging and shutdown stats updates
 *
 * Usage:
 * ```
 * const results = await batchExecuteWithRetry(..., {
 *   onProgress: createProgressCallback('Enriching', results)
 * })
 * ```
 */
export function createProgressCallback(
	taskName: string,
	results: { failed: Array<{ item: unknown; error: Error }> },
): (current: number, total: number) => void {
	return (current: number, total: number) => {
		logger.progress(current, total, taskName);
		const successCount = current - (results?.failed?.length || 0);
		updateShutdownStats({
			totalProcessed: current,
			successful: successCount,
			failed: results?.failed?.length || 0,
		});
	};
}
