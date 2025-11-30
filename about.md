---
layout: default
title: About
permalink: /about/
---

<!-- Profile Card -->
<div class="py-12">
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-12 border border-gray-200 dark:border-gray-700">
    <div class="flex flex-col md:flex-row items-center md:items-start gap-6">
      <!-- Profile Picture -->
      <div class="flex-shrink-0">
        <img src="/static/socials/profile.jpg" alt="Natesh Narain" class="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600">
      </div>
      
      <!-- Profile Info -->
      <div class="flex-1 text-center md:text-left">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Natesh Narain</h2>
        <p class="text-lg text-gray-700 dark:text-gray-300 mb-4">Staff Software Developer specializing in hardware integration of autonomous robotics systems at OTTO by Rockwell Automation</p>
        
        <!-- Links -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
          <a href="{{ site.linkedin_url }}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg">
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            LinkedIn
          </a>
          <a href="/resume/" class="inline-flex items-center justify-center px-6 py-2 bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            View Resume
          </a>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="py-12" markdown="1">
<div class="prose prose-lg dark:prose-invert max-w-none mx-auto" markdown="1">

# About

Hi!

My name is Natesh. I'm a software developer working on robots in the industrial automation sector.

## What I Do

I'm passionate about building robust, low-level software and designing solutions for complex open ended technical challenges.

## What This Blog Is About

I primarily use this blog as a place to document and share the projects I'm working on. My posts cover a wide range of topics including:

- **Embedded Systems & Electronics**: Flight controllers, ESP32 projects, home automation, and custom PCB designs
- **Robotics**: ROS/ROS 2 development and general robotics hobbyist development
- **Firmware Development**: STM32, Arduino, AVR, and Rust on embedded devices
- **Emulation Projects**: Gameboy, NES, Chip-8
- **Graphics Programming**: Procedural generation, OpenGL, deferred shading, and Unity projects
- **3D Printing & Makes**: Custom builds, props, and hobby projects
- **General Software Development**: C++, Rust, Python, CMake toolchains, and testing frameworks

Most posts are project updates where I elaborate on problems I solved, interesting solutions I came up with, or new technologies I'm exploring.

</div>
</div>

<!-- Blog Insights Section -->
<div class="py-12">
  <div class="mb-8">
    <h2 class="text-3xl font-sans font-bold text-gray-800 dark:text-gray-200 mb-2">Blog Insights</h2>
    <p class="text-gray-600 dark:text-gray-400">How topics in my blog posts relate to each other</p>
  </div>

  <!-- Tag Relationship Heatmap -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Tag Co-occurrence</h3>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Shows how often tags appear together in posts</p>
    <div id="tag-heatmap-chart"></div>
  </div>
</div>

<script>
function initTagHeatmap() {
  if (typeof ApexCharts === 'undefined') {
    setTimeout(initTagHeatmap, 100);
    return;
  }

  // Collect tag data from all posts
  const postTags = [
    {% for post in site.posts %}
    {% if post.tag and post.tag.size > 0 %}
    [{% for tag in post.tag %}"{{ tag | downcase | escape }}"{% unless forloop.last %},{% endunless %}{% endfor %}]{% unless forloop.last %},{% endunless %}
    {% endif %}
    {% endfor %}
  ].filter(tags => tags && tags.length > 1);

  // Count tag occurrences
  const tagCount = {};
  postTags.forEach(tags => {
    tags.forEach(tag => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
  });

  // Get top tags by frequency
  const topTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([tag]) => tag);

  // Build co-occurrence matrix
  const coOccurrence = {};
  topTags.forEach(tag1 => {
    coOccurrence[tag1] = {};
    topTags.forEach(tag2 => {
      coOccurrence[tag1][tag2] = 0;
    });
  });

  postTags.forEach(tags => {
    const relevantTags = tags.filter(t => topTags.includes(t));
    for (let i = 0; i < relevantTags.length; i++) {
      for (let j = 0; j < relevantTags.length; j++) {
        if (i !== j) {
          coOccurrence[relevantTags[i]][relevantTags[j]]++;
        }
      }
    }
  });

  // Format data for ApexCharts heatmap
  const series = topTags.map(tag1 => ({
    name: tag1,
    data: topTags.map(tag2 => ({
      x: tag2,
      y: tag1 === tag2 ? 0 : coOccurrence[tag1][tag2]
    }))
  }));

  // Find max value for color scaling
  let maxValue = 0;
  series.forEach(s => {
    s.data.forEach(d => {
      if (d.y > maxValue) maxValue = d.y;
    });
  });

  const isDarkMode = document.documentElement.classList.contains('dark');

  const options = {
    series: series,
    chart: {
      type: 'heatmap',
      height: 400,
      background: 'transparent',
      toolbar: {
        show: false
      },
      fontFamily: 'inherit'
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '11px',
        fontWeight: 500,
        colors: [isDarkMode ? '#fff' : '#1f2937']
      },
      formatter: function(val) {
        return val > 0 ? val : '';
      }
    },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5,
        radius: 4,
        useFillColorAsStroke: false,
        colorScale: {
          ranges: [
            { from: 0, to: 0, color: isDarkMode ? '#1f2937' : '#f3f4f6', name: 'None' },
            { from: 1, to: Math.ceil(maxValue * 0.25), color: '#bbf7d0', name: 'Low' },
            { from: Math.ceil(maxValue * 0.25) + 1, to: Math.ceil(maxValue * 0.5), color: '#86efac', name: 'Medium' },
            { from: Math.ceil(maxValue * 0.5) + 1, to: Math.ceil(maxValue * 0.75), color: '#4ade80', name: 'High' },
            { from: Math.ceil(maxValue * 0.75) + 1, to: maxValue, color: '#22c55e', name: 'Very High' }
          ]
        }
      }
    },
    stroke: {
      width: 2,
      colors: [isDarkMode ? '#374151' : '#fff']
    },
    xaxis: {
      labels: {
        style: {
          colors: isDarkMode ? '#9ca3af' : '#4b5563',
          fontSize: '11px'
        },
        rotate: -45,
        rotateAlways: true
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: {
          colors: isDarkMode ? '#9ca3af' : '#4b5563',
          fontSize: '11px'
        }
      }
    },
    grid: {
      padding: {
        right: 20,
        bottom: 20
      }
    },
    tooltip: {
      enabled: true,
      theme: isDarkMode ? 'dark' : 'light',
      y: {
        formatter: function(val, { seriesIndex, dataPointIndex, w }) {
          const tag1 = w.config.series[seriesIndex].name;
          const tag2 = w.config.series[seriesIndex].data[dataPointIndex].x;
          if (tag1 === tag2) return 'Same tag';
          if (val === 0) return 'No posts together';
          return val + ' post' + (val !== 1 ? 's' : '') + ' together';
        }
      }
    },
    legend: {
      show: false
    }
  };

  const chartEl = document.querySelector('#tag-heatmap-chart');
  if (!chartEl) return;

  const chart = new ApexCharts(chartEl, options);
  chart.render();

  // Update chart on theme change
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.attributeName === 'class') {
        const isDark = document.documentElement.classList.contains('dark');
        chart.updateOptions({
          dataLabels: {
            style: {
              colors: [isDark ? '#fff' : '#1f2937']
            }
          },
          plotOptions: {
            heatmap: {
              colorScale: {
                ranges: [
                  { from: 0, to: 0, color: isDark ? '#1f2937' : '#f3f4f6', name: 'None' },
                  { from: 1, to: Math.ceil(maxValue * 0.25), color: '#bbf7d0', name: 'Low' },
                  { from: Math.ceil(maxValue * 0.25) + 1, to: Math.ceil(maxValue * 0.5), color: '#86efac', name: 'Medium' },
                  { from: Math.ceil(maxValue * 0.5) + 1, to: Math.ceil(maxValue * 0.75), color: '#4ade80', name: 'High' },
                  { from: Math.ceil(maxValue * 0.75) + 1, to: maxValue, color: '#22c55e', name: 'Very High' }
                ]
              }
            }
          },
          stroke: {
            colors: [isDark ? '#374151' : '#fff']
          },
          xaxis: {
            labels: {
              style: {
                colors: isDark ? '#9ca3af' : '#4b5563'
              }
            }
          },
          yaxis: {
            labels: {
              style: {
                colors: isDark ? '#9ca3af' : '#4b5563'
              }
            }
          },
          tooltip: {
            theme: isDark ? 'dark' : 'light'
          }
        });
      }
    });
  });
  observer.observe(document.documentElement, { attributes: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTagHeatmap);
} else {
  initTagHeatmap();
}
</script>
