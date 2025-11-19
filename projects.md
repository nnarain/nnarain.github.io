---
layout: default
title: Projects
permalink: /projects/
---

<!-- ApexCharts Library -->
<script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>

<div class="py-12">
  <h1 class="text-5xl font-sans font-bold text-gray-800 dark:text-gray-200 text-center mb-4">Projects</h1>
  <div class="w-16 h-1 bg-gray-800 dark:bg-gray-200 mx-auto mb-12"></div>
  
  <p class="text-center text-gray-600 dark:text-gray-400 mb-12 text-lg">
    A collection of my personal projects, experiments, and creations.
  </p>
</div>

<!-- Projects Bento Grid -->
{% assign sorted_projects = site.projects | sort: 'order' %}
{% for project in sorted_projects %}
<div class="mb-16 pb-16 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
  <!-- Project Title -->
  <h2 class="text-4xl font-sans font-bold text-gray-800 dark:text-gray-200 mb-6">
    <a href="{{ project.url | relative_url }}" class="hover:text-primary transition-colors duration-200">
      {{ project.name }}
    </a>
  </h2>

  <!-- Bento Grid Layout -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
    
    <!-- Image Component (spans 2 columns on large screens) -->
    {% if project.images and project.images.size > 0 %}
    <div class="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg lg:col-span-2 lg:row-span-2 flex items-center justify-center p-4">
      <div class="w-full h-full flex items-center justify-center">
        <img src="{{ project.images.first | relative_url }}" 
             alt="{{ project.name }}" 
             class="max-w-full max-h-full object-contain rounded hover:opacity-90 transition-opacity duration-200">
      </div>
    </div>
    {% endif %}

    <!-- Description Component -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700 flex flex-col">
      <h3 class="text-xl font-sans font-bold text-gray-800 dark:text-gray-200 mb-3">Description</h3>
      <p class="text-gray-700 dark:text-gray-300 flex-grow">{{ project.description }}</p>
    </div>

    <!-- Repository Link Component -->
    {% if project.repo_url %}
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center">
      <svg class="w-12 h-12 mb-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd"></path>
      </svg>
      <a href="{{ project.repo_url }}" target="_blank" rel="noopener noreferrer" 
         class="text-primary hover:underline font-semibold text-lg">
        View Repository
      </a>
    </div>
    {% endif %}

    <!-- Tags Radar Chart Component -->
    {% if project.tags %}
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700 lg:col-span-1 lg:row-span-1">
      <h3 class="text-xl font-sans font-bold text-gray-800 dark:text-gray-200 mb-3 text-center">Technology Radar</h3>
      <div id="radar-chart-{{ project.project_id }}" class="w-full"></div>
    </div>
    {% endif %}

  </div>
</div>
{% endfor %}

<script>
  // Initialize radar charts for each project
  {% for project in sorted_projects %}
  {% if project.tags %}
  (function() {
    const isDarkMode = document.documentElement.classList.contains('dark');
    const textColor = isDarkMode ? '#d1d5db' : '#374151';
    const gridColor = isDarkMode ? '#4b5563' : '#e5e7eb';

    const options = {
      series: [{
        name: 'Proficiency',
        data: [
          {% for tag in project.tags %}
          {{ 70 | plus: forloop.index | times: 3 | modulo: 30 | plus: 70 }}{% unless forloop.last %},{% endunless %}
          {% endfor %}
        ]
      }],
      chart: {
        height: 280,
        type: 'radar',
        background: 'transparent',
        toolbar: {
          show: false
        }
      },
      xaxis: {
        categories: [
          {% for tag in project.tags %}
          '{{ tag }}'{% unless forloop.last %},{% endunless %}
          {% endfor %}
        ],
        labels: {
          style: {
            colors: Array({{ project.tags.size }}).fill(textColor),
            fontSize: '12px'
          }
        }
      },
      yaxis: {
        show: false,
        min: 0,
        max: 100
      },
      plotOptions: {
        radar: {
          polygons: {
            strokeColors: gridColor,
            fill: {
              colors: ['transparent']
            }
          }
        }
      },
      colors: ['#22c55e'],
      fill: {
        opacity: 0.2
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['#22c55e']
      },
      markers: {
        size: 4,
        colors: ['#22c55e'],
        strokeColors: '#fff',
        strokeWidth: 2
      },
      tooltip: {
        enabled: true,
        theme: isDarkMode ? 'dark' : 'light'
      },
      legend: {
        show: false
      }
    };

    const chart = new ApexCharts(document.querySelector("#radar-chart-{{ project.project_id }}"), options);
    chart.render();

    // Update chart on theme change
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      chart.updateOptions({
        xaxis: {
          labels: {
            style: {
              colors: Array({{ project.tags.size }}).fill(isDark ? '#d1d5db' : '#374151')
            }
          }
        },
        plotOptions: {
          radar: {
            polygons: {
              strokeColors: isDark ? '#4b5563' : '#e5e7eb'
            }
          }
        },
        tooltip: {
          theme: isDark ? 'dark' : 'light'
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
  })();
  {% endif %}
  {% endfor %}
</script>

