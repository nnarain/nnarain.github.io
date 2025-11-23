# GitHub Pages Deployment

This site is deployed to GitHub Pages using a custom GitHub Actions workflow that builds the Jekyll site with custom plugins.

## How it Works

GitHub Pages normally builds Jekyll sites automatically, but it doesn't support custom plugins for security reasons. To use custom plugins (like the backlinks generator in `_plugins/backlinks_generator.rb`), we need to build the site ourselves and deploy the generated HTML.

### Deployment Process

1. **Trigger**: The workflow runs automatically on every push to the `main` branch, or can be triggered manually
2. **Build**: The workflow uses GitHub Actions to:
   - Check out the repository
   - Set up Ruby and install dependencies (via bundler)
   - Build the Jekyll site with all plugins enabled
   - Upload the built site as an artifact
3. **Deploy**: The workflow then deploys the built site to GitHub Pages

### Configuration

The workflow is defined in `.github/workflows/deploy-jekyll.yml` and:
- Uses the official GitHub Pages actions
- Sets the correct base path for the site
- Runs in production mode
- Handles concurrent deployments safely

### Repository Settings

To enable this workflow, the repository settings must be configured to:
1. Go to Settings → Pages
2. Under "Build and deployment", set Source to "GitHub Actions"

This allows the workflow to deploy directly to GitHub Pages without needing to push to a separate branch.

### Custom Plugins

The following custom plugins are enabled and will run during the build:
- **backlinks_generator.rb**: Automatically generates bidirectional links between posts

For more information about the backlinks feature, see [BACKLINKS.md](BACKLINKS.md).

## Manual Deployment

To manually trigger a deployment:
1. Go to the "Actions" tab in the GitHub repository
2. Select "Deploy Jekyll site to GitHub Pages"
3. Click "Run workflow"
4. Select the `main` branch and click "Run workflow"

## Local Development

To test the site locally with custom plugins:

```bash
bundle install
bundle exec jekyll serve
```

The site will be available at `http://localhost:4000`.
