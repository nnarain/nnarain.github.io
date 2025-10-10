# JSON Resume Integration

This repository now includes [JSON Resume](https://jsonresume.org/) integration for generating professional resumes.

## Files

- **`resume.json`** - The JSON Resume data file containing your professional information
- **`docker/resume/Dockerfile`** - Docker container for running JSON Resume CLI tools
- **`docker/resume/README.md`** - Detailed instructions for using the Docker container
- **`scripts/resume.sh`** - Helper script to easily build and use the resume generator

## Quick Start

### Option 1: Using Docker (Recommended)

1. Build the Docker image:
   ```bash
   ./scripts/resume.sh build
   ```

2. Generate HTML resume:
   ```bash
   ./scripts/resume.sh export resume.html
   ```

3. Preview your resume locally:
   ```bash
   ./scripts/resume.sh serve
   ```
   Then open http://localhost:4000

### Option 2: Using npm directly

If you have Node.js installed:

1. Install resume-cli globally:
   ```bash
   npm install -g resume-cli
   ```

2. Validate your resume:
   ```bash
   resume validate
   ```

3. Export to HTML:
   ```bash
   resume export resume.html
   ```

4. Preview locally:
   ```bash
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

1. Generate the HTML: `resume export resume.html`
2. Commit and push the generated `resume.html`
3. Access it at: `https://yourusername.github.io/resume.html`

The Resume link in the navigation bar will automatically point to `/resume/` which renders the `resume.md` page. To link to the JSON Resume HTML version instead, update the permalink in `resume.md` or create a redirect.

## Resources

- [JSON Resume Official Site](https://jsonresume.org/)
- [JSON Resume Schema](https://jsonresume.org/schema/)
- [JSON Resume Themes](https://jsonresume.org/themes/)
- [JSON Resume GitHub](https://github.com/jsonresume)
