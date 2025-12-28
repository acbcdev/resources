# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Astro-based web application for cataloging and browsing resources (tools, libraries, illustrations, etc.). The project uses React components within Astro, Tailwind CSS v4, and Starwind UI components for the component library.

## Development Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start local dev server (http://localhost:4321) |
| `pnpm build` | Build production site with type checking (`astro check && astro build`) |
| `pnpm preview` | Preview production build locally |
| `pnpm test` | Run tests with Vitest |
| `pnpm test:ui` | Run tests with Vitest UI |
| `pnpm astro` | Run Astro CLI commands |

## Architecture & Code Organization

### Directory Structure

- **`src/pages/`** - Astro file-based routing. Each `.astro` file becomes a route. Supports dynamic routes via `[param]` syntax.
- **`src/features/`** - Feature modules organized by domain
  - **`common/`** - Shared across the app
    - `components/` - Reusable Astro components (currently only ButtonUp.astro, moved from old structure)
    - `data/` - JSON data files (data.json, new.json, pending.json, backup.json) and index.ts that exports DATA
    - `layouts/` - Layout components (Layout.astro is the root layout with SEO, global styles, dark mode)
    - `lib/` - Utility functions (utils.ts, dom.ts)
    - `consts/` - Constants (categories, etc.)
    - `svg/` - SVG assets
  - **`ui/`** - Starwind UI component library (button, card, carousel, dialog, input, label, pagination, select, skeleton, textarea, tooltip). Each component has an index.ts for exports
  - **`resources/`** - Feature for resource display (card-item, components for rendering resources)
  - **`seo/`** - SEO component and metadata handling
  - **`types/`** - TypeScript type definitions (TARGETAUDIENCE, etc.)
  - **`categories/`** - Category-related code
  - **`collections/`** - Collection-related code
- **`src/styles/`** - Global CSS (globals.css referenced in Layout.astro)
- **`src/scripts/`** - Utility scripts for data processing (ai.ts, getOg.ts, screenshot.ts, tpm.ts)

### Key Architectural Patterns

1. **Data-First Approach**: Resource data is stored in JSON files (`src/features/common/data/`) and exported via index.ts. The app counts resources using `toHundreds()` util and filters by category.

2. **Layout System**: Layout.astro serves as the root template with:
   - Dark mode enabled by default (`class="dark"` on html tag)
   - CSS custom properties for accent colors
   - Global CSS resets and typography
   - SEO component integration via slot

3. **Component Library**: Starwind UI components (configured in `starwind.config.json`) are stored in `src/features/ui/` and can be used in Astro or React components.

4. **Routing Structure**:
   - `pages/index.astro` - Homepage with resource overview
   - `pages/[targetAudience]/` - Dynamic routes by target audience
   - `pages/categories/` - Category pages
   - `pages/collections/` - Collection pages
   - `pages/tags/` - Tag pages

### Technology Stack

- **Astro 5.14.1** - Framework with file-based routing and server-side rendering
- **React 19.2.0** - For interactive components (via @astrojs/react integration)
- **Tailwind CSS v4** - Utility-first CSS (uses @tailwindcss/vite plugin)
- **Starwind** - Component library built on Tailwind (11 components configured)
- **Tabler Icons React 3.36.0** - Icon library with React components
- **TypeScript 5.9.3** - Strict mode enabled
- **Vitest 3.2.4** - Testing framework with UI mode
- **Prettier 3.6.2** - Code formatting (with astro plugin)

### Configuration Notes

- **Path Aliases**: `@/*` maps to `src/*` (configured in tsconfig.json and vitest.config.ts)
- **Tailwind**: Configured via @tailwindcss/vite plugin in astro.config.mjs
- **JSX**: React JSX with `jsxImportSource` set to "react"
- **Dark Mode**: Default theme (html `class="dark"`)
- **CSS Variables**: Starwind uses CSS variables for theming (baseColor: zinc)

## Common Development Tasks

### Using Tabler Icons

Icons are imported from `@tabler/icons-react`. Use in Astro components by importing the needed icons and rendering them in JSX/Astro markup. Example:

```astro
---
import { IconApps, IconClock } from '@tabler/icons-react';
---

<IconApps size={20} stroke={1.5} slot="icon" />
```

Common icon options:
- `size` - Icon size in pixels (default: 24)
- `stroke` - Stroke width (default: 2)
- `color` - Icon color (inherits from currentColor by default)

Browse available icons at [tabler-icons.io](https://tabler-icons.io).

### Adding a New UI Component from Starwind

Components are configured in `starwind.config.json` and stored in `src/features/ui/{component}/`. Each component has an index.ts for exports. Use the Starwind CLI to add new versions of components.

### Adding Resource Data

Resource data is stored in `src/features/common/data/data.json`. Export it via `src/features/common/data/index.ts`. The app automatically counts and filters resources by category.

### Creating New Pages

Add `.astro` files to `src/pages/` for new routes. Use `src/features/common/layouts/Layout.astro` as your layout. Import utilities and data from `src/features/common/`.

### Running Type Checks

The build command includes `astro check` which validates TypeScript. Running `pnpm build` will catch type errors before deployment.

## Code Style Guidelines

### TypeScript/JavaScript

- Keep functions single-purpose unless composable or reusable
- DO NOT do unnecessary destructuring
- AVOID `else` statements - use early returns instead
- AVOID `try`/`catch` where possible
- AVOID using `any` type - use proper typing
- AVOID `let` - prefer `const`
- PREFER single word variable names where clarity allows

### Styling

- **Always use Tailwind** - no custom CSS unless absolutely necessary
- **Minimalistic design** - clean, Apple-inspired aesthetics
- **Smooth transitions** - use `transition-colors`, `duration-200` for subtle animations
- **Subtle hover states** - prefer `hover:bg-muted/50` over dramatic color changes
- **Consistent spacing** - use Tailwind spacing scale (`p-4`, `gap-3`, etc.)
- **Use CSS variables** - reference design system tokens (`var(--primary)`, `var(--muted)`)
- **Rounded corners** - prefer `rounded-lg` or `rounded-xl` for modern feel

### Component Patterns

```astro
// Good - early return, const, minimal
const items = Astro.props.items;
if (!items) return null;

// Bad - unnecessary else, let
let result;
if (items) {
  result = items;
} else {
  result = null;
}
```

## Code Quality & Formatting

- **Prettier**: Run formatting with Prettier (configured for tabs, 100 char width)
- **Astro Plugin**: prettier-plugin-astro is configured for .astro files
- **Type Checking**: Strict TypeScript mode enabled

## Testing

Tests are configured to run with Vitest. Currently no test files exist in the codebase (no *.test.ts or *.spec.ts files found). Tests would use path alias `@/` to reference src files.

## Scripts & Utilities

- **`src/scripts/ai.ts`** - AI integration script (likely for content generation/enhancement)
- **`src/scripts/getOg.ts`** - Open Graph image generation
- **`src/scripts/screenshot.ts`** - Screenshot capture utility (likely for resource previews)
- **`src/scripts/tpm.ts`** - Unknown utility
- **`src/features/common/lib/utils.ts`** - Helper functions (slugify, toHundreds, etc.)
- **`src/features/common/lib/dom.ts`** - DOM manipulation utilities
