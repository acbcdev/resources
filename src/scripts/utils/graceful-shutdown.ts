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

		console.log('\n');
		console.log('\n');
		logger.section('SHUTDOWN INITIATED');
		logger.warning('Process interrupted by user - saving progress...');

		if (shutdownStats) {
			displayShutdownStats(shutdownStats);
		}

		logger.info('Cleaning up resources and exiting gracefully...');
		console.log('');
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
 * Format milliseconds to human-readable duration
 */
function formatDuration(ms: number): string {
	const seconds = Math.floor((ms / 1000) % 60);
	const minutes = Math.floor((ms / (1000 * 60)) % 60);
	const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

	if (hours > 0) {
		return `${hours}h ${minutes}m ${seconds}s`;
	}
	if (minutes > 0) {
		return `${minutes}m ${seconds}s`;
	}
	return `${seconds}s`;
}

/**
 * Display shutdown statistics
 */
function displayShutdownStats(stats: ShutdownStats): void {
	const elapsed = new Date().getTime() - stats.startTime.getTime();
	const formattedElapsed = formatDuration(elapsed);
	const avgTime = stats.totalProcessed > 0 ? (elapsed / stats.totalProcessed) : 0;
	const formattedAvgTime = formatDuration(Math.round(avgTime));
	const successRate = stats.totalProcessed > 0
		? ((stats.successful / stats.totalProcessed) * 100).toFixed(0)
		: '0';

	console.log('');
	logger.section('FINAL SESSION STATISTICS');

	logger.table({
		'Total processed': `${stats.totalProcessed}`,
		'Successfully completed': `${stats.successful}`,
		'Failed items': `${stats.failed}`,
		'Success rate': `${successRate}%`,
		'Time elapsed': formattedElapsed,
		'Avg time per item': formattedAvgTime,
	});

	console.log('');

	if (stats.failed > 0) {
		logger.warning(
			`WARNING: ${stats.failed} items failed. These will be reprocessed on the next run.`,
		);
	} else {
		logger.success(
			`All ${stats.totalProcessed} items completed successfully before interruption.`,
		);
	}

	console.log('');
}

export default {
	setupGracefulShutdown,
	updateShutdownStats,
	displayShutdownStats,
};
