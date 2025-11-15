# Projects Collection Documentation

This document explains the projects collection feature and how to use it.

## Overview

The projects collection allows you to showcase your projects with rich content including:
- Project descriptions
- Image carousels
- GitHub repository links
- Tags/categories
- Related blog posts

## Adding a New Project

1. Create a new markdown file in the `_projects` directory
2. Use the following front matter template:

```yaml
---
layout: projects
name: Project Name
repo_url: https://github.com/username/repo
description: A brief description of the project (1-2 sentences)
date: YYYY-MM-DD
tags: ["Tag1", "Tag2", "Tag3"]
images:
  - /path/to/image1.jpg
  - /path/to/image2.jpg
  - /path/to/image3.jpg
project_id: unique-project-identifier
order: 1
---

## Detailed Content

Add detailed project content here using markdown.
```

### Front Matter Fields

- **layout**: Must be `projects` to use the project detail page layout
- **name**: The display name of the project
- **repo_url**: URL to the GitHub repository (optional)
- **description**: A brief description shown on the projects listing page
- **date**: Project date (used for sorting)
- **tags**: Array of tags/technologies used
- **images**: Array of image paths for the carousel (at least one recommended)
- **project_id**: Unique identifier used to link blog posts to this project
- **order**: Display order on the projects page (lower numbers appear first)

## Linking Blog Posts to Projects

To link a blog post to a project, add the `project_id` field to the post's front matter:

```yaml
---
layout: post
title: My Post Title
tag: ["tag1", "tag2"]
project_id: unique-project-identifier
---
```

The project detail page will automatically display all posts with matching `project_id` in the "Related Posts" section.

## Image Carousel

Projects with multiple images in the `images` array will automatically display:
- Navigation arrows
- Indicator dots
- Auto-advance (every 5 seconds)
- Click to pause

## Project Listing Features

The projects index page (`/projects/`) includes:
- Infinite scroll style with fade-in animations
- Image carousels for each project
- Links to GitHub repositories
- Tags display
- Modern, minimal design
- Dark mode support

## File Structure

```
_projects/
  ├── project-name.md
  └── another-project.md

static/projects/
  ├── image1.jpg
  └── image2.jpg
```

## Example Project

See `_projects/gameboy-emulator.md` for a complete example.
