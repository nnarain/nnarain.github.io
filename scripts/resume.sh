#!/usr/bin/env bash
#
# Helper script to build and run the JSON Resume Docker container
# Usage: ./scripts/resume.sh [build|export|serve|validate]
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCKER_IMAGE="resume-generator"

# Build the Docker image
build() {
    echo "Building resume generator Docker image..."
    docker build -t "$DOCKER_IMAGE" -f "$REPO_ROOT/docker/resume/Dockerfile" "$REPO_ROOT"
    echo "Build complete!"
}

# Export resume to HTML
export_html() {
    local output_file="${1:-resume.html}"
    echo "Exporting resume to $output_file..."
    docker run --rm -v "$REPO_ROOT:/resume" "$DOCKER_IMAGE" export "/resume/$output_file"
    echo "Resume exported to $output_file"
}

# Serve resume locally
serve() {
    echo "Starting resume server on http://localhost:4000"
    echo "Press Ctrl+C to stop..."
    docker run --rm -v "$REPO_ROOT:/resume" -p 4000:4000 "$DOCKER_IMAGE" serve
}

# Validate resume.json
validate() {
    echo "Validating resume.json..."
    docker run --rm -v "$REPO_ROOT:/resume" "$DOCKER_IMAGE" validate
    echo "Validation complete!"
}

# Show usage
usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  build          Build the resume generator Docker image"
    echo "  export [file]  Export resume to HTML (default: resume.html)"
    echo "  serve          Serve resume locally on port 4000"
    echo "  validate       Validate resume.json against schema"
    echo "  help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build"
    echo "  $0 export"
    echo "  $0 export resume.html"
    echo "  $0 serve"
    echo "  $0 validate"
}

# Main command dispatcher
case "${1:-help}" in
    build)
        build
        ;;
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
