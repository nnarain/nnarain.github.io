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

# Export resume to HTML
export_html() {
    check_resume_cli
    local output_file="${1:-resume.html}"
    echo "Exporting resume to $output_file..."
    cd "$REPO_ROOT"
    resume export "$output_file"
    echo "Resume exported to $output_file"
}

# Serve resume locally
serve() {
    check_resume_cli
    echo "Starting resume server on http://localhost:4000"
    echo "Press Ctrl+C to stop..."
    cd "$REPO_ROOT"
    resume serve
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
    echo "  export [file]  Export resume to HTML (default: resume.html)"
    echo "  serve          Serve resume locally on port 4000"
    echo "  validate       Validate resume.json against schema"
    echo "  help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 export"
    echo "  $0 export resume.html"
    echo "  $0 serve"
    echo "  $0 validate"
    echo ""
    echo "Note: Requires resume-cli to be installed."
    echo "      Install with: npm install -g resume-cli"
    echo "      Or use the VSCode dev container which has it pre-installed."
}

# Main command dispatcher
case "${1:-help}" in
    export)
        export_html "$2"
        ;;
    serve)
        serve
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
