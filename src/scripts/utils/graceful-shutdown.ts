import { logger } from './logger';

interface ShutdownStats {
	totalProcessed: number;
	successful: number;
	failed: number;
	startTime: Date;
}

let shutdownStats: ShutdownStats | null = null;
let isShuttingDown = false;

/**
 * Initialize graceful shutdown handler
 * Call this at the start of your script
 */
export function setupGracefulShutdown(): void {
	if (isShuttingDown) return;

	process.on('SIGINT', () => {
		if (isShuttingDown) return;
		isShuttingDown = true;

		console.log('\n'); // Add newline after progress indicator
		logger.section('Processing Interrupted');

		if (shutdownStats) {
			displayShutdownStats(shutdownStats);
		}

		logger.info('Cleaning up and exiting...');
		process.exit(0);
	});
}

/**
 * Update shutdown stats during processing
 */
export function updateShutdownStats(stats: {
	totalProcessed: number;
	successful: number;
	failed: number;
}): void {
	if (!shutdownStats) {
		shutdownStats = {
			...stats,
			startTime: new Date(),
		};
	} else {
		shutdownStats.totalProcessed = stats.totalProcessed;
		shutdownStats.successful = stats.successful;
		shutdownStats.failed = stats.failed;
	}
}

/**
 * Display shutdown statistics
 */
function displayShutdownStats(stats: ShutdownStats): void {
	const elapsed = new Date().getTime() - stats.startTime.getTime();
	const elapsedSeconds = (elapsed / 1000).toFixed(2);
	const avgTime = stats.totalProcessed > 0 ? (elapsed / stats.totalProcessed).toFixed(0) : '0';
	const successRate = stats.totalProcessed > 0
		? ((stats.successful / stats.totalProcessed) * 100).toFixed(0)
		: '0';

	logger.section('Session Summary');

	logger.table({
		'Total processed': `${stats.totalProcessed}`,
		'Successful': `${stats.successful}`,
		'Failed': `${stats.failed}`,
		'Success rate': `${successRate}%`,
		'Time elapsed': `${elapsedSeconds}s`,
		'Avg per item': `${avgTime}ms`,
	});

	if (stats.failed > 0) {
		logger.warning(
			`${stats.failed} items failed - will be reprocessed on next run`,
		);
	}
}

export default {
	setupGracefulShutdown,
	updateShutdownStats,
	displayShutdownStats,
};
