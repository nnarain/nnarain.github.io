# Setup Instructions for GitHub Pages Deployment

This repository now includes a GitHub Actions workflow that automatically builds and deploys the Jekyll site with custom plugins enabled.

## One-Time Setup Required

To enable the automated deployment workflow, you need to configure the repository settings:

### Steps:

1. **Go to Repository Settings**
   - Navigate to your repository on GitHub
   - Click on "Settings" tab

2. **Configure GitHub Pages**
   - In the left sidebar, click on "Pages" (under "Code and automation")
   - Under "Build and deployment":
     - Set **Source** to: **GitHub Actions**
   
   This tells GitHub Pages to use our custom workflow instead of the default Jekyll build process.

3. **Verify the Workflow**
   - Go to the "Actions" tab
   - You should see the "Deploy Jekyll site to GitHub Pages" workflow
   - It will automatically run on the next push to the `main` branch

## How It Works

- **Automatic Deployment**: Every push to the `main` branch triggers the workflow
- **Manual Deployment**: You can also trigger deployments manually from the Actions tab
- **Custom Plugins**: All Jekyll plugins in `_plugins/` directory will be executed during the build
- **Production Build**: The site is built with `JEKYLL_ENV=production` for optimal performance

## Workflow Details

The workflow performs these steps:
1. Checks out the repository code
2. Sets up Ruby and installs dependencies via Bundler
3. Builds the Jekyll site with all custom plugins
4. Uploads the built site as an artifact
5. Deploys the artifact to GitHub Pages

## Testing Locally

To test the site locally with custom plugins:

```bash
bundle install
bundle exec jekyll serve
```

The site will be available at `http://localhost:4000`.

## Custom Plugins

This setup enables the use of custom Jekyll plugins, including:
- **Backlinks Generator** (`_plugins/backlinks_generator.rb`): Automatically creates bidirectional links between posts

For more details, see the [deployment documentation](docs/GITHUB_PAGES_DEPLOYMENT.md).

## Troubleshooting

If the deployment fails:
1. Check the Actions tab for error messages
2. Ensure the Gemfile includes all necessary dependencies
3. Verify that the `main` branch is up to date
4. Check that the workflow file is valid YAML

For more information about GitHub Actions and GitHub Pages, see:
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
