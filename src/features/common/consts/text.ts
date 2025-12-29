/**
 * Text Constants
 * Centralized location for all user-facing text strings
 * Organized by feature area for easy maintenance and future i18n support
 */

// ============================================================================
// NAVIGATION
// ============================================================================

export const NAV = {
	quickLinks: {
		all: 'All',
		new: 'New',
	},
	viewAll: 'View all →',
	ariaLabels: {
		main: 'Main navigation',
		toggleSidebar: 'Toggle sidebar',
	},
} as const;

// ============================================================================
// SEARCH
// ============================================================================

export const SEARCH = {
	placeholder: 'Search resources...',
	ariaLabel: 'Search resources',
	noResults: (query: string) => `No results found for "${query}"`,
} as const;

// ============================================================================
// PAGES & ROUTES
// ============================================================================

export const PAGES = {
	home: {
		title: (count: number) => `Resources ${count}+ | Tools | Libraries | Illustrations | And More`,
		description:
			'Discover and explore curated resources including tools, libraries, design assets, and learning materials for web development.',
	},
	newResources: {
		title: 'New Resources | Recently Added Tools & Libraries',
		heading: 'New Resources',
		subtitle: 'Recently added tools, libraries, and design resources',
		noResults: 'No new resources available',
	},
	searchResults: {
		title: (query: string) => `Search results for "${query}"`,
		heading: 'Search Results',
		showing: (count: number) => `Showing all ${count} resources`,
		found: (count: number, query: string) => `Found ${count} results for "${query}"`,
		noResults: (query: string) => `No resources found for "${query}"`,
		backToHome: 'Back to homepage',
	},
} as const;

// ============================================================================
// HOMEPAGE SECTIONS
// ============================================================================

export const HOMEPAGE = {
	hero: {
		featuredBadge: 'Featured Resource',
	},
	popularResources: {
		heading: 'Popular Resources',
		badge: 'Hot',
		subtitle: 'Discover trending resources and collections',
	},
} as const;

// ============================================================================
// CARDS & COMPONENTS
// ============================================================================

export const CARDS = {
	collection: {
		badge: (count: number) => `Collection • ${count} items`,
		defaultDescription: 'Curated collection of resources',
	},
	resource: {
		ariaLabel: (name: string) => `${name} link`,
	},
	feature: {
		defaultCta: 'Learn more',
	},
} as const;

// ============================================================================
// CALL TO ACTION BUTTONS
// ============================================================================

export const CTA = {
	getStarted: 'Get Started',
	watchDemo: 'Watch Demo',
	viewCollection: 'View Collection',
	learnMore: 'Learn more',
} as const;

// ============================================================================
// PAGINATION
// ============================================================================

export const PAGINATION = {
	ariaLabel: 'pagination',
	previous: 'Go to previous page',
	next: 'Go to next page',
} as const;

// ============================================================================
// UI COMPONENTS
// ============================================================================

export const UI = {
	select: {
		ariaLabel: 'Select field',
		defaultPlaceholder: 'select',
	},
	carousel: {
		previous: 'Previous slide',
		next: 'Next slide',
		ariaLabel: 'Carousel navigation',
		goToSlide: (slideNumber: number) => `Go to slide ${slideNumber}`,
	},
	dialog: {
		close: 'Close dialog',
	},
} as const;
