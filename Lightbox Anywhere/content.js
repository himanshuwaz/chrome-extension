(function() {
  if (window.__gptLightboxInjected) {
    // show a tiny toast and bail
    showToast('Lightbox is already active on this page.');
    return;
  }
  window.__gptLightboxInjected = true;

  // Core state
  const state = {
    images: [], // {src, el}
    index: 0,
    overlay: null,
    imgEl: null,
    counterEl: null
  };

  // Gather candidate images (ignore very small or invisible ones)
  function collectImages() {
    const imgs = Array.from(document.images || [])
      .filter(img => {
        const rect = img.getBoundingClientRect();
        const min = 96; // filter out tiny icons
        return rect.width >= min && rect.height >= min && isElementVisible(img);
      })
      .map(img => {
        // Prefer anchor href if it points to an image
        const link = img.closest('a');
        const href = link && link.getAttribute('href');
        const useHref = href && /\.(png|jpe?g|gif|webp|bmp|svg|avif)(\?.*)?$/i.test(href);
        return { src: useHref ? href : img.currentSrc || img.src, el: img };
      });

    // Deduplicate by src
    const seen = new Set();
    state.images = imgs.filter(i => {
      if (!i.src || seen.has(i.src)) return false;
      seen.add(i.src);
      return true;
    });
  }

  function isElementVisible(el) {
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none' || parseFloat(style.opacity) === 0) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  // Build overlay once
  function buildOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'gpt-lightbox-overlay';
    overlay.innerHTML = `
      <div class="gpt-lb-stage">
        <button class="gpt-lb-control gpt-lb-prev" aria-label="Previous">◀</button>
        <img class="gpt-lb-img" alt="Lightbox image"/>
        <button class="gpt-lb-control gpt-lb-next" aria-label="Next">▶</button>
        <button class="gpt-lb-control gpt-lb-close" aria-label="Close">✕</button>
        <div class="gpt-lb-counter" aria-live="polite"></div>
      </div>
    `;
    document.documentElement.appendChild(overlay);

    // cache
    state.overlay = overlay;
    state.imgEl = overlay.querySelector('.gpt-lb-img');
    state.counterEl = overlay.querySelector('.gpt-lb-counter');

    // events
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) hide();
    });
    overlay.querySelector('.gpt-lb-prev').addEventListener('click', prev);
    overlay.querySelector('.gpt-lb-next').addEventListener('click', next);
    overlay.querySelector('.gpt-lb-close').addEventListener('click', hide);

    // Keyboard nav
    document.addEventListener('keydown', onKeyDown, { capture: true });
  }

  function onKeyDown(e) {
    if (!state.overlay || !state.overlay.classList.contains('visible')) return;
    if (e.key === 'Escape') hide();
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  }

  function show(index) {
    if (!state.overlay) buildOverlay();
    state.index = (index ?? 0 + state.images.length) % state.images.length;
    const item = state.images[state.index];
    if (!item) return;
    state.imgEl.src = '';
    // Preload image then display to avoid flashing
    const pre = new Image();
    pre.onload = () => {
      state.imgEl.src = pre.src;
      state.overlay.classList.add('visible');
      updateCounter();
    };
    pre.onerror = () => {
      state.imgEl.src = item.src;
      state.overlay.classList.add('visible');
      updateCounter();
    };
    pre.src = item.src;
  }

  function hide() {
    if (state.overlay) state.overlay.classList.remove('visible');
  }

  function prev() {
    state.index = (state.index - 1 + state.images.length) % state.images.length;
    show(state.index);
  }

  function next() {
    state.index = (state.index + 1) % state.images.length;
    show(state.index);
  }

  function updateCounter() {
    if (!state.counterEl) return;
    state.counterEl.textContent = `${state.index + 1} / ${state.images.length}`;
  }

  // Click -> open
  function onDocClick(e) {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const img = target.closest('img');
    // if clicked an actual image on the page
    if (img) {
      e.preventDefault();
      e.stopPropagation();
      collectImages();
      // find index by comparing src/href
      const link = img.closest('a');
      const href = link && link.getAttribute('href');
      const needle = (href && /\.(png|jpe?g|gif|webp|bmp|svg|avif)(\?.*)?$/i.test(href))
        ? href
        : (img.currentSrc || img.src);
      const idx = state.images.findIndex(i => i.src === needle);
      show(idx >= 0 ? idx : 0);
    }
  }

  // Toast helper
  function showToast(msg) {
    let toast = document.getElementById('gpt-lightbox-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'gpt-lightbox-toast';
      document.documentElement.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1600);
  }
  window.showToast = showToast;

  // Init
  collectImages();
  if (!document.__gptLightboxClickHandler) {
    document.__gptLightboxClickHandler = onDocClick;
    document.addEventListener('click', onDocClick, true);
  }
  showToast('Lightbox enabled. Click any image to open.');
})();