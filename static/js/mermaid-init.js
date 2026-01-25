document.addEventListener('DOMContentLoaded', function() {
  // Find all code blocks with language-mermaid class
  document.querySelectorAll('pre code.language-mermaid').forEach(function(block) {
    // Get the mermaid code
    const code = block.textContent;
    // Create a div for mermaid
    const mermaidDiv = document.createElement('div');
    mermaidDiv.className = 'mermaid';
    mermaidDiv.textContent = code;
    // Replace the pre block with the mermaid div
    block.parentElement.parentElement.replaceChild(mermaidDiv, block.parentElement);
  });
  // Initialize mermaid after conversion
  mermaid.initialize({ startOnLoad: true, theme: 'default' });
  mermaid.run();
});
