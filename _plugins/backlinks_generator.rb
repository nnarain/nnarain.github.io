# frozen_string_literal: true

module Jekyll
  # Generator that scans all posts for internal links and creates backlinks
  class BacklinksGenerator < Generator
    safe true
    priority :lowest

    def generate(site)
      # Initialize backlinks hash for all posts
      site.posts.docs.each do |post|
        post.data['backlinks'] ||= []
      end

      # Scan each post's content for links to other posts
      site.posts.docs.each do |post|
        # We need the output content (after liquid processing)
        # But at generate time, we only have the raw content
        # So we'll look for both {% post_url %} tags and actual links
        
        content = post.content
        
        # Find {% post_url %} tags - capture everything between post_url and %}
        post_url_matches = content.scan(/\{%\s*post_url\s+([^%]+?)\s*%\}/)
        
        # Find markdown and HTML links
        markdown_links = content.scan(/\[([^\]]+)\]\(([^)]+)\)/).map { |match| match[1] }
        html_links = content.scan(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"/).flatten

        all_links = (markdown_links + html_links).uniq

        # Process post_url tags
        post_url_matches.each do |match|
          # The match is the filename like "2024-04-01-Icarus April 2024 Update"
          post_filename = match[0].strip
          
          # Find the target post by matching the filename
          target_post = site.posts.docs.find do |p|
            p.basename_without_ext == post_filename
          end
          
          if target_post && target_post != post
            unless target_post.data['backlinks'].any? { |bl| bl['url'] == post.url }
              target_post.data['backlinks'] << {
                'url' => post.url,
                'title' => post.data['title'],
                'date' => post.date
              }
            end
          end
        end

        # Check each link to see if it points to another post
        all_links.each do |link|
          # Normalize the link (remove leading slash, site.baseurl, site.url)
          normalized_link = normalize_link(link, site)
          
          next if normalized_link.empty?
          
          # Find the target post
          target_post = find_post_by_url(site, normalized_link)
          
          if target_post && target_post != post
            # Add backlink to target post
            unless target_post.data['backlinks'].any? { |bl| bl['url'] == post.url }
              target_post.data['backlinks'] << {
                'url' => post.url,
                'title' => post.data['title'],
                'date' => post.date
              }
            end
          end
        end
      end

      # Sort backlinks by date (newest first)
      site.posts.docs.each do |post|
        post.data['backlinks'].sort_by! { |bl| bl['date'] }.reverse!
      end
    end

    private

    def normalize_link(link, site)
      return '' if link.nil? || link.empty?
      
      # Remove site.url and site.baseurl
      normalized = link.dup
      normalized = normalized.sub(site.config['url'], '') if site.config['url'] && !site.config['url'].empty?
      normalized = normalized.sub(site.config['baseurl'], '') if site.config['baseurl'] && !site.config['baseurl'].empty?
      
      # Remove leading slash
      normalized = normalized.sub(%r{^/}, '')
      
      # Remove anchors and query strings
      normalized = normalized.split('#').first || ''
      normalized = normalized.split('?').first || ''
      
      # Remove trailing slash
      normalized = normalized.sub(%r{/$}, '')
      
      normalized
    end

    def find_post_by_url(site, link)
      return nil if link.nil? || link.empty?
      
      site.posts.docs.find do |post|
        post_url = post.url.sub(%r{^/}, '').sub(%r{/$}, '')
        link_url = link.sub(%r{^/}, '').sub(%r{/$}, '')
        
        post_url == link_url
      end
    end
  end
end
