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
	const dropdownRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

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
					background: rgba(255, 255, 255, 0.05);
					border: 1px solid rgba(var(--accent), 0.2);
					border-radius: 0.5rem;
					padding: 0.5rem 1rem;
					transition: all 0.3s ease;
				}

				.search-wrapper:hover,
				.search-input:focus ~ .search-wrapper {
					background: rgba(255, 255, 255, 0.08);
					border-color: rgb(var(--accent));
					box-shadow: 0 0 15px rgba(var(--accent), 0.2);
				}

				.search-input:focus ~ .search-wrapper {
					background: rgba(255, 255, 255, 0.08);
					border-color: rgb(var(--accent));
					box-shadow: 0 0 15px rgba(var(--accent), 0.2);
				}

				.search-icon {
					color: rgba(var(--accent), 0.6);
					flex-shrink: 0;
					margin-right: 0.5rem;
				}

				.search-input {
					flex: 1;
					background: none;
					border: none;
					color: rgba(255, 255, 255, 0.9);
					font-size: 0.95rem;
					outline: none;
					font-family: inherit;
				}

				.search-input::placeholder {
					color: rgba(255, 255, 255, 0.4);
				}

				.search-dropdown {
					position: absolute;
					top: 100%;
					left: 0;
					right: 0;
					margin-top: 0.5rem;
					background: rgba(0, 0, 0, 0.95);
					border: 1px solid rgba(var(--accent), 0.3);
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
					color: rgba(255, 255, 255, 0.8);
					text-decoration: none;
					border-bottom: 1px solid rgba(255, 255, 255, 0.05);
					transition: all 0.2s ease;
					cursor: pointer;
				}

				.search-result:hover,
				.search-result.active {
					background: rgba(var(--accent), 0.1);
					color: rgb(var(--accent));
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
					color: rgba(255, 255, 255, 0.5);
				}

				.search-no-results {
					padding: 1rem;
					text-align: center;
					color: rgba(255, 255, 255, 0.5);
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
