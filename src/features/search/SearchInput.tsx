/**
 * SearchInput React component
 * Implements real-time search with dropdown suggestions
 * Also handles navigation to full search results page
 */

import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

interface SearchIndexItem {
	id: number;
	name: string;
	url: string;
	category: string[];
	tags: string[];
	description: string;
}

export default function SearchInput() {
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<SearchIndexItem[]>([]);
	const [showDropdown, setShowDropdown] = useState(false);
	const [searchIndex, setSearchIndex] = useState<SearchIndexItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [activeIndex, setActiveIndex] = useState(-1);
	const [isMac, setIsMac] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Detect OS on mount
	useEffect(() => {
		setIsMac(navigator.platform.includes('Mac'));
	}, []);

	// Load search index on mount
	useEffect(() => {
		const loadIndex = async () => {
			try {
				const response = await fetch('/search-index.json');
				const data = await response.json();
				setSearchIndex(data);
			} catch (error) {
				console.error('Failed to load search index:', error);
			} finally {
				setIsLoading(false);
			}
		};

		loadIndex();
	}, []);

	// Debounced search
	useEffect(() => {
		const timer = setTimeout(() => {
			if (query.length > 2) {
				const filtered = searchIndex
					.filter(
						(item) =>
							item.name.toLowerCase().includes(query.toLowerCase()) ||
							item.tags.some((tag) =>
								tag.toLowerCase().includes(query.toLowerCase()),
							) ||
							item.description.toLowerCase().includes(query.toLowerCase()),
					)
					.slice(0, 10);

				setResults(filtered);
				setShowDropdown(true);
				setActiveIndex(-1);
			} else {
				setResults([]);
				setShowDropdown(false);
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [query, searchIndex]);

	// Close dropdown on outside click
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target as Node) &&
				inputRef.current &&
				!inputRef.current.contains(e.target as Node)
			) {
				setShowDropdown(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Handle keyboard shortcut (Cmd+K or Ctrl+K) to focus search
	useEffect(() => {
		const handleKeyboardShortcut = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				inputRef.current?.focus();
			}
		};

		document.addEventListener('keydown', handleKeyboardShortcut);
		return () => document.removeEventListener('keydown', handleKeyboardShortcut);
	}, []);

	// Handle keyboard navigation
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (!showDropdown || results.length === 0) {
			if (e.key === 'Enter') {
				handleSearch();
			}
			return;
		}

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				setActiveIndex((prev) =>
					prev < results.length - 1 ? prev + 1 : prev,
				);
				break;
			case 'ArrowUp':
				e.preventDefault();
				setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
				break;
			case 'Enter':
				e.preventDefault();
				if (activeIndex >= 0 && results[activeIndex]) {
					window.location.href = results[activeIndex].url;
				} else {
					handleSearch();
				}
				break;
			case 'Escape':
				setShowDropdown(false);
				break;
		}
	};

	const handleSearch = () => {
		if (query.trim()) {
			window.location.href = `/search/${encodeURIComponent(query)}/1`;
		}
	};

	return (
		<div className="search-input-container">
			<div className="search-wrapper">
				<Search size={20} className="search-icon" />
				<input
					ref={inputRef}
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Search resources..."
					aria-label="Search resources"
					aria-expanded={showDropdown}
					aria-controls="search-results"
					className="search-input"
				/>
				<kbd className="keyboard-hint">
					{isMac ? '⌘' : 'Ctrl'} K
				</kbd>
			</div>

			{!isLoading && showDropdown && results.length > 0 && (
				<div
					ref={dropdownRef}
					id="search-results"
					className="search-dropdown"
					role="listbox"
				>
					{results.map((result, index) => (
						<a
							key={result.id}
							href={result.url}
							className={`search-result ${
								index === activeIndex ? 'active' : ''
							}`}
							role="option"
							aria-selected={index === activeIndex}
						>
							<div className="result-name">{result.name}</div>
							<div className="result-category">
								{result.category.join(', ')}
							</div>
						</a>
					))}
				</div>
			)}

			{!isLoading && showDropdown && query.length > 2 && results.length === 0 && (
				<div className="search-dropdown">
					<div className="search-no-results">
						No results found for "{query}"
					</div>
				</div>
			)}

			<style>{`
				.search-input-container {
					flex: 1;
					position: relative;
					max-width: 500px;
				}

				.search-wrapper {
					display: flex;
					align-items: center;
					background: var(--muted);
					border: 1px solid var(--border);
					border-radius: 0.5rem;
					padding: 0.5rem 1rem;
					transition: all 0.3s ease;
				}

				.search-wrapper:hover,
				.search-input:focus ~ .search-wrapper {
					border-color: var(--outline);
					box-shadow: 0 0 0 1px var(--outline);
				}

				.search-input:focus ~ .search-wrapper {
					border-color: var(--outline);
					box-shadow: 0 0 0 1px var(--outline);
				}

				.search-icon {
					color: var(--muted-foreground);
					flex-shrink: 0;
					margin-right: 0.5rem;
				}

				.search-input {
					flex: 1;
					background: none;
					border: none;
					color: var(--foreground);
					font-size: 0.95rem;
					outline: none;
					font-family: inherit;
					padding-right: 3rem;
				}

				.search-input::placeholder {
					color: var(--muted-foreground);
				}

				.keyboard-hint {
					position: absolute;
					right: 0.75rem;
					background: var(--muted);
					color: var(--muted-foreground);
					padding: 0.25rem 0.5rem;
					border-radius: 0.25rem;
					font-size: 0.75rem;
					font-weight: 500;
					pointer-events: none;
					font-family: inherit;
					border: none;
				}

				.search-dropdown {
					position: absolute;
					top: 100%;
					left: 0;
					right: 0;
					margin-top: 0.5rem;
					background: var(--background);
					border: 1px solid var(--border);
					border-radius: 0.5rem;
					overflow: hidden;
					box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
					z-index: 50;
					max-height: 400px;
					overflow-y: auto;
					backdrop-filter: blur(10px);
				}

				.search-result {
					display: block;
					padding: 0.75rem 1rem;
					color: var(--muted-foreground);
					text-decoration: none;
					border-bottom: 1px solid var(--border);
					transition: all 0.2s ease;
					cursor: pointer;
				}

				.search-result:hover,
				.search-result.active {
					background: var(--muted);
					color: var(--foreground);
				}

				.search-result:last-child {
					border-bottom: none;
				}

				.result-name {
					font-weight: 500;
					margin-bottom: 0.25rem;
				}

				.result-category {
					font-size: 0.8rem;
					color: var(--muted-foreground);
				}

				.search-no-results {
					padding: 1rem;
					text-align: center;
					color: var(--muted-foreground);
					font-size: 0.9rem;
				}

				/* Mobile responsive */
				@media (max-width: 640px) {
					.search-input-container {
						max-width: 100%;
					}

					.search-input {
						font-size: 0.85rem;
					}

					.search-dropdown {
						max-height: 300px;
					}

					.search-result {
						padding: 0.6rem 0.8rem;
					}
				}
			`}</style>
		</div>
	);
}
