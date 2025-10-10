# JSON Resume Docker Container

This directory contains a Dockerfile for generating HTML resumes from the `resume.json` file using [JSON Resume](https://jsonresume.org/).

## Building the Container

From the repository root, build the Docker image:

```bash
docker build -t resume-generator -f docker/resume/Dockerfile .
```

## Using the Container

### Generate HTML Resume

To export your resume as an HTML file:

```bash
docker run --rm -v $(pwd):/resume resume-generator export resume.html
```

This will create a `resume.html` file in the current directory.

### Serve Resume Locally

To preview your resume in a web browser:

```bash
docker run --rm -v $(pwd):/resume -p 4000:4000 resume-generator serve
```

Then open http://localhost:4000 in your browser.

### Validate Resume JSON

To validate your `resume.json` against the schema:

```bash
docker run --rm -v $(pwd):/resume resume-generator validate
```

### Use Different Themes

JSON Resume supports various themes. To use a specific theme:

```bash
docker run --rm -v $(pwd):/resume resume-generator export resume.html --theme elegant
```

Available themes include: `elegant`, `kendall`, `even`, `stackoverflow`, and many more.

## Available Commands

- `resume export [file]` - Export resume to HTML
- `resume serve` - Serve resume locally
- `resume validate` - Validate resume.json
- `resume --help` - Show all available commands

## More Information

For more details about JSON Resume and available themes, visit:
- [JSON Resume](https://jsonresume.org/)
- [JSON Resume Themes](https://jsonresume.org/themes/)
