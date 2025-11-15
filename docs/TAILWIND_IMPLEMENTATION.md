# Tailwind CSS Implementation

This document describes the Tailwind CSS implementation for the blog.

## Overview

The blog has been modernized with Tailwind CSS while preserving the minimal, clean aesthetic. The implementation uses **Tailwind CSS Play CDN**, which means no build process is required - it's a pure static site deployment.

## Key Features

### 🎨 Dark Mode Support
- Fully functional dark/light mode toggle button (top-right corner)
- Theme preference is saved in localStorage
- All pages and components support both themes
- Smooth transitions when switching themes

### 📱 Responsive Design
- Mobile-first approach
- Responsive navigation that adapts to screen size
- Grid layouts that stack on mobile devices

### ✨ Hover Animations
- Blog post titles expand their underline on hover
- Card components lift slightly on hover
- Navigation links fade in on hover
- Smooth transitions throughout

### 🎯 Pages Updated
- **Home/Blog Listing**: Blog posts with hover effects and tag badges
- **Individual Posts**: Clean reading experience with proper typography
- **Makes**: Grid layout with card-based design
- **Search**: Updated styles for dark mode compatibility
- **Navigation**: Responsive header with theme toggle
- **Footer**: Simple, minimal footer

## Technical Details

### Tailwind CSS CDN
```html
<script src="https://cdn.tailwindcss.com"></script>
```

The site uses Tailwind's Play CDN which:
- Requires no build process
- Works as a static site
- Supports custom configuration
- Perfect for Jekyll deployment

### Custom Configuration
Tailwind is configured inline with custom colors and fonts:
```javascript
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#4a9ae1',
      },
      fontFamily: {
        serif: ['Libre Baskerville', 'Times New Roman', 'Times', 'serif'],
        sans: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
}
```

### Files Modified
- `_includes/css.html` - Added Tailwind CDN and removed Bootstrap
- `_includes/footer.html` - Added Tailwind classes
- `_layouts/default.html` - Complete rewrite with Tailwind and dark mode toggle
- `_layouts/post.html` - Styled with Tailwind prose classes
- `_layouts/makes.html` - Styled with Tailwind
- `index.html` - Blog listing with Tailwind classes
- `makes.html` - Grid layout with Tailwind
- `static/css/custom.css` - Minimal custom CSS for dark mode tweaks
- `static/css/syntax.css` - Updated for light/dark mode syntax highlighting
- `static/css/search.scss` - Updated for dark mode support

### Dark Mode Toggle
The theme toggle is implemented with vanilla JavaScript:
- Detects user's saved preference from localStorage
- Toggles the `dark` class on the `<html>` element
- Updates icons based on current theme
- Persists choice across page loads

## Deployment

This implementation is **deployment-ready** as a static site:
1. No build process required
2. No npm dependencies
3. Pure Jekyll static site generation
4. CDN-based Tailwind CSS
5. Works on GitHub Pages without modifications

## Color Palette

### Light Mode
- Background: White (#ffffff)
- Text: Gray-700 (#374151)
- Headings: Gray-800 (#1f2937)
- Primary Links: Blue (#4a9ae1)

### Dark Mode
- Background: Gray-900 (#111827)
- Text: Gray-300 (#d1d5db)
- Headings: Gray-200 (#e5e7eb)
- Primary Links: Blue (#4a9ae1)

## Browser Support

The implementation supports all modern browsers with:
- CSS Grid
- CSS Flexbox
- localStorage API
- ES6 JavaScript

## Notes

- The resume page (`resume.html`) maintains its own Bootstrap-based layout as it's a standalone page
- Syntax highlighting supports both light and dark themes with distinct color schemes
- All hover effects use smooth transitions for a polished feel
- The minimal aesthetic has been preserved while adding modern interactions
