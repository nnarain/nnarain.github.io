// Tag Cloud Visualization using Canvas and vanilla JavaScript
// A simpler implementation that doesn't require external libraries

class TagCloud {
    constructor(containerId, posts) {
        this.containerId = containerId;
        this.posts = posts;
        this.width = 800;
        this.height = 600;
        this.canvas = null;
        this.ctx = null;
        this.nodes = [];
        this.links = [];
        this.hoveredNode = null;
        this.isDragging = false;
        this.draggedNode = null;
        this.animationFrame = null;
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
            radius: Math.max(15, Math.min(40, 15 + count * 2)),
            x: Math.random() * (this.width - 100) + 50,
            y: Math.random() * (this.height - 100) + 50,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2
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
                        source: this.nodes.find(n => n.id === tag1),
                        target: this.nodes.find(n => n.id === tag2),
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
        
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.width = '100%';
        this.canvas.style.height = this.height + 'px';
        this.canvas.style.borderRadius = '8px';
        this.canvas.style.background = '#1e1e1e';
        this.canvas.style.cursor = 'pointer';
        
        container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        // Setup event listeners
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('click', this.onClick.bind(this));

        // Start animation
        this.animate();
    }

    // Force simulation step
    simulateForces() {
        const damping = 0.8;
        const centerForce = 0.01;
        const linkForce = 0.005;
        const repelForce = 500;

        // Apply forces to nodes
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            
            if (node === this.draggedNode) continue;

            // Center force
            const centerX = this.width / 2;
            const centerY = this.height / 2;
            node.vx += (centerX - node.x) * centerForce;
            node.vy += (centerY - node.y) * centerForce;

            // Repel force from other nodes
            for (let j = 0; j < this.nodes.length; j++) {
                if (i === j) continue;
                const other = this.nodes[j];
                const dx = other.x - node.x;
                const dy = other.y - node.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150 && dist > 0) {
                    const force = repelForce / (dist * dist);
                    node.vx -= (dx / dist) * force;
                    node.vy -= (dy / dist) * force;
                }
            }
        }

        // Apply link forces
        for (const link of this.links) {
            const dx = link.target.x - link.source.x;
            const dy = link.target.y - link.source.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const force = (dist - 100) * linkForce * link.strength * 0.1;
            
            if (!link.source.isDragging) {
                link.source.vx += (dx / dist) * force;
                link.source.vy += (dy / dist) * force;
            }
            if (!link.target.isDragging) {
                link.target.vx -= (dx / dist) * force;
                link.target.vy -= (dy / dist) * force;
            }
        }

        // Update positions
        for (const node of this.nodes) {
            if (node === this.draggedNode) continue;

            node.vx *= damping;
            node.vy *= damping;
            node.x += node.vx;
            node.y += node.vy;

            // Boundary collision
            if (node.x < node.radius) {
                node.x = node.radius;
                node.vx *= -0.5;
            }
            if (node.x > this.width - node.radius) {
                node.x = this.width - node.radius;
                node.vx *= -0.5;
            }
            if (node.y < node.radius) {
                node.y = node.radius;
                node.vy *= -0.5;
            }
            if (node.y > this.height - node.radius) {
                node.y = this.height - node.radius;
                node.vy *= -0.5;
            }
        }
    }

    // Animation loop
    animate() {
        this.simulateForces();
        this.draw();
        this.animationFrame = requestAnimationFrame(this.animate.bind(this));
    }

    // Draw the visualization
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw links
        this.ctx.strokeStyle = '#4a4a4a';
        this.ctx.globalAlpha = 0.6;
        for (const link of this.links) {
            this.ctx.beginPath();
            this.ctx.lineWidth = Math.sqrt(link.strength);
            this.ctx.moveTo(link.source.x, link.source.y);
            this.ctx.lineTo(link.target.x, link.target.y);
            this.ctx.stroke();
        }
        this.ctx.globalAlpha = 1.0;

        // Draw nodes
        for (const node of this.nodes) {
            const isHovered = node === this.hoveredNode;
            const radius = isHovered ? node.radius * 1.2 : node.radius;

            // Node circle
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = isHovered ? '#fb5607' : '#3a86ff';
            this.ctx.fill();
            this.ctx.strokeStyle = '#8ecae6';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Node label
            this.ctx.fillStyle = 'white';
            this.ctx.font = `${Math.max(10, Math.min(16, 8 + node.count))}px sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(node.id, node.x, node.y);

            // Count badge
            this.ctx.fillStyle = '#ffbe0b';
            this.ctx.font = 'bold 10px sans-serif';
            this.ctx.fillText(node.count, node.x + radius * 0.7, node.y - radius * 0.7);
        }
    }

    // Find node at position
    findNodeAt(x, y) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const canvasX = (x - rect.left) * scaleX;
        const canvasY = (y - rect.top) * scaleY;

        for (const node of this.nodes) {
            const dx = canvasX - node.x;
            const dy = canvasY - node.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < node.radius) {
                return node;
            }
        }
        return null;
    }

    // Event handlers
    onMouseMove(e) {
        const node = this.findNodeAt(e.clientX, e.clientY);
        this.hoveredNode = node;
        this.canvas.style.cursor = node ? 'pointer' : 'default';

        if (this.isDragging && this.draggedNode) {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.draggedNode.x = (e.clientX - rect.left) * scaleX;
            this.draggedNode.y = (e.clientY - rect.top) * scaleY;
            this.draggedNode.vx = 0;
            this.draggedNode.vy = 0;
        }
    }

    onMouseDown(e) {
        const node = this.findNodeAt(e.clientX, e.clientY);
        if (node) {
            this.isDragging = true;
            this.draggedNode = node;
        }
    }

    onMouseUp(e) {
        this.isDragging = false;
        this.draggedNode = null;
    }

    onClick(e) {
        const node = this.findNodeAt(e.clientX, e.clientY);
        if (node && !this.isDragging) {
            window.location.href = `/search?query=${node.id}`;
        }
    }

    // Destroy the visualization
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.canvas) {
            this.canvas.remove();
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
