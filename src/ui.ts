import { IconMeta, IconSource, PulsIconEntry } from './types';

// --- Configuration ---
const MATERIAL_METADATA_URL = 'https://data.jsdelivr.com/v1/packages/npm/@material-symbols/svg-400';
const MATERIAL_SVG_BASE = 'https://cdn.jsdelivr.net/npm/@material-symbols/svg-400@latest/outlined/';
const PULS_REPO = 'dips/puls-icons';
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

// --- Initialization ---
init();

async function init() {
  setupEventListeners();
  await loadMetadata();
}

function setupEventListeners() {
  searchInput.addEventListener('input', () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery = searchInput.value.trim().toLowerCase();
      applyFilters();
    }, 200);
  });

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      activeSource = (tab.getAttribute('data-source') || 'all') as 'all' | IconSource;
      applyFilters();
    });
  });

  insertBtn.addEventListener('click', () => {
    if (selectedIcon) insertIcon(selectedIcon);
  });
}

// --- Metadata loading ---
async function loadMetadata() {
  loadingState.style.display = 'flex';
  grid.style.display = 'none';
  emptyState.style.display = 'none';

  const [materialIcons, pulsIcons] = await Promise.all([
    fetchMaterialMetadata(),
    fetchPulsMetadata(),
  ]);

  allIcons = [...materialIcons, ...pulsIcons];
  loadingState.style.display = 'none';
  grid.style.display = 'grid';
  applyFilters();
}

async function fetchMaterialMetadata(): Promise<IconMeta[]> {
  try {
    const resp = await fetch(MATERIAL_METADATA_URL);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();

    // Navigate to /outlined directory in the file tree
    const files: Array<{ name: string }> = findOutlinedFiles(data);
    return files
      .filter((f: { name: string }) => f.name.endsWith('.svg'))
      .map((f: { name: string }) => ({
        name: f.name.replace('.svg', ''),
        source: 'material' as IconSource,
      }));
  } catch (err) {
    console.error('Failed to fetch Material metadata:', err);
    return [];
  }
}

function findOutlinedFiles(data: { files?: Array<{ name: string; files?: Array<{ name: string }> }> }): Array<{ name: string }> {
  if (!data.files) return [];

  for (let i = 0; i < data.files.length; i++) {
    const entry = data.files[i];
    if (entry.name === 'outlined' && entry.files) {
      return entry.files;
    }
  }
  return [];
}

async function fetchPulsMetadata(): Promise<IconMeta[]> {
  try {
    const resp = await fetch(PULS_ICONS_JSON_URL);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const entries: PulsIconEntry[] = await resp.json();
    return entries.map((e) => ({
      name: e.name,
      source: 'puls' as IconSource,
      keywords: e.keywords,
      file: e.file,
    }));
  } catch (err) {
    console.warn('Puls icons not available:', err);
    return [];
  }
}

// --- Filtering ---
function applyFilters() {
  filteredIcons = allIcons.filter((icon) => {
    if (activeSource !== 'all' && icon.source !== activeSource) return false;
    if (!searchQuery) return true;

    if (icon.name.indexOf(searchQuery) !== -1) return true;
    // Also match with underscores replaced by spaces
    if (icon.name.replace(/_/g, ' ').indexOf(searchQuery) !== -1) return true;
    // Check keywords for Puls icons
    if (icon.keywords) {
      for (let i = 0; i < icon.keywords.length; i++) {
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
  const end = Math.min(displayedCount + PAGE_SIZE, filteredIcons.length);
  const fragment = document.createDocumentFragment();

  for (let i = displayedCount; i < end; i++) {
    fragment.appendChild(createIconCell(filteredIcons[i]));
  }

  // Remove old sentinel if exists
  const oldSentinel = grid.querySelector('.scroll-sentinel');
  if (oldSentinel) oldSentinel.remove();

  grid.appendChild(fragment);
  displayedCount = end;

  // Add sentinel for infinite scroll if there are more icons
  if (displayedCount < filteredIcons.length) {
    const sentinel = document.createElement('div');
    sentinel.className = 'scroll-sentinel';
    grid.appendChild(sentinel);
    setupScrollObserver(sentinel);
  }
}

function createIconCell(icon: IconMeta): HTMLDivElement {
  const cell = document.createElement('div');
  cell.className = 'icon-cell';
  cell.title = icon.name + ' (' + icon.source + ')';

  const preview = document.createElement('div');
  preview.className = 'icon-preview';
  cell.appendChild(preview);

  const nameEl = document.createElement('div');
  nameEl.className = 'icon-name';
  nameEl.textContent = icon.name.replace(/_/g, ' ');
  cell.appendChild(nameEl);

  // Lazy load SVG
  setupLazyLoad(preview, icon);

  cell.addEventListener('click', () => selectIcon(icon, cell));
  cell.addEventListener('dblclick', () => insertIcon(icon));

  return cell;
}

function setupLazyLoad(container: HTMLDivElement, icon: IconMeta) {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        observer.disconnect();
        loadSvgPreview(container, icon);
      }
    },
    { root: grid, rootMargin: '100px' }
  );
  observer.observe(container);
}

async function loadSvgPreview(container: HTMLDivElement, icon: IconMeta) {
  const svgUrl = getSvgUrl(icon);
  let svg = svgCache.get(svgUrl);

  if (!svg) {
    try {
      const resp = await fetch(svgUrl);
      if (!resp.ok) return;
      svg = await resp.text();
      svgCache.set(svgUrl, svg);
    } catch {
      return;
    }
  }

  container.innerHTML = svg;
}

function setupScrollObserver(sentinel: HTMLDivElement) {
  const observer = new IntersectionObserver(
    (entries) => {
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
  const prev = grid.querySelector('.icon-cell.selected');
  if (prev) prev.classList.remove('selected');

  cell.classList.add('selected');
  selectedIcon = icon;

  selectedNameEl.textContent = icon.name.replace(/_/g, ' ');
  selectedSourceEl.textContent = icon.source === 'material' ? 'Material' : 'Puls';
  bottomBar.style.display = 'flex';
}

async function insertIcon(icon: IconMeta) {
  const svgUrl = getSvgUrl(icon);
  let svg = svgCache.get(svgUrl);

  if (!svg) {
    try {
      const resp = await fetch(svgUrl);
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
  return MATERIAL_SVG_BASE + icon.name + '.svg';
}
