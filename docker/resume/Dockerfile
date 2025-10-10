# Dockerfile for JSON Resume
# This container provides the resume-cli tool to generate HTML resumes from resume.json
# 
# Usage:
#   Build: docker build -t resume-generator -f docker/resume/Dockerfile .
#   Export HTML: docker run --rm -v $(pwd):/resume resume-generator export resume.html
#   Serve locally: docker run --rm -v $(pwd):/resume -p 4000:4000 resume-generator serve

FROM node:18-alpine

# Install resume-cli globally
RUN npm install -g resume-cli

# Set working directory
WORKDIR /resume

# Default command shows help
CMD ["resume", "--help"]
