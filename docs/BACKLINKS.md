# Automatic Backlinks

This blog automatically generates backlinks between posts. When a post links to another post, the target post will display a "Posts that link here" section showing all posts that reference it.

## How It Works

The backlinks system is implemented through a Jekyll plugin (`_plugins/backlinks_generator.rb`) that runs during site generation.

### Detection Methods

The plugin scans post content for two types of internal links:

1. **Jekyll `post_url` tags**: `{% post_url 2024-04-01-Icarus April 2024 Update %}`
2. **Direct markdown/HTML links**: `[link text](/2024/04/01/post-name.html)`

### Automatic Processing

During build time, the plugin:
1. Scans all post content for internal links
2. Identifies the target posts being linked to
3. Automatically adds backlink metadata to target posts
4. Sorts backlinks by date (newest first)

### Display

Backlinks are displayed at the bottom of each post (before the navigation section) in the `post.html` layout. The section only appears if the post has at least one backlink.

## Usage

Simply use Jekyll's `post_url` tag when linking to other posts in your blog:

```markdown
In my [previous post]({% post_url 2024-04-01-Icarus April 2024 Update %}) I mentioned...
```

The backlink will be automatically generated and displayed on the target post.

## Benefits

- **Bidirectional navigation**: Readers can easily find related content
- **Content discovery**: Shows which newer posts reference older content
- **Zero maintenance**: No manual metadata management required
- **Consistent styling**: Matches the existing design system

## Implementation Details

- **Plugin**: `_plugins/backlinks_generator.rb`
- **Layout**: `_layouts/post.html`
- **Priority**: Runs at lowest priority to ensure all posts are processed
- **Data structure**: Backlinks stored in `page.backlinks` array with `url`, `title`, and `date` fields
