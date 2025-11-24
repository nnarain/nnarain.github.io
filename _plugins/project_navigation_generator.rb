# frozen_string_literal: true

module Jekyll
  # Generator that creates project-based navigation links for posts
  class ProjectNavigationGenerator < Generator
    safe true
    priority :low

    def generate(site)
      # Group posts by project_id
      posts_by_project = {}
      
      site.posts.docs.each do |post|
        project_id = post.data['project_id']
        next unless project_id
        
        posts_by_project[project_id] ||= []
        posts_by_project[project_id] << post
      end

      # For each project, sort posts by date and set next/previous
      posts_by_project.each do |project_id, posts|
        # Sort posts by date (oldest first)
        sorted_posts = posts.sort_by(&:date)
        
        # Set project_next and project_previous for each post
        sorted_posts.each_with_index do |post, index|
          # Previous post in the project (older)
          if index > 0
            post.data['project_previous'] = sorted_posts[index - 1]
          end
          
          # Next post in the project (newer)
          if index < sorted_posts.length - 1
            post.data['project_next'] = sorted_posts[index + 1]
          end
        end
      end
    end
  end
end
