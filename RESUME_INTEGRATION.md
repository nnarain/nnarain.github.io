# JSON Resume Integration

This repository includes [JSON Resume](https://jsonresume.org/) integration for generating professional resumes.

## Files

- **`resume.json`** - The JSON Resume data file containing your professional information
- **`scripts/resume.sh`** - Helper script to easily manage resume operations
- **`.devcontainer/Dockerfile`** - VSCode dev container with resume-cli pre-installed

## Quick Start

### Option 1: Using VSCode Dev Container (Recommended)

The VSCode dev container comes with resume-cli pre-installed, making it the easiest option.

1. Open the repository in VSCode with the Dev Containers extension
2. VSCode will prompt to reopen in container - click "Reopen in Container"
3. Once inside the container, use the helper script:

   ```bash
   # Validate your resume
   ./scripts/resume.sh validate
   
   # Export to HTML
   ./scripts/resume.sh export resume.html
   
   # Preview locally
   ./scripts/resume.sh serve
   ```
   Then open http://localhost:4000

### Option 2: Using npm directly

If you have Node.js installed locally:

1. Install resume-cli globally:
   ```bash
   npm install -g resume-cli
   ```

2. Use the helper script or resume-cli directly:
   ```bash
   # Using the helper script
   ./scripts/resume.sh export resume.html
   
   # Or use resume-cli directly
   resume export resume.html
   resume serve
   ```

## Editing Your Resume

The resume data is stored in `resume.json` at the repository root. Edit this file to update your resume information. The file follows the [JSON Resume Schema](https://jsonresume.org/schema/).

Key sections include:
- **basics** - Name, contact info, summary, location
- **work** - Work experience
- **education** - Educational background
- **skills** - Technical skills and proficiencies
- **projects** - Personal and professional projects
- **interests** - Hobbies and interests

## Themes

JSON Resume supports various themes. To use a different theme:

```bash
resume export resume.html --theme <theme-name>
```

Popular themes:
- `elegant` - Clean and professional
- `kendall` - Modern and colorful
- `even` - Minimalist design
- `stackoverflow` - Technical focus

Browse all themes at: https://jsonresume.org/themes/

## Publishing

### GitHub Pages

To make your resume available on your GitHub Pages site:

1. Generate the HTML: `./scripts/resume.sh export resume.html`
2. Commit and push the generated `resume.html`
3. Access it at: `https://yourusername.github.io/resume.html`

The Resume link in the navigation bar will automatically point to `/resume/` which renders the `resume.md` page. To link to the JSON Resume HTML version instead, update the permalink in `resume.md` or create a redirect.

## Resources

- [JSON Resume Official Site](https://jsonresume.org/)
- [JSON Resume Schema](https://jsonresume.org/schema/)
- [JSON Resume Themes](https://jsonresume.org/themes/)
- [JSON Resume GitHub](https://github.com/jsonresume)
