# frozen_string_literal: true

module Jekyll
  # Generator that adds last_post_date to projects based on their most recent post
  class ProjectLastUpdateGenerator < Generator
    safe true
    priority :low

    def generate(site)
      # Find the most recent post for each project_id
      latest_posts = {}
      
      site.posts.docs.each do |post|
        project_id = post.data['project_id']
        next unless project_id
        
        # Keep track of the latest post for each project
        if !latest_posts[project_id] || post.date > latest_posts[project_id].date
          latest_posts[project_id] = post
        end
      end

      # Set last_post_date on each project collection item
      site.collections['projects'].docs.each do |project|
        project_id = project.data['project_id']
        
        if project_id && latest_posts[project_id]
          project.data['last_post_date'] = latest_posts[project_id].date
        else
          # If no posts exist for this project, use the project's date field or epoch
          project.data['last_post_date'] = project.data['date'] || Time.at(0)
        end
      end
    end
  end
end
