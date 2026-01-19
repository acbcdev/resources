# Resource Data Enrichment Pipeline

A robust 4-step pipeline for enriching resource URLs with metadata using web scraping, AI, and screenshots.

## Overview

This pipeline transforms raw URLs into richly annotated resource entries by:

1. **Extracting Open Graph metadata** from websites
2. **Enriching with AI-generated metadata** (categories, features, tags, etc.)
3. **Capturing screenshots** as fallback images
4. **Merging results** with manual review before database insertion

## Architecture

```
new.json (URLs)
    ↓
[1] 1-extract-og.ts → ogData.json
    ↓
[2] 2-enrich-ai.ts → aiEnriched.json
    ↓
[3] 3-capture-screenshots.ts → withScreenshots.json
    ↓
[4] 4-merge-data.ts → Preview for manual merge
```

### Output Locations

- **Script outputs**: `src/data/scripts-output/`
- **Screenshots**: `public/screenshots/`

## Prerequisites

### Required

- **Bun runtime** (tested with recent versions)
- **Playwright** for browser automation (`bunx playwright install chromium`)

### API Keys (Environment Variables)

Create a `.env` file in the project root with:

```bash
# Google Gemini (for AI enrichment)
GOOGLE_API_KEY=your_google_api_key

# Mistral (for AI enrichment)
MISTRAL_API_KEY=your_mistral_api_key

# Groq (for AI enrichment)
GROQ_API_KEY=your_groq_api_key
```

Get API keys from:

- [Google AI Studio](https://ai.google.dev)
- [Mistral Console](https://console.mistral.ai)
- [Groq Console](https://console.groq.com)

## Quick Start

### 1. Install Dependencies

```bash
# Install Playwright browsers
bunx playwright install chromium

# Ensure you have API keys set
export GOOGLE_API_KEY=...
export MISTRAL_API_KEY=...
export GROQ_API_KEY=...
```

### 2. Run the Pipeline

```bash
# Step 1: Extract Open Graph metadata
bun run src/scripts/1-extract-og.ts

# Step 2: Enrich with AI
bun run src/scripts/2-enrich-ai.ts

# Step 3: Capture screenshots
bun run src/scripts/3-capture-screenshots.ts

# Step 4: Preview and merge
bun run src/scripts/4-merge-data.ts
```

### 3. Manual Merge

After reviewing the output from step 4:

1. Copy the new resources from the preview
2. Paste them into `src/data/data.json`
3. Save and commit

## Detailed Script Documentation

### Step 1: Extract Open Graph Metadata

**File**: `1-extract-og.ts`

**Purpose**: Extract website metadata using the Open Graph protocol

**Input**:

- `src/data/new.json` - Array of URL strings to process

**Output**:

- `src/data/scripts-output/ogData.json` - Resources with OG metadata
- `src/data/scripts-output/backupOG.json` - Incremental backup

**What it does**:

1. Launches a single shared Chromium browser instance (for performance)
2. Navigates to each URL
3. Extracts OG metadata (title, description, image, icon, etc.)
4. Falls back to HTML title/description tags if OG tags missing
5. Saves incrementally to enable resume on failure

**Performance**:

- ~3-5 seconds per URL (network dependent)
- Reuses browser instance for 10-100x speedup

**Resume Capability**:

- Automatically skips URLs already in backupOG.json
- Can restart after network failures

### Step 2: Enrich with AI

**File**: `2-enrich-ai.ts`

**Purpose**: Generate structured metadata using AI

**Input**:

- `src/data/scripts-output/ogData.json` - Resources with OG metadata

**Output**:

- `src/data/scripts-output/aiEnriched.json` - Resources with AI metadata
- `src/data/scripts-output/backupAI.json` - Incremental backup

**What it does**:

1. Fetches website content (text only, first 1500 chars)
2. Uses AI (randomly selected from Google/Mistral/Groq) to analyze content
3. Generates:
   - **name**: Resource title
   - **description**: 1-2 sentence description
   - **category**: One of 42 predefined categories
   - **topic**: Secondary subject
   - **main_features**: 3-5 key features
   - **tags**: 5-10 relevant keywords
   - **targetAudience**: Who should use this (Developers, Designers, etc.)
   - **pricing**: Free, Paid, Freemium, or Open Source
4. Merges AI data with OG metadata
5. Saves incrementally to enable resume

**AI Model Selection**:

- Randomly selected to distribute load
- Configurable in `scripts.config.ts` (weights: 40% Google, 30% Mistral, 30% Groq)
- Falls back to defaults if generation fails

**Performance**:

- ~5-10 seconds per resource (API dependent)
- Parallel API calls improve throughput

**Resume Capability**:

- Automatically skips resources already in backupAI.json
- Uses default values if AI generation fails

### Step 3: Capture Screenshots

**File**: `3-capture-screenshots.ts`

**Purpose**: Capture screenshots as fallback images

**Input**:

- `src/data/scripts-output/aiEnriched.json` - AI-enriched resources

**Output**:

- `src/data/scripts-output/withScreenshots.json` - Resources with images
- `src/data/scripts-output/backupScreenshots.json` - Incremental backup
- `public/screenshots/*.jpg` - Screenshot files

**What it does**:

1. Checks if resource has OG image (uses if available)
2. If no OG image, captures Playwright screenshot
3. Saves screenshots with safe filenames based on domain + URL hash
4. Updates `image` field with public path (`/screenshots/...`)
5. Marks image source (OG vs screenshot)

**Screenshot Details**:

- Format: JPEG (quality: 80%)
- Size: 1280x720 viewport
- Files saved to public directory for web serving
- Safe filenames prevent conflicts (using SHA256 hash)

**Performance**:

- ~3-5 seconds per screenshot (browser dependent)
- Reuses browser instance for performance
- Skips screenshots for resources with OG images

**Resume Capability**:

- Automatically skips resources already in backupScreenshots.json
- Gracefully handles sites that block Playwright

### Step 4: Merge with Manual Review

**File**: `4-merge-data.ts`

**Purpose**: Prepare final data for manual review and merge

**Input**:

- `src/data/scripts-output/withScreenshots.json` - Final processed resources
- `src/data/data.json` - Existing resources

**Output**:

- STDOUT: JSON preview for manual review
- Temporary file: `src/data/scripts-output/merged-preview-*.json`

**What it does**:

1. Loads processed resources from step 3
2. Loads existing data.json for duplicate detection
3. Normalizes URLs for comparison (ignores query params, trailing slashes)
4. Identifies duplicates vs new resources
5. Adds timestamps (createdAt, updatedAt)
6. Outputs JSON to STDOUT
7. Prints merge instructions
8. **Does NOT auto-write to data.json** (safety measure)

**Why Manual Review?**:

- Prevents accidental data corruption
- Allows human verification of AI-generated data
- Detects edge cases and duplicate handling issues

**Merge Instructions**:
The script will output:

```
1. Review the new resources shown above
2. Copy the new resources
3. Add them to the beginning of data.json
4. Save and commit
```

## Configuration

All settings are in `src/scripts/config/scripts.config.ts`:

### Browser Settings

```typescript
browser: {
  headless: true,              // Run browser without UI
  timeout: 10000,              // Timeout in ms
  viewport: { width: 1280, height: 720 }
}
```

### Network Settings

```typescript
network: {
  fetchTimeout: 10000,         // Network request timeout
  retryMaxAttempts: 3,         // Retry failed requests
  retryInitialDelay: 1000,     // Exponential backoff
}
```

### AI Settings

```typescript
ai: {
  temperature: 0.7,            // Creativity (0-1)
  maxContentLength: 1500,      // Max characters to send to AI
  models: {
    google: 'gemini-1.5-flash', // Model names
    mistral: 'mistral-small-latest',
    groq: 'mixtral-8x7b-32768',
  },
  modelWeights: {
    google: 0.4,   // 40% chance of selection
    mistral: 0.3,  // 30% chance
    groq: 0.3,     // 30% chance
  }
}
```

### Screenshot Settings

```typescript
screenshot: {
  enabled: true,
  format: 'jpeg',
  quality: 80,     // 0-100
  maxSize: 1048576 // 1MB
}
```

### Processing Settings

```typescript
processing: {
  batchSize: 10,              // Progress update frequency
  resumeFromBackup: true,     // Skip already-processed URLs
  deletePartialBackups: false // Keep for debugging
}
```

## Troubleshooting

### "Chromium not found"

```bash
bunx playwright install chromium
```

### "API key not found"

Set environment variables:

```bash
export GOOGLE_API_KEY=...
export MISTRAL_API_KEY=...
export GROQ_API_KEY=...
```

Or create `.env` file:

```
GOOGLE_API_KEY=your_key
MISTRAL_API_KEY=your_key
GROQ_API_KEY=your_key
```

### Script stuck on a URL

- Check network connectivity
- Try increasing timeout in `scripts.config.ts`
- Some sites block Playwright (script will skip them)

### AI generation failing

- Check API key validity
- Check API quota/limits
- Verify network connectivity
- Script falls back to defaults if AI fails

### Low quality screenshots

- Adjust `screenshot.quality` in config (0-100)
- Some sites don't render well in headless browsers
- This is expected for heavily JavaScript-dependent sites

### Resuming after interruption

All scripts support resume:

1. Fix the issue (network, API key, etc.)
2. Run the same script again
3. It will skip already-processed URLs and continue

## Data Structure

### ogData.json

```json
[
  {
    "url": "https://example.com",
    "og": {
      "title": "Example",
      "description": "...",
      "image": "https://...",
      "icon": "https://..."
    },
    "extracted_at": "2024-01-01T00:00:00Z"
  }
]
```

### aiEnriched.json

```json
[
  {
    "url": "https://example.com",
    "og": {
      /* ... */
    },
    "name": "Example",
    "description": "Description",
    "category": "Tools",
    "topic": "Development",
    "main_features": [{ "feature": "Feature 1", "description": "..." }],
    "tags": ["tag1", "tag2"],
    "targetAudience": ["Developers"],
    "pricing": "Free",
    "enriched_at": "2024-01-01T00:00:00Z"
  }
]
```

### withScreenshots.json

```json
[
  {
    "url": "https://example.com",
    "og": {
      /* ... */
    },
    "name": "Example",
    "category": "Tools",
    /* ... all AI fields ... */
    "image": "/screenshots/example-com-abc123.jpg",
    "image_source": "screenshot",
    "screenshot_at": "2024-01-01T00:00:00Z"
  }
]
```

## Advanced Usage

### Process a Single URL

```bash
# Edit new.json with single URL
echo '["https://example.com"]' > src/data/new.json

# Run pipeline
bun run src/scripts/1-extract-og.ts
bun run src/scripts/2-enrich-ai.ts
bun run src/scripts/3-capture-screenshots.ts
bun run src/scripts/4-merge-data.ts
```

### Custom AI Model Selection

Edit `scripts.config.ts`:

```typescript
modelWeights: {
  google: 1.0,   // Always use Google
  mistral: 0,
  groq: 0,
}
```

### Disable Screenshots

Edit `scripts.config.ts`:

```typescript
screenshot: {
  enabled: false;
}
```

### Increase Timeout for Slow Sites

Edit `scripts.config.ts`:

```typescript
browser: {
  timeout: 20000; // 20 seconds
}
```

## Performance Tips

1. **Use free AI tier wisely** - Each resource costs API calls
2. **Batch small URLs first** - Test with 5-10 URLs before processing 100+
3. **Monitor API quotas** - Check your API provider limits
4. **Use private network** - Faster than public WiFi
5. **Run during off-peak** - Less contention on APIs

## Safety Considerations

- Scripts validate all input with Zod schemas
- Browser runs in headless mode (no UI)
- Screenshots saved to public directory (remember privacy)
- API keys stored in environment variables (not committed)
- Manual review before database write (no auto-corruption)

## Debugging

### Enable debug output

```bash
DEBUG=true bun run src/scripts/1-extract-og.ts
```

### Check intermediate files

```bash
ls -lh src/data/scripts-output/
jq '.[] | {url, og}' src/data/scripts-output/ogData.json | head
```

### Inspect a failing resource

Search for URL in backup files:

```bash
jq '.[] | select(.url == "https://...")' src/data/scripts-output/backupOG.json
```

## Support

For issues:

1. Check troubleshooting section above
2. Enable debug mode for detailed logs
3. Check file sizes and counts: `ls -lh src/data/scripts-output/`
4. Verify API keys are correct and have quota
5. Try running with a single URL first

## Future Improvements

- [ ] Parallel processing for faster throughput
- [ ] Custom category definitions per site
- [ ] Webhook integration for automation
- [ ] Database auto-merge with conflict detection
- [ ] Progress dashboard/UI
- [ ] Scheduled runs with cron
