import { IconMeta, IconSource, PulsIconEntry } from './types';

// --- Configuration ---
const MATERIAL_METADATA_URL = 'https://data.jsdelivr.com/v1/packages/npm/@material-symbols/svg-400';
const MATERIAL_CDN_BASE = 'https://cdn.jsdelivr.net/npm/@material-symbols/svg-400@latest/';
const PULS_REPO = 'niba-dips-no/puls-icons';
const PULS_ICONS_JSON_URL = 'https://cdn.jsdelivr.net/gh/' + PULS_REPO + '@main/icons.json';
const PULS_SVG_BASE = 'https://cdn.jsdelivr.net/gh/' + PULS_REPO + '@main/';

const PAGE_SIZE = 60;

// --- State ---
let allIcons: IconMeta[] = [];
let filteredIcons: IconMeta[] = [];
let displayedCount = 0;
let selectedIcon: IconMeta | null = null;
let activeSource: 'all' | IconSource = 'all';
let searchQuery = '';
let materialStyle: 'outlined' | 'rounded' | 'sharp' = 'outlined';
let materialFill: boolean = false;
let svgCache = new Map<string, string>();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// --- DOM refs ---
const grid = document.getElementById('grid') as HTMLDivElement;
const searchInput = document.getElementById('search') as HTMLInputElement;
const emptyState = document.getElementById('empty') as HTMLDivElement;
const loadingState = document.getElementById('loading') as HTMLDivElement;
const bottomBar = document.getElementById('bottom-bar') as HTMLDivElement;
const selectedNameEl = document.getElementById('selected-name') as HTMLSpanElement;
const selectedSourceEl = document.getElementById('selected-source') as HTMLSpanElement;
const insertBtn = document.getElementById('insert-btn') as HTMLButtonElement;
const tabs = document.querySelectorAll('.tab') as NodeListOf<HTMLButtonElement>;
const configBtn = document.getElementById('config-btn') as HTMLButtonElement;
const configPanel = document.getElementById('config-panel') as HTMLDivElement;
const styleBtns = document.querySelectorAll('[data-style]') as NodeListOf<HTMLButtonElement>;
const fillBtns = document.querySelectorAll('[data-fill]') as NodeListOf<HTMLButtonElement>;

// --- Initialization ---
init();

async function init() {
  setupEventListeners();
  await loadMetadata();
}

function setupEventListeners() {
  searchInput.addEventListener('input', function () {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      searchQuery = searchInput.value.trim().toLowerCase();
      applyFilters();
    }, 200);
  });

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      activeSource = (tab.getAttribute('data-source') || 'all') as 'all' | IconSource;
      applyFilters();
    });
  });

  configBtn.addEventListener('click', function () {
    var isOpen = configPanel.style.display !== 'none';
    configPanel.style.display = isOpen ? 'none' : 'flex';
    configBtn.classList.toggle('active', !isOpen);
  });

  styleBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      styleBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      materialStyle = btn.getAttribute('data-style') as 'outlined' | 'rounded' | 'sharp';
      applyFilters();
    });
  });

  fillBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      fillBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      materialFill = btn.getAttribute('data-fill') === '1';
      applyFilters();
    });
  });

  insertBtn.addEventListener('click', function () {
    if (selectedIcon) insertIcon(selectedIcon);
  });
}

// --- Metadata loading ---
async function loadMetadata() {
  loadingState.style.display = 'flex';
  grid.style.display = 'none';
  emptyState.style.display = 'none';

  var results = await Promise.all([
    fetchMaterialMetadata(),
    fetchPulsMetadata(),
  ]);

  allIcons = results[0].concat(results[1]);
  loadingState.style.display = 'none';
  grid.style.display = 'grid';
  applyFilters();
}

async function fetchMaterialMetadata(): Promise<IconMeta[]> {
  try {
    // First, resolve the latest version
    var pkgResp = await fetch(MATERIAL_METADATA_URL);
    if (!pkgResp.ok) throw new Error('HTTP ' + pkgResp.status);
    var pkgData = await pkgResp.json();

    // Get latest version from tags or first version
    var latestVersion = pkgData.tags && pkgData.tags.latest ? pkgData.tags.latest : null;
    if (!latestVersion && pkgData.versions && pkgData.versions.length > 0) {
      latestVersion = pkgData.versions[0].version;
    }
    if (!latestVersion) throw new Error('Could not resolve latest version');

    // Fetch file tree for that version
    var filesUrl = MATERIAL_METADATA_URL + '@' + latestVersion;
    var resp = await fetch(filesUrl);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    var data = await resp.json();

    // Navigate to /outlined directory in the file tree to get icon names
    // (all styles have the same icon names, so we only need to parse one)
    var files: Array<{ name: string }> = findStyleFiles(data, 'outlined');
    return files
      .filter(function (f) {
        // Only base icons, not -fill variants (we handle fill via URL)
        return f.name.endsWith('.svg') && !f.name.endsWith('-fill.svg');
      })
      .map(function (f) {
        return {
          name: f.name.replace('.svg', ''),
          source: 'material' as IconSource,
        };
      });
  } catch (err) {
    console.error('Failed to fetch Material metadata:', err);
    return [];
  }
}

function findStyleFiles(data: { files?: Array<{ name: string; files?: Array<{ name: string }> }> }, style: string): Array<{ name: string }> {
  if (!data.files) return [];

  for (var i = 0; i < data.files.length; i++) {
    var entry = data.files[i];
    if (entry.name === style && entry.files) {
      return entry.files;
    }
  }
  return [];
}

async function fetchPulsMetadata(): Promise<IconMeta[]> {
  try {
    var resp = await fetch(PULS_ICONS_JSON_URL);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    var entries: PulsIconEntry[] = await resp.json();
    return entries.map(function (e) {
      return {
        name: e.name,
        source: 'puls' as IconSource,
        keywords: e.keywords,
        file: e.file,
      };
    });
  } catch (err) {
    console.warn('Puls icons not available:', err);
    return [];
  }
}

// --- Filtering ---
function applyFilters() {
  filteredIcons = allIcons.filter(function (icon) {
    if (activeSource !== 'all' && icon.source !== activeSource) return false;
    if (!searchQuery) return true;

    if (icon.name.indexOf(searchQuery) !== -1) return true;
    // Also match with underscores replaced by spaces
    if (icon.name.replace(/_/g, ' ').indexOf(searchQuery) !== -1) return true;
    // Check keywords for Puls icons
    if (icon.keywords) {
      for (var i = 0; i < icon.keywords.length; i++) {
        if (icon.keywords[i].toLowerCase().indexOf(searchQuery) !== -1) return true;
      }
    }
    return false;
  });

  displayedCount = 0;
  grid.innerHTML = '';
  selectedIcon = null;
  bottomBar.style.display = 'none';

  if (filteredIcons.length === 0) {
    emptyState.style.display = 'flex';
    grid.style.display = 'none';
  } else {
    emptyState.style.display = 'none';
    grid.style.display = 'grid';
    loadMore();
  }
}

// --- Rendering ---
function loadMore() {
  var end = Math.min(displayedCount + PAGE_SIZE, filteredIcons.length);
  var fragment = document.createDocumentFragment();

  for (var i = displayedCount; i < end; i++) {
    fragment.appendChild(createIconCell(filteredIcons[i]));
  }

  // Remove old sentinel if exists
  var oldSentinel = grid.querySelector('.scroll-sentinel');
  if (oldSentinel) oldSentinel.remove();

  grid.appendChild(fragment);
  displayedCount = end;

  // Add sentinel for infinite scroll if there are more icons
  if (displayedCount < filteredIcons.length) {
    var sentinel = document.createElement('div');
    sentinel.className = 'scroll-sentinel';
    grid.appendChild(sentinel);
    setupScrollObserver(sentinel);
  }
}

function createIconCell(icon: IconMeta): HTMLDivElement {
  var cell = document.createElement('div');
  cell.className = 'icon-cell';
  cell.title = icon.name + ' (' + icon.source + ')';

  var preview = document.createElement('div');
  preview.className = 'icon-preview';
  cell.appendChild(preview);

  var nameEl = document.createElement('div');
  nameEl.className = 'icon-name';
  nameEl.textContent = icon.name.replace(/_/g, ' ');
  cell.appendChild(nameEl);

  // Lazy load SVG
  setupLazyLoad(preview, icon);

  cell.addEventListener('click', function () { selectIcon(icon, cell); });
  cell.addEventListener('dblclick', function () { insertIcon(icon); });

  return cell;
}

function setupLazyLoad(container: HTMLDivElement, icon: IconMeta) {
  // Defer observation to next frame so the element is in the DOM and laid out
  requestAnimationFrame(function () {
    var observer = new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          loadSvgPreview(container, icon);
        }
      },
      { root: grid, rootMargin: '200px' }
    );
    observer.observe(container);
  });
}

async function loadSvgPreview(container: HTMLDivElement, icon: IconMeta) {
  var svgUrl = getSvgUrl(icon);
  var svg = svgCache.get(svgUrl);

  if (!svg) {
    try {
      var resp = await fetch(svgUrl);
      if (!resp.ok) return;
      svg = await resp.text();
      svgCache.set(svgUrl, svg);
    } catch (e) {
      return;
    }
  }

  container.innerHTML = svg;
}

function setupScrollObserver(sentinel: HTMLDivElement) {
  var observer = new IntersectionObserver(
    function (entries) {
      if (entries[0].isIntersecting) {
        observer.disconnect();
        loadMore();
      }
    },
    { root: grid, rootMargin: '200px' }
  );
  observer.observe(sentinel);
}

// --- Selection & Insertion ---
function selectIcon(icon: IconMeta, cell: HTMLDivElement) {
  // Remove previous selection
  var prev = grid.querySelector('.icon-cell.selected');
  if (prev) prev.classList.remove('selected');

  cell.classList.add('selected');
  selectedIcon = icon;

  selectedNameEl.textContent = icon.name.replace(/_/g, ' ');
  selectedSourceEl.textContent = icon.source === 'material' ? 'Material' : 'Puls';
  bottomBar.style.display = 'flex';
}

async function insertIcon(icon: IconMeta) {
  var svgUrl = getSvgUrl(icon);
  var svg = svgCache.get(svgUrl);

  if (!svg) {
    try {
      var resp = await fetch(svgUrl);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      svg = await resp.text();
      svgCache.set(svgUrl, svg);
    } catch (err) {
      console.error('Failed to fetch SVG:', err);
      return;
    }
  }

  parent.postMessage(
    { pluginMessage: { type: 'insert-icon', svg: svg, name: icon.name } },
    '*'
  );
}

// --- Helpers ---
function getSvgUrl(icon: IconMeta): string {
  if (icon.source === 'puls' && icon.file) {
    return PULS_SVG_BASE + icon.file;
  }
  // Material: build URL from style + fill + name
  var fileName = materialFill ? icon.name + '-fill.svg' : icon.name + '.svg';
  return MATERIAL_CDN_BASE + materialStyle + '/' + fileName;
}
