(function() {
    'use strict';

    // Timeline and Infinite Scroll Module
    const TimelineManager = {
        years: new Set(),
        activeYear: null,
        observers: [],
        intersectingYears: new Set(),
        
        init() {
            this.collectYears();
            this.buildTimeline();
            this.setupScrollObserver();
            this.setupInfiniteScroll();
        },

        // Collect all years from posts
        collectYears() {
            const yearSections = document.querySelectorAll('.year-section');
            yearSections.forEach(section => {
                const year = section.dataset.year;
                if (year) {
                    this.years.add(year);
                }
            });
        },

        // Build the timeline sidebar
        buildTimeline() {
            const sidebar = document.querySelector('#timeline-sidebar nav');
            if (!sidebar) return;

            // Sort years in descending order (newest first)
            const sortedYears = Array.from(this.years).sort((a, b) => b - a);

            sortedYears.forEach(year => {
                const button = document.createElement('button');
                button.className = 'timeline-year text-gray-400 dark:text-gray-600 hover:text-primary dark:hover:text-primary font-sans text-lg transition-all duration-200 text-left px-2 py-1 rounded';
                button.textContent = year;
                button.dataset.year = year;
                button.setAttribute('aria-label', `Jump to ${year}`);
                
                // Click handler to scroll to year
                button.addEventListener('click', () => {
                    const yearSection = document.getElementById(`year-${year}`);
                    if (yearSection) {
                        const yOffset = -100; // Offset for sticky header
                        const y = yearSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
                        window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                });

                sidebar.appendChild(button);
            });
        },

        // Setup IntersectionObserver for year highlighting
        setupScrollObserver() {
            // Disconnect any existing year observers
            if (this.yearObserver) {
                this.yearObserver.disconnect();
            }
            
            const yearSections = document.querySelectorAll('.year-section');
            
            // Observer to detect which year sections are visible
            this.yearObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const year = entry.target.dataset.year;
                    if (entry.isIntersecting) {
                        this.intersectingYears.add(year);
                    } else {
                        this.intersectingYears.delete(year);
                    }
                });
                
                // Find the year section closest to the top of the viewport
                if (this.intersectingYears.size > 0) {
                    let closestYear = null;
                    let closestDistance = Infinity;
                    
                    // Check all year sections to find which one is closest to top
                    yearSections.forEach(section => {
                        const year = section.dataset.year;
                        if (this.intersectingYears.has(year)) {
                            const rect = section.getBoundingClientRect();
                            const distance = Math.abs(rect.top);
                            if (distance < closestDistance) {
                                closestDistance = distance;
                                closestYear = year;
                            }
                        }
                    });
                    
                    if (closestYear) {
                        this.highlightYear(closestYear);
                    }
                }
            }, {
                rootMargin: '-10% 0px -50% 0px',
                threshold: 0
            });

            yearSections.forEach(section => {
                this.yearObserver.observe(section);
            });
        },

        // Highlight active year in timeline
        highlightYear(year) {
            if (this.activeYear === year) return;
            
            this.activeYear = year;
            const buttons = document.querySelectorAll('.timeline-year');
            
            buttons.forEach(button => {
                if (button.dataset.year === year) {
                    button.classList.remove('text-gray-400', 'dark:text-gray-600');
                    button.classList.add('text-primary', 'font-bold', 'scale-110');
                } else {
                    button.classList.add('text-gray-400', 'dark:text-gray-600');
                    button.classList.remove('text-primary', 'font-bold', 'scale-110');
                }
            });
        },

        // Setup infinite scroll functionality
        setupInfiniteScroll() {
            const paginationData = document.getElementById('pagination-data');
            if (!paginationData) return;

            let isLoading = false;
            let hasMore = true;
            let currentPage = parseInt(paginationData.dataset.currentPage);
            const totalPages = parseInt(paginationData.dataset.totalPages);

            // Check if there are more pages
            hasMore = currentPage < totalPages;

            if (!hasMore) return; // No more pages to load

            // Sentinel element for intersection observer
            const sentinel = document.createElement('div');
            sentinel.id = 'infinite-scroll-sentinel';
            sentinel.className = 'h-1';
            document.getElementById('posts-container').after(sentinel);

            const loadingIndicator = document.getElementById('loading-indicator');

            // Infinite scroll observer
            const infiniteScrollObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !isLoading && hasMore) {
                        this.loadNextPage(currentPage + 1, (success, newPage) => {
                            isLoading = false;
                            if (success) {
                                currentPage = newPage;
                                hasMore = currentPage < totalPages;
                                
                                if (!hasMore) {
                                    infiniteScrollObserver.disconnect();
                                    sentinel.remove();
                                }
                            }
                        });
                        isLoading = true;
                        loadingIndicator.classList.remove('hidden');
                    }
                });
            }, {
                rootMargin: '200px'
            });

            infiniteScrollObserver.observe(sentinel);
            this.observers.push(infiniteScrollObserver);
        },

        // Load next page of posts
        loadNextPage(page, callback) {
            const loadingIndicator = document.getElementById('loading-indicator');
            
            // Construct next page URL
            let nextPageUrl;
            if (page === 2) {
                nextPageUrl = '/blog/page2';
            } else {
                nextPageUrl = `/blog/page${page}`;
            }

            fetch(nextPageUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to load page');
                    }
                    return response.text();
                })
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    
                    // Extract posts from the loaded page
                    const newPostsContainer = doc.getElementById('posts-container');
                    if (!newPostsContainer) {
                        callback(false);
                        return;
                    }

                    // Get all year sections and posts
                    const yearSections = newPostsContainer.querySelectorAll('.year-section');
                    const posts = newPostsContainer.querySelectorAll('.post-item');
                    
                    const postsContainer = document.getElementById('posts-container');
                    const existingYears = new Set();
                    
                    // Track existing years to avoid duplicate year headers
                    document.querySelectorAll('.year-section').forEach(section => {
                        existingYears.add(section.dataset.year);
                    });

                    // Build a map of year sections to their posts in the new page
                    const yearToPostsMap = new Map();
                    yearSections.forEach(section => {
                        const year = section.dataset.year;
                        yearToPostsMap.set(year, {
                            section: section,
                            posts: []
                        });
                    });
                    
                    // Associate posts with their year sections
                    posts.forEach(post => {
                        const year = post.dataset.year;
                        if (yearToPostsMap.has(year)) {
                            yearToPostsMap.get(year).posts.push(post);
                        }
                    });

                    // Append new content in the correct order
                    yearToPostsMap.forEach((data, year) => {
                        // Only add year section if it doesn't exist
                        if (!existingYears.has(year)) {
                            postsContainer.appendChild(data.section.cloneNode(true));
                            existingYears.add(year);
                            this.years.add(year);
                        }
                        
                        // Add all posts for this year
                        data.posts.forEach(post => {
                            postsContainer.appendChild(post.cloneNode(true));
                        });
                    });

                    // Update timeline if new years were added
                    const timelineNeedsUpdate = Array.from(this.years).some(year => {
                        return !document.querySelector(`#timeline-sidebar .timeline-year[data-year="${year}"]`);
                    });
                    
                    if (timelineNeedsUpdate) {
                        this.updateTimeline();
                    }

                    // Re-setup observers for new year sections
                    this.setupScrollObserver();

                    loadingIndicator.classList.add('hidden');
                    callback(true, page);
                })
                .catch(error => {
                    console.error('Error loading next page:', error);
                    loadingIndicator.classList.add('hidden');
                    callback(false);
                });
        },

        // Update timeline with new years
        updateTimeline() {
            const sidebar = document.querySelector('#timeline-sidebar nav');
            if (!sidebar) return;

            // Clear and rebuild
            sidebar.innerHTML = '';
            this.buildTimeline();
        },

        // Cleanup
        destroy() {
            if (this.yearObserver) {
                this.yearObserver.disconnect();
            }
            this.observers.forEach(observer => observer.disconnect());
            this.observers = [];
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => TimelineManager.init());
    } else {
        TimelineManager.init();
    }

    // Expose for debugging if needed
    window.TimelineManager = TimelineManager;
})();
