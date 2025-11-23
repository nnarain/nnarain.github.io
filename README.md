# Natesh's Dev Blog

Personal blog built with Jekyll, featuring custom plugins and automated deployment to GitHub Pages.

🌐 **Live Site**: [https://nnarain.github.io](https://nnarain.github.io)

## Features

- **Custom Backlinks**: Automatic bidirectional linking between related posts
- **Multiple Collections**: Blog posts, projects, tutorials, and makes
- **Search Functionality**: Full-text search across all content
- **Responsive Design**: Mobile-friendly layout
- **Syntax Highlighting**: Code snippets with Rouge
- **Pagination**: Blog posts paginated for better navigation

## Custom Plugins

This blog uses custom Jekyll plugins that require building the site with GitHub Actions:

- **Backlinks Generator**: Automatically detects internal links and creates backlinks on target posts. See [docs/BACKLINKS.md](docs/BACKLINKS.md) for details.

## Getting Started

### Prerequisites

- Ruby 3.1 or higher
- Bundler

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/nnarain/nnarain.github.io.git
   cd nnarain.github.io
   ```

2. Install dependencies:
   ```bash
   bundle install
   ```

3. Run the development server:
   ```bash
   bundle exec jekyll serve
   ```

4. Open your browser to `http://localhost:4000`

## Deployment

This site is automatically deployed to GitHub Pages using GitHub Actions. See [SETUP.md](SETUP.md) for configuration instructions.

### How Deployment Works

- Every push to `main` triggers an automated build and deployment
- The workflow builds Jekyll with all custom plugins enabled
- The generated site is deployed to GitHub Pages
- See [docs/GITHUB_PAGES_DEPLOYMENT.md](docs/GITHUB_PAGES_DEPLOYMENT.md) for details

## Documentation

- [Backlinks Feature](docs/BACKLINKS.md)
- [GitHub Pages Deployment](docs/GITHUB_PAGES_DEPLOYMENT.md)
- [Setup Instructions](SETUP.md)
- [Projects Documentation](docs/PROJECTS_DOCUMENTATION.md)
- [Resume Integration](docs/RESUME_INTEGRATION.md)
- [Search Implementation](docs/SEARCH_IMPLEMENTATION.md)
- [Tailwind Implementation](docs/TAILWIND_IMPLEMENTATION.md)

## Project Structure

```
.
├── _config.yml           # Jekyll configuration
├── _data/               # Data files
├── _includes/           # Reusable components
├── _layouts/            # Page layouts
├── _plugins/            # Custom Jekyll plugins
├── _posts/              # Blog posts
├── _projects/           # Project showcase
├── _makes/              # Maker projects
├── _sass/               # Stylesheets
├── assets/              # Static assets (images, js, css)
├── docs/                # Documentation
└── .github/workflows/   # GitHub Actions workflows
```

## Contributing

This is a personal blog, but if you notice any issues or have suggestions, feel free to open an issue.

## License

Content © Natesh Narain. All rights reserved.

Code is available for reference but please don't copy the entire blog structure.
