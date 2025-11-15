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
          <a href="https://www.linkedin.com/in/natesh-narain/" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg">
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

## Tag Distribution

Here's a visualization of the topics I write about most frequently:

</div>
</div>

<!-- Tag Visualization Chart -->
<div class="py-12">
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
    <div id="tag-chart"></div>
  </div>
</div>

<script>
  // Compute tag counts using Jekyll Liquid
  {% assign tag_counts = "" | split: "" %}
  {% assign tag_names = "" | split: "" %}
  
  {% comment %} Collect all tags and count them {% endcomment %}
  {% assign all_tags = site.posts | map: "tag" | join: "," | split: "," %}
  {% assign unique_tags = all_tags | uniq | sort %}
  
  {% for tag in unique_tags %}
    {% if tag != "" %}
      {% assign count = 0 %}
      {% for post in site.posts %}
        {% if post.tag contains tag %}
          {% assign count = count | plus: 1 %}
        {% endif %}
      {% endfor %}
      {% assign tag_names = tag_names | push: tag %}
      {% assign tag_counts = tag_counts | push: count %}
    {% endif %}
  {% endfor %}
  
  // Prepare data for ApexCharts
  const tagNames = [
    {% for tag in tag_names %}
      "{{ tag }}"{% unless forloop.last %},{% endunless %}
    {% endfor %}
  ];
  
  const tagCounts = [
    {% for count in tag_counts %}
      {{ count }}{% unless forloop.last %},{% endunless %}
    {% endfor %}
  ];
  
  // Create data array with tag names and counts, then sort by count
  const tagData = tagNames.map((name, index) => ({
    name: name,
    count: tagCounts[index]
  })).sort((a, b) => b.count - a.count);
  
  // Extract sorted names and counts
  const sortedTagNames = tagData.map(item => item.name);
  const sortedTagCounts = tagData.map(item => item.count);
  
  // ApexCharts configuration
  const options = {
    series: [{
      name: 'Posts',
      data: sortedTagCounts
    }],
    chart: {
      type: 'bar',
      height: Math.max(400, sortedTagNames.length * 30),
      toolbar: {
        show: false
      },
      background: 'transparent'
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: true,
        distributed: false,
        dataLabels: {
          position: 'right'
        }
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        colors: ['#1f2937']
      },
      offsetX: 30
    },
    xaxis: {
      categories: sortedTagNames,
      labels: {
        style: {
          colors: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#4b5563'
        }
      },
      title: {
        text: 'Number of Posts',
        style: {
          color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#4b5563'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#4b5563'
        }
      }
    },
    colors: ['#3b82f6'],
    theme: {
      mode: document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    },
    grid: {
      borderColor: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'
    },
    tooltip: {
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      y: {
        formatter: function(val) {
          return val + " post" + (val !== 1 ? "s" : "");
        }
      }
    }
  };
  
  // Render the chart
  const chart = new ApexCharts(document.querySelector("#tag-chart"), options);
  chart.render();
  
  // Update chart theme when dark mode is toggled
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function() {
      setTimeout(() => {
        const isDark = document.documentElement.classList.contains('dark');
        chart.updateOptions({
          theme: {
            mode: isDark ? 'dark' : 'light'
          },
          xaxis: {
            labels: {
              style: {
                colors: isDark ? '#d1d5db' : '#4b5563'
              }
            },
            title: {
              style: {
                color: isDark ? '#d1d5db' : '#4b5563'
              }
            }
          },
          yaxis: {
            labels: {
              style: {
                colors: isDark ? '#d1d5db' : '#4b5563'
              }
            }
          },
          grid: {
            borderColor: isDark ? '#374151' : '#e5e7eb'
          },
          tooltip: {
            theme: isDark ? 'dark' : 'light'
          }
        });
      }, 100);
    });
  }
</script>
