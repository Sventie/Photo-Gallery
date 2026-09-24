// ============================================================================
// Konfiguration - hier kannst du Timing und Passwort anpassen.
// ============================================================================

const PAGE_DURATION_MS = 5000; // Auto-Play: Anzeigedauer pro Seite
const SITE_PASSWORD = 'aendere-mich'; // Passwort fuer den client-seitigen Zugriffsschutz
const PASSWORD_STORAGE_KEY = 'slideshow-unlocked';

const KNOWN_LAYOUTS = ['single', 'grid', 'carousel'];
const DEFAULT_LAYOUT = 'single';

// ============================================================================
// Zustand
// ============================================================================

let pages = [];
let currentPageIndex = 0;
let autoPlayTimer = null;
let isAutoPlaying = false;

// Zustand des Karussells der aktuell angezeigten Seite (falls layout=carousel)
let carouselImageIndex = 0;

// ============================================================================
// Passwortschutz
// ============================================================================

function initPasswordGate() {
  const overlay = document.getElementById('password-overlay');
  const app = document.getElementById('app');
  const input = document.getElementById('password-input');
  const submitBtn = document.getElementById('password-submit');
  const error = document.getElementById('password-error');

  const unlock = () => {
    overlay.remove();
    app.hidden = false;
    init();
  };

  try {
    if (localStorage.getItem(PASSWORD_STORAGE_KEY) === 'true') {
      unlock();
      return;
    }
  } catch (e) {
    // localStorage evtl. nicht verfuegbar (z.B. Privatmodus) - einfach jedes Mal fragen
  }

  const tryUnlock = () => {
    if (input.value === SITE_PASSWORD) {
      try {
        localStorage.setItem(PASSWORD_STORAGE_KEY, 'true');
      } catch (e) {
        // ignorieren, wenn localStorage nicht verfuegbar ist
      }
      unlock();
    } else {
      error.classList.add('visible');
    }
  };

  submitBtn.addEventListener('click', tryUnlock);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') tryUnlock();
  });
}

// ============================================================================
// Daten laden
// ============================================================================

async function loadPages() {
  const listResponse = await fetch('pages.json');
  const folderNames = await listResponse.json();

  const loaded = [];
  for (const folder of folderNames) {
    try {
      const res = await fetch(`pages/${folder}/page.json`);
      if (!res.ok) throw new Error(`page.json nicht gefunden fuer ${folder}`);
      const data = await res.json();
      loaded.push({
        folder,
        title: data.title || '',
        text: data.text || '',
        layout: normalizeLayout(data.layout, data.images),
        images: Array.isArray(data.images) ? data.images : [],
      });
    } catch (err) {
      console.warn(`Seite "${folder}" konnte nicht geladen werden, wird uebersprungen.`, err);
    }
  }
  return loaded;
}

function normalizeLayout(layout, images) {
  if (KNOWN_LAYOUTS.includes(layout)) return layout;
  console.warn(`Unbekanntes Layout "${layout}", falle auf Standard-Layout zurueck.`);
  return Array.isArray(images) && images.length > 1 ? 'grid' : DEFAULT_LAYOUT;
}

// ============================================================================
// Rendering
// ============================================================================

function renderCurrentPage() {
  const container = document.getElementById('slide-container');
  container.innerHTML = '';

  if (pages.length === 0) {
    container.innerHTML = '<p>Keine Seiten gefunden.</p>';
    updatePageCounter();
    return;
  }

  const page = pages[currentPageIndex];
  carouselImageIndex = 0;

  const card = document.createElement('div');
  card.className = 'card';

  const imagesArea = document.createElement('div');
  switch (page.layout) {
    case 'grid':
      imagesArea.appendChild(renderGrid(page));
      break;
    case 'carousel':
      imagesArea.appendChild(renderCarousel(page));
      break;
    case 'single':
    default:
      imagesArea.appendChild(renderSingle(page));
      break;
  }
  card.appendChild(imagesArea);

  const textArea = document.createElement('div');
  textArea.className = 'slide-text';
  const title = document.createElement('h4');
  title.className = 'slide-title';
  title.textContent = page.title;
  const text = document.createElement('p');
  text.textContent = page.text;
  textArea.appendChild(title);
  textArea.appendChild(text);
  card.appendChild(textArea);

  container.appendChild(card);
  updatePageCounter();
}

function imageUrl(page, filename) {
  return `pages/${page.folder}/${filename}`;
}

function renderSingle(page) {
  const wrap = document.createElement('div');
  wrap.className = 'layout-single';
  const img = document.createElement('img');
  const firstImage = page.images[0];
  if (firstImage) {
    img.src = imageUrl(page, firstImage);
    img.alt = page.title;
  }
  wrap.appendChild(img);
  return wrap;
}

function renderGrid(page) {
  const wrap = document.createElement('div');
  wrap.className = 'layout-grid';
  page.images.forEach((filename) => {
    const img = document.createElement('img');
    img.src = imageUrl(page, filename);
    img.alt = page.title;
    wrap.appendChild(img);
  });
  return wrap;
}

function renderCarousel(page) {
  const wrap = document.createElement('div');
  wrap.className = 'layout-carousel';

  const viewport = document.createElement('div');
  viewport.className = 'carousel-viewport';
  const img = document.createElement('img');
  img.src = imageUrl(page, page.images[carouselImageIndex]);
  img.alt = page.title;
  viewport.appendChild(img);

  if (page.images.length > 1) {
    const prevArrow = document.createElement('button');
    prevArrow.className = 'btn-floating carousel-arrow prev';
    prevArrow.innerHTML = '<i class="material-icons">chevron_left</i>';
    prevArrow.addEventListener('click', () => moveCarousel(page, -1));

    const nextArrow = document.createElement('button');
    nextArrow.className = 'btn-floating carousel-arrow next';
    nextArrow.innerHTML = '<i class="material-icons">chevron_right</i>';
    nextArrow.addEventListener('click', () => moveCarousel(page, 1));

    viewport.appendChild(prevArrow);
    viewport.appendChild(nextArrow);
  }

  wrap.appendChild(viewport);

  if (page.images.length > 1) {
    const dots = document.createElement('div');
    dots.className = 'carousel-dots';
    page.images.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === carouselImageIndex ? ' active' : '');
      dot.addEventListener('click', () => {
        carouselImageIndex = i;
        stopAutoPlay();
        renderCurrentPage();
      });
      dots.appendChild(dot);
    });
    wrap.appendChild(dots);
  }

  return wrap;
}

function moveCarousel(page, delta) {
  stopAutoPlay();
  const count = page.images.length;
  carouselImageIndex = (carouselImageIndex + delta + count) % count;
  renderCurrentPage();
}

function updatePageCounter() {
  const counter = document.getElementById('page-counter');
  if (pages.length === 0) {
    counter.textContent = '– / –';
  } else {
    counter.textContent = `${currentPageIndex + 1} / ${pages.length}`;
  }
}

// ============================================================================
// Seiten-Navigation
// ============================================================================

function goToNextPage() {
  if (pages.length === 0) return;
  currentPageIndex = (currentPageIndex + 1) % pages.length;
  renderCurrentPage();
}

function goToPrevPage() {
  if (pages.length === 0) return;
  currentPageIndex = (currentPageIndex - 1 + pages.length) % pages.length;
  renderCurrentPage();
}

// ============================================================================
// Auto-Play
// ============================================================================

function resetProgressBar() {
  const bar = document.getElementById('autoplay-progress-bar');
  bar.style.transition = 'none';
  bar.style.width = '0%';
}

function startProgressBarAnimation() {
  const bar = document.getElementById('autoplay-progress-bar');
  resetProgressBar();
  void bar.offsetWidth; // Reflow erzwingen, damit die Transition sauber neu startet
  bar.style.transition = `width ${PAGE_DURATION_MS}ms linear`;
  bar.style.width = '100%';
}

function startAutoPlay() {
  isAutoPlaying = true;
  document.querySelector('#play-pause-btn i').textContent = 'pause';
  startProgressBarAnimation();
  autoPlayTimer = setInterval(() => {
    goToNextPage();
    startProgressBarAnimation();
  }, PAGE_DURATION_MS);
}

function stopAutoPlay() {
  isAutoPlaying = false;
  document.querySelector('#play-pause-btn i').textContent = 'play_arrow';
  resetProgressBar();
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer);
    autoPlayTimer = null;
  }
}

function toggleAutoPlay() {
  if (isAutoPlaying) {
    stopAutoPlay();
  } else {
    startAutoPlay();
  }
}

// ============================================================================
// Initialisierung
// ============================================================================

async function init() {
  document.getElementById('prev-btn').addEventListener('click', () => {
    stopAutoPlay();
    goToPrevPage();
  });
  document.getElementById('next-btn').addEventListener('click', () => {
    stopAutoPlay();
    goToNextPage();
  });
  document.getElementById('play-pause-btn').addEventListener('click', toggleAutoPlay);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      stopAutoPlay();
      goToNextPage();
    } else if (e.key === 'ArrowLeft') {
      stopAutoPlay();
      goToPrevPage();
    }
  });

  try {
    pages = await loadPages();
  } catch (err) {
    console.error('Seiten konnten nicht geladen werden.', err);
    pages = [];
  }
  renderCurrentPage();
}

initPasswordGate();
