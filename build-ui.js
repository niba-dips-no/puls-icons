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
      <button id="config-btn" class="config-btn" title="Settings">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.6 3.6 0 0112 15.6z"/>
        </svg>
      </button>
    </div>
    <div id="config-panel" class="config-panel" style="display:none">
      <div class="config-header">
        <span class="config-title">Material Symbols settings</span>
      </div>
      <div class="option-group">
        <label class="option-label">Style</label>
        <div class="option-buttons">
          <button class="opt-btn active" data-style="outlined">Outlined</button>
          <button class="opt-btn" data-style="rounded">Rounded</button>
          <button class="opt-btn" data-style="sharp">Sharp</button>
        </div>
      </div>
      <div class="option-group">
        <label class="option-label">Fill</label>
        <div class="option-buttons">
          <button class="opt-btn active" data-fill="0">No</button>
          <button class="opt-btn" data-fill="1">Yes</button>
        </div>
      </div>
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
