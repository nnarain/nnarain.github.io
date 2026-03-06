# frozen_string_literal: true

module Jekyll
  # Generator that scans all project posts for images and attaches them to project pages
  class ProjectImagesGenerator < Generator
    safe true
    priority :low

    IMAGE_EXTENSIONS = /\.(png|jpg|jpeg|gif|webp|svg)(\?|#|$)/i

    def generate(site)
      # Build a map of project_id -> list of image URLs
      images_by_project = {}

      site.posts.docs.each do |post|
        project_id = post.data['project_id']
        next unless project_id

        content = post.content

        # Find markdown images: ![alt](url)
        markdown_images = content.scan(/!\[[^\]]*\]\(([^)]+)\)/).flatten

        # Find HTML images: <img src="url">
        html_images = content.scan(/<img\s+[^>]*src="([^"]+)"/).flatten

        all_images = (markdown_images + html_images).uniq.select { |img| img =~ IMAGE_EXTENSIONS }

        next if all_images.empty?

        images_by_project[project_id] ||= []
        images_by_project[project_id].concat(all_images)
      end

      # Deduplicate images per project
      images_by_project.each_value(&:uniq!)

      # Attach images to the corresponding project pages
      project_collection = site.collections['projects']
      return unless project_collection

      project_collection.docs.each do |project|
        pid = project.data['project_id']
        next unless pid

        project.data['project_images'] = images_by_project[pid] || []
      end
    end
  end
end
