
// https://github.com/Tarptaeya/repo-card/blob/master/repo-card.js
// Updated to use Tailwind CSS and support dark mode

window.addEventListener('DOMContentLoaded', async function() {
    async function get(url) {
      const resp = await fetch(url);
      return resp.json();
    }
  
    const emojis = await get('https://api.github.com/emojis');
    const colors = await get('https://raw.githubusercontent.com/ozh/github-colors/master/colors.json');
  
    document.querySelectorAll('.repo-card').forEach(async function(el) {
      const name = el.getAttribute('data-repo');
  
      const data = await get(`https://api.github.com/repos/${name}`);
  
      data.description = (data.description || '').replace(/:\w+:/g, function(match) {
        const name = match.substring(1, match.length - 1);
        const emoji = emojis[name];
  
        if (emoji) {
          return `<span><img src="${emoji}" class="inline-block w-4 h-4 align-text-bottom"></span>`;
        }
  
        return match;
      });
  
      el.innerHTML = `
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 font-sans text-sm">
        <div class="flex items-center mb-2">
          <svg class="fill-gray-600 dark:fill-gray-400 mr-2 flex-shrink-0" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"></path></svg>
          <span class="font-semibold text-blue-600 dark:text-blue-400">
            <a class="no-underline hover:underline" href="${data.html_url}" target="_blank" rel="noopener noreferrer">${data.name}</a>
          </span>
        </div>
        ${data.fork ? `<div class="text-xs text-gray-600 dark:text-gray-400 mb-2">Forked from <a class="hover:underline" href="${data.source.html_url}" target="_blank" rel="noopener noreferrer">${data.source.full_name}</a></div>` : ''}
        <div class="text-xs text-gray-700 dark:text-gray-300 mb-4 mt-2">${data.description || 'No description available'}</div>
        <div class="flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
          ${data.language ? `
          <div class="flex items-center">
            <span class="w-3 h-3 rounded-full inline-block mr-1.5" style="background-color: ${colors[data.language]?.color || '#cccccc'};"></span>
            <span>${data.language}</span>
          </div>
          ` : ''}
          ${data.stargazers_count > 0 ? `
          <div class="flex items-center">
            <svg class="fill-current mr-1" aria-label="stars" viewBox="0 0 16 16" version="1.1" width="16" height="16" role="img"><path fill-rule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694v.001z"></path></svg>
            <span>${data.stargazers_count.toLocaleString()}</span>
          </div>
          ` : ''}
          ${data.forks > 0 ? `
          <div class="flex items-center">
            <svg class="fill-current mr-1" aria-label="fork" viewBox="0 0 16 16" version="1.1" width="16" height="16" role="img"><path fill-rule="evenodd" d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"></path></svg>
            <span>${data.forks.toLocaleString()}</span>
          </div>
          ` : ''}
        </div>
      </div>
      `;
    });
  });
