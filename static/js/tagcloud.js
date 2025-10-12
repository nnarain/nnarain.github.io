// Tag Cloud Visualization using D3.js force-directed graph
// Similar to Obsidian's node graph

class TagCloud {
    constructor(containerId, posts) {
        this.containerId = containerId;
        this.posts = posts;
        this.width = 800;
        this.height = 600;
        this.svg = null;
        this.simulation = null;
        this.nodes = [];
        this.links = [];
    }

    // Extract tags and create nodes/links from posts
    processData() {
        const tagMap = new Map();
        const tagPostMap = new Map();
        
        // Count tag frequencies and track post relationships
        for (const postKey in this.posts) {
            const post = this.posts[postKey];
            const tags = post.tags.split(' ').filter(t => t.length > 0);
            
            tags.forEach(tag => {
                const lowerTag = tag.toLowerCase();
                if (!tagMap.has(lowerTag)) {
                    tagMap.set(lowerTag, 0);
                    tagPostMap.set(lowerTag, new Set());
                }
                tagMap.set(lowerTag, tagMap.get(lowerTag) + 1);
                tagPostMap.get(lowerTag).add(postKey);
            });
        }

        // Create nodes for each tag
        this.nodes = Array.from(tagMap.entries()).map(([tag, count]) => ({
            id: tag,
            count: count,
            radius: Math.max(15, Math.min(40, 15 + count * 2))
        }));

        // Create links between tags that share posts
        const links = [];
        const tagArray = Array.from(tagMap.keys());
        
        for (let i = 0; i < tagArray.length; i++) {
            for (let j = i + 1; j < tagArray.length; j++) {
                const tag1 = tagArray[i];
                const tag2 = tagArray[j];
                const posts1 = tagPostMap.get(tag1);
                const posts2 = tagPostMap.get(tag2);
                
                // Find common posts
                const commonPosts = new Set([...posts1].filter(x => posts2.has(x)));
                
                if (commonPosts.size > 0) {
                    links.push({
                        source: tag1,
                        target: tag2,
                        strength: commonPosts.size
                    });
                }
            }
        }
        
        this.links = links;
    }

    // Initialize the visualization
    init() {
        this.processData();
        
        const container = document.getElementById(this.containerId);
        container.innerHTML = ''; // Clear existing content
        
        // Create SVG
        this.svg = d3.select(`#${this.containerId}`)
            .append('svg')
            .attr('width', '100%')
            .attr('height', this.height)
            .attr('viewBox', [0, 0, this.width, this.height])
            .style('background', '#1e1e1e')
            .style('border-radius', '8px');

        // Add zoom behavior
        const g = this.svg.append('g');
        
        this.svg.call(d3.zoom()
            .scaleExtent([0.5, 3])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            }));

        // Create force simulation
        this.simulation = d3.forceSimulation(this.nodes)
            .force('link', d3.forceLink(this.links)
                .id(d => d.id)
                .distance(d => Math.max(80, 150 - d.strength * 10))
                .strength(d => Math.min(0.5, d.strength * 0.1)))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force('collision', d3.forceCollide().radius(d => d.radius + 5));

        // Draw links
        const link = g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(this.links)
            .enter().append('line')
            .attr('stroke', '#4a4a4a')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', d => Math.sqrt(d.strength));

        // Draw nodes
        const node = g.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(this.nodes)
            .enter().append('g')
            .call(this.drag(this.simulation));

        // Add circles to nodes
        node.append('circle')
            .attr('r', d => d.radius)
            .attr('fill', '#3a86ff')
            .attr('stroke', '#8ecae6')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('fill', '#fb5607')
                    .attr('r', d.radius * 1.2);
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('fill', '#3a86ff')
                    .attr('r', d.radius);
            })
            .on('click', (event, d) => {
                // Navigate to search with tag
                window.location.href = `/search?query=${d.id}`;
            });

        // Add labels to nodes
        node.append('text')
            .text(d => d.id)
            .attr('x', 0)
            .attr('y', 0)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('fill', 'white')
            .attr('font-size', d => Math.max(10, Math.min(16, 8 + d.count)))
            .attr('font-family', 'sans-serif')
            .style('pointer-events', 'none')
            .style('user-select', 'none');

        // Add count badges
        node.append('text')
            .text(d => d.count)
            .attr('x', d => d.radius * 0.7)
            .attr('y', d => -d.radius * 0.7)
            .attr('fill', '#ffbe0b')
            .attr('font-size', '10px')
            .attr('font-weight', 'bold')
            .attr('font-family', 'sans-serif')
            .style('pointer-events', 'none')
            .style('user-select', 'none');

        // Update positions on simulation tick
        this.simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node
                .attr('transform', d => `translate(${d.x},${d.y})`);
        });
    }

    // Drag behavior
    drag(simulation) {
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        return d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
    }

    // Destroy the visualization
    destroy() {
        if (this.simulation) {
            this.simulation.stop();
        }
        if (this.svg) {
            this.svg.remove();
        }
    }
}

// Initialize tag cloud when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (window.store && document.getElementById('tag-cloud-container')) {
        const tagCloud = new TagCloud('tag-cloud-container', window.store);
        tagCloud.init();
    }
});
