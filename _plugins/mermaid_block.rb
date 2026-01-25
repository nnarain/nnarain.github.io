# frozen_string_literal: true

module Jekyll
  module MermaidBlock
    class MermaidTag < Liquid::Block
      def render(context)
        text = super
        "<div class=\"mermaid\">#{text}</div>"
      end
    end
  end
end

Liquid::Template.register_tag('mermaid', Jekyll::MermaidBlock::MermaidTag)

# Hook to convert ```mermaid code blocks to mermaid divs
Jekyll::Hooks.register [:posts, :pages, :documents], :pre_render do |doc|
  doc.content = doc.content.gsub(/```mermaid\n(.*?)```/m) do
    "<div class=\"mermaid\">\n#{$1}</div>"
  end
end
