#!/usr/bin/env bash
#
# Helper script to manage JSON Resume operations
# Usage: ./scripts/resume.sh [export|serve|validate]
#
# Note: This script requires resume-cli to be installed.
# If using the VSCode dev container, resume-cli is pre-installed.
# Otherwise, install with: npm install -g resume-cli
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check if resume-cli is installed
check_resume_cli() {
    if ! command -v resume &> /dev/null; then
        echo "Error: resume-cli is not installed."
        echo ""
        echo "To install resume-cli, run:"
        echo "  npm install -g resume-cli"
        echo ""
        echo "Or use the VSCode dev container which has it pre-installed."
        exit 1
    fi
}

# Install a theme if it's not available
install_theme() {
    local theme_name="$1"
    local package_name="jsonresume-theme-${theme_name}"
    
    echo "Checking if theme '${theme_name}' is installed..."
    
    # Check if theme is installed locally first, then globally
    if ! npm list "$package_name" &> /dev/null && ! npm list -g "$package_name" &> /dev/null; then
        echo "Theme '${theme_name}' not found. Installing locally..."
        if npm install "$package_name"; then
            echo "Successfully installed theme '${theme_name}'"
        else
            echo "Error: Failed to install theme '${theme_name}'"
            echo "Available themes include: elegant, class, flat, kendall, paper, stackoverflow"
            return 1
        fi
    else
        echo "Theme '${theme_name}' is already installed."
    fi
}

# Export resume to HTML
export_html() {
    check_resume_cli
    local output_file="${1:-resume.html}"
    local theme="${2:-}"
    
    echo "Exporting resume to $output_file..."
    cd "$REPO_ROOT"
    
    # Export to a temporary file first
    local temp_file="temp_resume.html"
    
    if [ -n "$theme" ]; then
        echo "Using theme: $theme"
        install_theme "$theme"
        resume export "$temp_file" -t "$theme"
    else
        echo "Using default theme"
        resume export "$temp_file"
    fi
    
    # Add Jekyll front matter and content
    echo "Adding Jekyll front matter for permalink support..."
    cat > "$output_file" << 'EOF'
---
layout: default
title: Resume
permalink: /resume/
---

EOF
    
    # For Jekyll integration, we need the complete HTML content
    # Since the theme generates a complete standalone page, we'll include it all
    # The Jekyll layout will handle the overall page structure
    cat "$temp_file" >> "$output_file"
    
    # Clean up temp file
    rm -f "$temp_file"
    
    echo "Resume exported to $output_file with Jekyll front matter"
}

# Serve resume locally
serve() {
    check_resume_cli
    local theme="${1:-}"
    
    echo "Starting resume server on http://localhost:4000"
    echo "Press Ctrl+C to stop..."
    cd "$REPO_ROOT"
    
    if [ -n "$theme" ]; then
        echo "Using theme: $theme"
        install_theme "$theme"
        resume serve -t "$theme"
    else
        echo "Using default theme"
        resume serve
    fi
}

# Validate resume.json
validate() {
    check_resume_cli
    echo "Validating resume.json..."
    cd "$REPO_ROOT"
    resume validate
    echo "Validation complete!"
}

# Show usage
usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  export [file] [theme]  Export resume to HTML with Jekyll front matter (default: resume.html)"
    echo "                         Generated file will be accessible at /resume/ permalink"
    echo "  serve [theme]          Serve resume locally on port 4000"
    echo "  validate               Validate resume.json against schema"
    echo "  help                   Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 export"
    echo "  $0 export resume.html"
    echo "  $0 export resume.html elegant"
    echo "  $0 serve"
    echo "  $0 serve elegant"
    echo "  $0 validate"
    echo ""
    echo "Available themes: elegant, class, flat, kendall, paper, stackoverflow"
    echo ""
    echo "Note: Requires resume-cli to be installed."
    echo "      Install with: npm install -g resume-cli"
    echo "      Or use the VSCode dev container which has it pre-installed."
}

# Main command dispatcher
case "${1:-help}" in
    export)
        export_html "$2" "$3"
        ;;
    serve)
        serve "$2"
        ;;
    validate)
        validate
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        echo "Unknown command: $1"
        echo ""
        usage
        exit 1
        ;;
esac
