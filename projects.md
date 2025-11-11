---
layout: default
title: Projects
permalink: /projects/
---

<div class="py-12">
  <h1 class="text-5xl font-sans font-bold text-gray-800 dark:text-gray-200 text-center mb-4">Projects</h1>
  <div class="w-16 h-1 bg-gray-800 dark:bg-gray-200 mx-auto mb-12"></div>
  
  <p class="text-center text-gray-600 dark:text-gray-400 mb-12 text-lg">
    A collection of my personal projects, experiments, and creations.
  </p>
</div>

<!-- Projects List with Infinite Scroll Style -->
<div id="projects-container" class="space-y-16 pb-12">
  {% assign sorted_projects = site.projects | sort: 'order' %}
  {% for project in sorted_projects %}
  <article class="project-item border-b border-gray-200 dark:border-gray-700 pb-16 last:border-b-0 opacity-0 translate-y-8 transition-all duration-700" data-index="{{ forloop.index }}">
    <!-- Project Header -->
    <div class="mb-6">
      <h2 class="text-4xl font-sans font-bold text-gray-800 dark:text-gray-200 mb-3">
        <a href="{{ project.url | relative_url }}" class="hover:text-primary transition-colors duration-200">
          {{ project.name }}
        </a>
      </h2>
      <div class="h-1 w-12 bg-primary"></div>
    </div>

    <!-- Project Images Carousel -->
    {% if project.images and project.images.size > 0 %}
    <div class="mb-6">
      <div class="project-carousel-{{ forloop.index }} relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg" style="max-height: 500px;">
        {% for image in project.images %}
        <div class="carousel-item-{{ forloop.index }} {% if forloop.first %}active{% endif %}" style="display: {% if forloop.first %}block{% else %}none{% endif %};">
          <a href="{{ project.url | relative_url }}">
            <img src="{{ image | relative_url }}" alt="{{ project.name }}" class="w-full h-auto mx-auto hover:opacity-90 transition-opacity duration-200" style="max-height: 500px; object-fit: contain;">
          </a>
        </div>
        {% endfor %}

        {% if project.images.size > 1 %}
        <!-- Carousel Controls -->
        <button class="carousel-prev absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 p-2 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-md" data-carousel="{{ forloop.index }}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <button class="carousel-next absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 p-2 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-md" data-carousel="{{ forloop.index }}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>

        <!-- Indicators -->
        <div class="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {% for image in project.images %}
          <div class="carousel-indicator-{{ forloop.parentloop.index }} w-2 h-2 rounded-full bg-white/50 {% if forloop.first %}active bg-white{% endif %} transition-all duration-200" data-index="{{ forloop.index0 }}"></div>
          {% endfor %}
        </div>
        {% endif %}
      </div>
    </div>
    {% endif %}

    <!-- Project Description -->
    <div class="mb-6">
      <p class="text-lg text-gray-700 dark:text-gray-300">{{ project.description }}</p>
    </div>

    <!-- Project Meta -->
    <div class="flex flex-wrap gap-4 items-center mb-4">
      {% if project.repo_url %}
      <a href="{{ project.repo_url }}" target="_blank" rel="noopener noreferrer" 
         class="inline-flex items-center text-primary hover:underline">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd"></path>
        </svg>
        View Repository
      </a>
      {% endif %}
      <a href="{{ project.url | relative_url }}" class="text-primary hover:underline font-semibold">
        Learn More →
      </a>
    </div>

    <!-- Tags -->
    {% if project.tags %}
    <div class="flex flex-wrap gap-2">
      {% for tag in project.tags %}
      <span class="px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary rounded-full text-sm">{{ tag }}</span>
      {% endfor %}
    </div>
    {% endif %}
  </article>
  {% endfor %}
</div>

<!-- Loading indicator for infinite scroll effect -->
<div id="loading" class="text-center py-8 hidden">
  <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
</div>

<script>
  // Infinite scroll reveal animation
  const projectItems = document.querySelectorAll('.project-item');
  
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('opacity-0', 'translate-y-8');
        entry.target.classList.add('opacity-100', 'translate-y-0');
      }
    });
  }, observerOptions);

  projectItems.forEach(item => {
    observer.observe(item);
  });

  // Carousel functionality for each project
  {% for project in sorted_projects %}
  {% if project.images.size > 1 %}
  (function() {
    const carouselIndex = {{ forloop.index }};
    const carousel = document.querySelector('.project-carousel-' + carouselIndex);
    const items = carousel.querySelectorAll('[class^="carousel-item-"]');
    const indicators = document.querySelectorAll('.carousel-indicator-' + carouselIndex);
    const prevBtn = carousel.querySelector('.carousel-prev');
    const nextBtn = carousel.querySelector('.carousel-next');
    let currentIndex = 0;

    function showSlide(index) {
      items.forEach(item => item.style.display = 'none');
      indicators.forEach(ind => {
        ind.classList.remove('active', 'bg-white');
        ind.classList.add('bg-white/50');
      });

      items[index].style.display = 'block';
      indicators[index].classList.add('active', 'bg-white');
      indicators[index].classList.remove('bg-white/50');
      currentIndex = index;
    }

    function nextSlide() {
      const next = (currentIndex + 1) % items.length;
      showSlide(next);
    }

    function prevSlide() {
      const prev = (currentIndex - 1 + items.length) % items.length;
      showSlide(prev);
    }

    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);
    
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => showSlide(index));
    });

    // Auto-advance
    setInterval(nextSlide, 5000);
  })();
  {% endif %}
  {% endfor %}
</script>

