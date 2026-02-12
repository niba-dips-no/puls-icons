const fs = require('fs');
const path = require('path');

const jsContent = fs.readFileSync(path.join(__dirname, 'dist/ui.js'), 'utf8');
const cssContent = fs.readFileSync(path.join(__dirname, 'src/ui.css'), 'utf8');

const html = `<!DOCTYPE html>
<html>
<head>
  <style>${cssContent}</style>
</head>
<body>
  <div id="app">
    <div class="search-bar">
      <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
      </svg>
      <input id="search" type="text" placeholder="Search icons..." autocomplete="off" />
    </div>
    <div class="source-tabs">
      <button class="tab active" data-source="all">All</button>
      <button class="tab" data-source="material">Material</button>
      <button class="tab" data-source="puls">Puls</button>
    </div>
    <div id="grid" class="icon-grid"></div>
    <div id="empty" class="empty-state" style="display:none">
      <p>No icons found</p>
    </div>
    <div id="loading" class="loading-state">
      <p>Loading icons...</p>
    </div>
    <div id="bottom-bar" class="bottom-bar" style="display:none">
      <div class="selected-info">
        <span id="selected-name"></span>
        <span id="selected-source" class="source-badge"></span>
      </div>
      <button id="insert-btn" class="insert-btn">Insert</button>
    </div>
  </div>
  <script>${jsContent}</script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'dist/ui.html'), html);
console.log('Built dist/ui.html');
