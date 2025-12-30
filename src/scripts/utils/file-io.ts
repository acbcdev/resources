import { mkdir, readFile, writeFile, stat } from 'fs/promises';
import { dirname, join } from 'path';
import { ZodSchema } from 'zod';
import { logger } from './logger';

/**
 * Safe file I/O operations with automatic directory creation and validation
 */
export class FileIO {
	/**
	 * Ensure directory exists, creating it if necessary
	 */
	async ensureDir(path: string): Promise<void> {
		try {
			await stat(path);
		} catch {
			try {
				await mkdir(path, { recursive: true });
				logger.debug(`Created directory: ${path}`);
			} catch (error) {
				logger.error(`Failed to create directory ${path}`, error);
				throw error;
			}
		}
	}

	/**
	 * Ensure parent directory exists for a file path
	 */
	async ensureParentDir(filePath: string): Promise<void> {
		const dir = dirname(filePath);
		await this.ensureDir(dir);
	}

	/**
	 * Read and parse JSON file with Zod validation
	 * Returns empty array if file doesn't exist (useful for backups)
	 */
	async readJSON<T>(
		path: string,
		schema?: ZodSchema,
		defaultValue: T | null = null
	): Promise<T> {
		try {
			const content = await readFile(path, 'utf-8');
			const data = JSON.parse(content);

			if (schema) {
				const validated = schema.parse(data);
				return validated as T;
			}

			return data as T;
		} catch (error) {
			if (error instanceof SyntaxError) {
				logger.warning(`Invalid JSON in ${path}, using default value`);
				return defaultValue !== null ? defaultValue : ([] as T);
			}

			// File not found or other read error
			if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
				logger.debug(`File not found: ${path}, using default value`);
				return defaultValue !== null ? defaultValue : ([] as T);
			}

			logger.error(`Failed to read JSON file ${path}`, error);
			throw error;
		}
	}

	/**
	 * Write data as JSON to file with optional incremental backup
	 */
	async writeJSON<T>(
		path: string,
		data: T,
		options?: {
			backup?: boolean;
			backupPath?: string;
			schema?: ZodSchema;
		}
	): Promise<void> {
		try {
			// Ensure parent directory exists
			await this.ensureParentDir(path);

			// Validate if schema provided
			if (options?.schema) {
				const validated = options.schema.parse(data);
				data = validated as T;
			}

			// Save backup if requested
			if (options?.backup) {
				const backupPath = options?.backupPath || `${path}.backup`;
				try {
					const existing = await readFile(path, 'utf-8');
					await writeFile(backupPath, existing, 'utf-8');
					logger.debug(`Backup saved: ${backupPath}`);
				} catch {
					// File might not exist yet, that's OK
				}
			}

			// Write the file
			const json = JSON.stringify(data, null, 2);
			await writeFile(path, json, 'utf-8');
			logger.debug(`File written: ${path}`);
		} catch (error) {
			logger.error(`Failed to write JSON to ${path}`, error);
			throw error;
		}
	}

	/**
	 * Read a JSON file and return array of items
	 * Useful for incremental processing
	 */
	async readJSONArray<T>(
		path: string,
		schema?: ZodSchema
	): Promise<T[]> {
		const data = await this.readJSON<T[]>(path, schema, []);
		return Array.isArray(data) ? data : [];
	}

	/**
	 * Append an item to a JSON array file
	 */
	async appendToJSONArray<T>(
		path: string,
		item: T,
		options?: {
			schema?: ZodSchema;
		}
	): Promise<void> {
		try {
			const items = await this.readJSONArray<T>(path, options?.schema);
			items.push(item);
			await this.writeJSON(path, items, { schema: options?.schema });
		} catch (error) {
			logger.error(`Failed to append to JSON array ${path}`, error);
			throw error;
		}
	}

	/**
	 * Find items in a JSON array by predicate
	 */
	async findInJSONArray<T>(
		path: string,
		predicate: (item: T) => boolean
	): Promise<T[]> {
		const items = await this.readJSONArray<T>(path);
		return items.filter(predicate);
	}

	/**
	 * Check if a URL already exists in a JSON array file
	 * Useful for detecting duplicates and skipping processed URLs
	 */
	async urlExistsInArray(path: string, url: string): Promise<boolean> {
		const items = await this.readJSONArray<{ url?: string }>(path);
		return items.some(item =>
			item.url === url || item.url?.startsWith(url.split('?')[0])
		);
	}

	/**
	 * Get count of items in a JSON array file
	 */
	async getArrayLength(path: string): Promise<number> {
		try {
			const items = await this.readJSONArray(path);
			return items.length;
		} catch {
			return 0;
		}
	}

	/**
	 * Get size of a file in bytes
	 */
	async getFileSize(path: string): Promise<number> {
		try {
			const stats = await stat(path);
			return stats.size;
		} catch {
			return 0;
		}
	}

	/**
	 * Format bytes to human readable string
	 */
	formatFileSize(bytes: number): string {
		const units = ['B', 'KB', 'MB', 'GB'];
		let size = bytes;
		let unitIndex = 0;

		while (size >= 1024 && unitIndex < units.length - 1) {
			size /= 1024;
			unitIndex++;
		}

		return `${size.toFixed(2)} ${units[unitIndex]}`;
	}

	/**
	 * Get formatted file info
	 */
	async getFileInfo(path: string): Promise<{
		exists: boolean;
		size: number;
		sizeFormatted: string;
		count?: number;
	} | null> {
		try {
			const size = await this.getFileSize(path);
			const isArray = path.endsWith('.json');
			const count = isArray ? await this.getArrayLength(path) : undefined;

			return {
				exists: size > 0,
				size,
				sizeFormatted: this.formatFileSize(size),
				count,
			};
		} catch {
			return null;
		}
	}
}

// Export singleton instance
export const fileIO = new FileIO();

export default fileIO;
