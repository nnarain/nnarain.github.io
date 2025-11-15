# Search Page Implementation

This document describes the new interactive search and tag filtering functionality implemented for the Jekyll blog.

## Overview

The search page has been completely overhauled to provide a modern, interactive search experience with tag filtering capabilities. The implementation is fully static (no backend required) and works entirely in the browser.

## Key Features

### 🔍 Fuzzy Search
- Powered by Fuse.js for intelligent, fuzzy text matching
- Searches across post titles, content, and tags
- Weighted scoring (title: 2x, tags: 1.5x, content: 1x)
- Search as you type with 300ms debounce for performance
- Supports URL query parameters (e.g., `/search?query=voxel`)

### 🏷️ Tag Filtering
- Interactive tag buttons extracted from all posts
- Click to toggle tag filters on/off
- Multiple tag selection support
- Visual feedback with color changes and active states
- Filters work in combination with search

### 🎨 User Interface
- Clean, minimal design consistent with the blog aesthetic
- Tailwind CSS utility classes for styling
- Fully responsive mobile-first design
- Dark mode support with proper contrast
- Smooth transitions and animations
- Staggered fade-in effect for search results

### ⚡ Performance
- Client-side only (no server requests after initial load)
- Efficient fuzzy search with Fuse.js
- Debounced search input (300ms) to reduce unnecessary calculations
- Lazy rendering of results

## Architecture

### Files

1. **search.json** (Jekyll template)
   - Generates JSON data at build time
   - Contains all post metadata: title, url, tags, excerpt, content, date
   - Served as a static file

2. **search.html** (Jekyll page)
   - Main search page at `/search/`
   - Includes HTML structure and inline JavaScript
   - Uses Tailwind CSS for all styling

### Data Flow

```
Jekyll Build → search.json (static file)
                     ↓
User visits /search/ → Fetch search.json
                     ↓
              Initialize Fuse.js
                     ↓
              Display all posts + tags
                     ↓
User interacts → Filter & display results
```

## Implementation Details

### Search Algorithm
- Uses Fuse.js v6.6.2 from CDN
- Configuration:
  - Threshold: 0.3 (moderate fuzzy matching)
  - ignoreLocation: true (match anywhere in text)
  - minMatchCharLength: 2 (minimum 2 characters)

### Tag Filtering
- Tags are extracted dynamically from loaded posts
- Normalized to lowercase for consistent matching
- Multiple tags create an OR filter (post matches if it has ANY selected tag)
- When combined with search, both filters must pass (AND logic)

### State Management
```javascript
let posts = [];           // All posts from search.json
let fuse = null;          // Fuse.js instance
let activeTags = new Set(); // Currently selected tags
let currentSearchTerm = ''; // Current search query
```

### UI Components

1. **Search Input**
   - Text input with search icon
   - Debounced input handler (300ms)
   - Focus states with blue ring
   - Dark mode compatible

2. **Tag Buttons**
   - Dynamically generated from posts
   - Toggle between inactive (gray) and active (blue) states
   - Hover effects for better UX

3. **Clear Filters Button**
   - Appears when search term or tags are active
   - Resets all filters with smooth transition
   - Fades in/out based on state

4. **Results Display**
   - Post cards with title, date, excerpt, and tags
   - Hover effect (lift + shadow)
   - Staggered fade-in animation (50ms delay per card)
   - Responsive grid layout

5. **Results Count**
   - Shows number of matching posts
   - Fades in/out with results

6. **Empty States**
   - Loading spinner while fetching data
   - No results message with icon

## Styling

### Tailwind CSS
All styling uses Tailwind utility classes:
- Responsive: `md:`, `lg:` breakpoints
- Dark mode: `dark:` variant for all interactive elements
- Animations: `transition-all`, `duration-300`, custom fade-in
- Layout: Flexbox and Grid

### Custom CSS
Minimal custom CSS for:
- Line clamping (3 lines for excerpts)
- Fade-in animation keyframes

## Browser Support

- Modern browsers with ES6+ support
- CSS Grid and Flexbox
- localStorage API (for dark mode preference)
- Fetch API (for loading search.json)

## Testing

To test the search functionality:

1. **Search**:
   - Type in the search box
   - Results should update after 300ms
   - Try fuzzy matches (e.g., "voxl" should match "voxel")

2. **Tag Filtering**:
   - Click on a tag button (should turn blue)
   - Only posts with that tag should show
   - Click multiple tags (OR filtering)
   - Combine with search (AND filtering)

3. **Clear Filters**:
   - Activate search or tags
   - Click "Clear Filters"
   - All posts should show again

4. **Dark Mode**:
   - Toggle dark mode (top-right button)
   - All elements should have good contrast
   - Verify hover states work in both modes

5. **Mobile**:
   - Test on mobile viewport
   - Tags should wrap properly
   - Search input should be full width
   - Cards should stack vertically

6. **URL Parameters**:
   - Visit `/search?query=test`
   - Search should pre-populate with "test"

## Maintenance

### Adding New Features

To add new search capabilities:
1. Add fields to `search.json` Jekyll template
2. Update Fuse.js keys in `fuseOptions`
3. Modify `displayResults()` to show new fields

### Updating Styles

All styles use Tailwind classes. To change:
1. Find the element in `search.html`
2. Modify Tailwind utility classes
3. Test in both light and dark modes

## Migration Notes

### Removed
- Tag cloud visualization (canvas-based)
- Lunr.js search library
- Old search.js and tagcloud.js files
- Bootstrap-based search form
- "Browse by Tag" section with grouped lists

### Added
- search.json (Jekyll template)
- Fuse.js from CDN
- Modern Tailwind-based UI
- Interactive tag filtering
- Real-time search

### Preserved
- Dark mode support
- Mobile responsiveness
- Minimal aesthetic
- Fast, static-only operation

## Performance Considerations

- Initial load: ~1 request (search.json)
- Fuse.js: ~12KB gzipped from CDN
- search.json size: ~20KB for 100 posts (estimated)
- No additional requests after page load
- All filtering happens client-side

## Future Enhancements

Potential improvements (not implemented):
- [ ] Highlight search matches in results
- [ ] Keyboard navigation (arrow keys)
- [ ] Search history using localStorage
- [ ] Export search results
- [ ] Advanced filters (date range, etc.)
- [ ] Infinite scroll for large result sets
