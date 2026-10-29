(function () {
  function setupDeck(deck) {
    if (!deck || deck.dataset.ready) return;
    const track = deck.querySelector('[data-track]');
    if (!track) return;
    const cards = Array.from(track.querySelectorAll('[data-card]'));
    if (!cards.length) return;
    deck.dataset.ready = '1';
    const now = deck.querySelector('[data-now]');
    const dots = Array.from(deck.querySelectorAll('[data-to]'));
    let current = 0;
    let dragging = false;
    let startX = 0;
    let startLeft = 0;
    let moved = false;
    let dragStartIndex = 0;
    let lastDx = 0;
    let ignoreScrollUntil = 0;

    const setCurrent = (i) => {
      current = Math.max(0, Math.min(cards.length - 1, i));
      if (now) now.textContent = String(current + 1).padStart(2, '0');
      dots.forEach((d, n) => d.classList.toggle('on', n === current));
    };

    const goTo = (i) => {
      setCurrent(i);
      ignoreScrollUntil = Date.now() + 650;
      track.scrollTo({ left: cards[current].offsetLeft - track.offsetLeft, behavior: 'smooth' });
    };

    deck.querySelector('[data-prev]')?.addEventListener('click', () => goTo(current - 1));
    deck.querySelector('[data-next]')?.addEventListener('click', () => goTo(current + 1));
    dots.forEach((dot) => dot.addEventListener('click', () => goTo(Number(dot.dataset.to))));

    let scrollTimer = 0;
    track.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        if (dragging || Date.now() < ignoreScrollUntil) return;
        const left = track.scrollLeft;
        let nearest = 0;
        let distance = Infinity;
        cards.forEach((card, i) => {
          const d = Math.abs(card.offsetLeft - track.offsetLeft - left);
          if (d < distance) { distance = d; nearest = i; }
        });
        setCurrent(nearest);
      }, 70);
    }, { passive: true });

    track.addEventListener('dragstart', (e) => e.preventDefault());
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      dragging = true;
      moved = false;
      dragStartIndex = current;
      lastDx = 0;
      startX = e.clientX;
      startLeft = track.scrollLeft;
      track.setPointerCapture?.(e.pointerId);
      track.style.scrollBehavior = 'auto';
    });
    track.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      lastDx = dx;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = startLeft - dx;
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      track.style.scrollBehavior = '';
      if (!moved) return;
      if (lastDx < -44) goTo(dragStartIndex + 1);
      else if (lastDx > 44) goTo(dragStartIndex - 1);
      else goTo(dragStartIndex);
    };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('pointerleave', endDrag);
    track.addEventListener('click', (e) => {
      if (!moved) return;
      e.preventDefault();
      e.stopPropagation();
      moved = false;
    }, true);

    deck.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1); }
    });
    setCurrent(0);
  }

  window.initArticleDecks = function (root) {
    (root || document).querySelectorAll('[data-deck]').forEach(setupDeck);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.initArticleDecks(document), { once: true });
  } else {
    window.initArticleDecks(document);
  }
})();
