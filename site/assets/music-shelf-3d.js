(function () {
  if (window.JerryShelf3D) return;

  var palette = [0xE8FF4F, 0xFF4D9D, 0x5CE1E6, 0xB18CFF];

  function mod(n, m) { return ((n % m) + m) % m; }
  function wrap(v, n) { v = mod(v, n); if (v > n / 2) v -= n; return v; }
  function damp(current, target, lambda, dt) { return current + (target - current) * (1 - Math.exp(-lambda * dt)); }

  function fallbackTexture(track, index) {
    var c = document.createElement('canvas');
    c.width = c.height = 320;
    var x = c.getContext('2d');
    var hue = (index * 37 + 190) % 360;
    var g = x.createLinearGradient(0, 0, 320, 320);
    g.addColorStop(0, 'hsl(' + hue + ' 46% 18%)');
    g.addColorStop(0.55, 'hsl(' + ((hue + 50) % 360) + ' 62% 42%)');
    g.addColorStop(1, 'hsl(' + ((hue + 110) % 360) + ' 70% 58%)');
    x.fillStyle = g; x.fillRect(0, 0, 320, 320);
    x.globalAlpha = 0.18;
    x.fillStyle = '#fff';
    for (var y = 0; y < 320; y += 10) for (var xx = 0; xx < 320; xx += 10) x.fillRect(xx, y, 2, 2);
    x.globalAlpha = 1;
    x.fillStyle = 'rgba(8,8,14,.55)';
    x.fillRect(0, 190, 320, 130);
    x.fillStyle = '#fff';
    x.font = '900 28px sans-serif';
    x.fillText(String(track.name || '').slice(0, 12), 20, 240);
    x.fillStyle = '#E8FF4F';
    x.font = '700 16px monospace';
    x.fillText(String(track.artists || '').slice(0, 18), 20, 270);
    x.strokeStyle = 'rgba(255,255,255,.35)';
    x.lineWidth = 6; x.strokeRect(3, 3, 314, 314);
    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function coverTexture(track, index, cache, onReady) {
    var key = track.id || track.cover || ('track-' + index);
    if (cache.has(key)) return cache.get(key);
    var fallback = fallbackTexture(track, index);
    cache.set(key, fallback);
    if (!track.cover) return fallback;
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      var c = document.createElement('canvas');
      c.width = c.height = 320;
      var x = c.getContext('2d');
      var side = Math.min(img.width, img.height);
      x.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 320, 320);
      x.fillStyle = 'rgba(6,6,14,.16)';
      x.fillRect(0, 0, 320, 320);
      var tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      cache.set(key, tex);
      onReady(key, tex);
    };
    img.onerror = function () {};
    img.src = track.cover;
    return fallback;
  }

  function mount(container, callbacks) {
    if (!container || !window.THREE) return null;
    callbacks = callbacks || {};
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;
    renderer.domElement.id = 'shelfCanvas';
    container.appendChild(renderer.domElement);
    container.classList.add('webgl-ready');

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
    var world = new THREE.Group();
    scene.add(world);

    scene.add(new THREE.AmbientLight(0xffffff, 0.72));
    var key = new THREE.DirectionalLight(0xffffff, 1.7);
    key.position.set(4, 7, 9);
    scene.add(key);
    var pink = new THREE.PointLight(0xFF4D9D, 14, 24, 2);
    pink.position.set(-5, 1.5, 4);
    scene.add(pink);
    var cyan = new THREE.PointLight(0x5CE1E6, 11, 24, 2);
    cyan.position.set(5, 2, 3);
    scene.add(cyan);

    var pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(2.8, 2.95, 0.16, 80),
      new THREE.MeshStandardMaterial({ color: 0x0b0b12, metalness: 0.72, roughness: 0.25 })
    );
    pedestal.position.set(0, -1.62, -0.25);
    world.add(pedestal);
    var ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.76, 0.016, 12, 140),
      new THREE.MeshBasicMaterial({ color: 0xE8FF4F })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, -1.52, -0.25);
    world.add(ring);
    var glow = new THREE.Mesh(
      new THREE.CircleGeometry(2.35, 64),
      new THREE.MeshBasicMaterial({ color: 0xFF4D9D, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(0, -1.51, -0.25);
    world.add(glow);

    var particleGeo = new THREE.BufferGeometry();
    var positions = new Float32Array(150 * 3);
    for (var pi = 0; pi < 150; pi++) {
      positions[pi * 3] = (Math.random() - 0.5) * 16;
      positions[pi * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[pi * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var particles = new THREE.Points(particleGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.028, transparent: true, opacity: 0.42,
      depthWrite: false, blending: THREE.AdditiveBlending
    }));
    world.add(particles);

    var boxGeo = new THREE.BoxGeometry(2.08, 2.08, 0.09);
    var discGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.035, 64);
    discGeo.rotateX(Math.PI / 2);
    var labelGeo = new THREE.CircleGeometry(0.33, 48);
    var holeGeo = new THREE.CircleGeometry(0.035, 24);
    var discMat = new THREE.MeshStandardMaterial({ color: 0x0a0a10, metalness: 0.5, roughness: 0.3 });
    var holeMat = new THREE.MeshBasicMaterial({ color: 0x05050a });
    var edgeMat = new THREE.MeshStandardMaterial({ color: 0xE8DCC8, metalness: 0.08, roughness: 0.72 });

    var placeholderCanvas = document.createElement('canvas');
    placeholderCanvas.width = placeholderCanvas.height = 320;
    var pctx = placeholderCanvas.getContext('2d');
    var pg = pctx.createLinearGradient(0, 0, 320, 320);
    pg.addColorStop(0, '#24203a'); pg.addColorStop(1, '#0f0e1c');
    pctx.fillStyle = pg; pctx.fillRect(0, 0, 320, 320);
    pctx.strokeStyle = 'rgba(255,255,255,.25)'; pctx.lineWidth = 6; pctx.strokeRect(3, 3, 314, 314);
    var placeholderTex = new THREE.CanvasTexture(placeholderCanvas);
    placeholderTex.colorSpace = THREE.SRGBColorSpace;

    var tracks = [];
    var cards = [];
    var textureCache = new Map();
    var n = 0;
    var focus = 0;
    var targetFocus = 0;
    var visualFocus = 0;
    var current = -1;
    var spacing = 2.1;
    var maxOffset = 4.7;
    var dragging = null;
    var pointerX = 0;
    var pointerY = 0;
    var raf = 0;
    var last = performance.now();
    var selectedLift = 0;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function textureReady(key, tex) {
      cards.forEach(function (card) {
        if (card.userData.trackId !== key) return;
        card.userData.frontMat.map = tex;
        card.userData.frontMat.needsUpdate = true;
        card.userData.backMat.map = tex;
        card.userData.backMat.needsUpdate = true;
      });
    }

    function disposeCards() {
      cards.forEach(function (card) {
        world.remove(card);
        card.userData.frontMat.dispose();
        card.userData.backMat.dispose();
        card.userData.labelMat.dispose();
      });
      cards = [];
    }

    function buildCards() {
      disposeCards();
      n = tracks.length;
      for (var i = 0; i < n; i++) {
        var track = tracks[i];
        var frontMat = new THREE.MeshStandardMaterial({
          map: placeholderTex, roughness: 0.58, metalness: 0.05, color: 0xffffff
        });
        var backMat = new THREE.MeshStandardMaterial({
          map: placeholderTex, roughness: 0.8, metalness: 0.02, color: 0x9a94a8
        });
        var labelMat = new THREE.MeshBasicMaterial({ color: palette[i % palette.length] });
        var card = new THREE.Group();
        card.userData.isCard = true;
        card.userData.index = i;
        card.userData.trackId = track.id || track.cover || ('track-' + i);
        card.userData.frontMat = frontMat;
        card.userData.backMat = backMat;
        card.userData.labelMat = labelMat;
        card.userData.texState = '';
        var box = new THREE.Mesh(boxGeo, [edgeMat, edgeMat, edgeMat, edgeMat, frontMat, backMat]);
        card.add(box);
        var disc = new THREE.Mesh(discGeo, discMat);
        disc.position.set(0.3, 0, -0.13);
        card.add(disc);
        var label = new THREE.Mesh(labelGeo, labelMat);
        label.position.set(0.3, 0, -0.085);
        card.add(label);
        var hole = new THREE.Mesh(holeGeo, holeMat);
        hole.position.set(0.3, 0, -0.06);
        card.add(hole);
        card.visible = false;
        world.add(card);
        cards.push(card);
      }
    }

    function ensureTexture(card) {
      if (card.userData.texState) return;
      var index = card.userData.index;
      var track = tracks[index];
      if (!track) return;
      card.userData.texState = 'loading';
      var tex = coverTexture(track, index, textureCache, textureReady);
      card.userData.frontMat.map = tex;
      card.userData.frontMat.needsUpdate = true;
      card.userData.backMat.map = tex;
      card.userData.backMat.needsUpdate = true;
    }

    function setTracks(list) {
      tracks = Array.isArray(list) ? list.slice() : [];
      n = tracks.length;
      focus = 0; targetFocus = 0; visualFocus = 0; current = -1;
      buildCards();
      layout(0, true);
    }

    function setFocus(index, cur) {
      if (!n) return;
      focus = mod(index, n);
      targetFocus = focus;
      if (cur != null) current = cur;
    }

    function setCurrent(index) {
      current = index;
    }

    function setPlaying() {}

    function layout(dt, immediate) {
      if (!n) return;
      spacing = container.clientWidth < 640 ? 1.45 : 2.1;
      maxOffset = container.clientWidth < 640 ? 2.65 : 4.75;
      var delta = wrap(targetFocus - visualFocus, n);
      if (immediate) visualFocus = targetFocus;
      else visualFocus += delta * (1 - Math.exp(-10 * dt));
      var now = performance.now();
      cards.forEach(function (card, index) {
        var off = wrap(index - visualFocus, n);
        if (Math.abs(off) > maxOffset) { card.visible = false; return; }
        card.visible = true;
        ensureTexture(card);
        var abs = Math.abs(off);
        var x = off * spacing;
        var y = (abs < 0.5 ? 0.16 : 0.02) + Math.sin(now * 0.001 + index) * 0.022;
        var z = -abs * (container.clientWidth < 640 ? 0.56 : 0.82) + (abs < 0.5 ? 0.35 : 0);
        var rotY = -Math.max(-1, Math.min(1, off)) * (container.clientWidth < 640 ? 0.3 : 0.34);
        var scale = abs < 0.5 ? 1 : Math.max(0.68, 1 - abs * 0.065);
        if (immediate) {
          card.position.set(x, y, z);
          card.rotation.set(0, rotY, 0);
          card.scale.set(scale, scale, scale);
        } else {
          card.position.x = damp(card.position.x, x, 11, dt);
          card.position.y = damp(card.position.y, y, 11, dt);
          card.position.z = damp(card.position.z, z, 11, dt);
          card.rotation.y = damp(card.rotation.y, rotY, 11, dt);
          card.scale.x = damp(card.scale.x, scale, 11, dt);
          card.scale.y = damp(card.scale.y, scale, 11, dt);
          card.scale.z = damp(card.scale.z, scale, 11, dt);
        }
        var active = index === current;
        card.userData.frontMat.emissive.setHex(active ? 0x232300 : 0x000000);
        card.userData.frontMat.emissiveIntensity = active ? 0.55 : 0;
        card.userData.ringOffset = off;
      });
    }

    function render(now) {
      raf = requestAnimationFrame(render);
      var dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      layout(dt, false);
      var mobile = container.clientWidth < 640;
      var sidebar = container.clientWidth < 500 && container.clientHeight > 520 && window.innerWidth >= 1024;
      var targetZ = sidebar ? 13.8 : (mobile ? 8.7 : 7.7);
      camera.position.x = damp(camera.position.x, pointerX * 0.38, 4, dt);
      camera.position.y = damp(camera.position.y, 0.78 + pointerY * 0.18, 4, dt);
      camera.position.z = damp(camera.position.z, targetZ, 4, dt);
      camera.lookAt(0, 0.05, 0);
      world.rotation.y = damp(world.rotation.y, pointerX * 0.028, 4, dt);
      particles.rotation.y += dt * 0.018;
      ring.material.color.setHex(0xE8FF4F);
      glow.material.opacity = 0.1 + Math.sin(now * 0.0012) * 0.035;
      renderer.render(scene, camera);
    }

    function resize() {
      var w = container.clientWidth || 1;
      var h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    var ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    function pointerPos(e) {
      var r = renderer.domElement.getBoundingClientRect();
      pointerX = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointerY = -(((e.clientY - r.top) / r.height) * 2 - 1);
    }

    function pick(e) {
      if (!n) return null;
      var r = renderer.domElement.getBoundingClientRect();
      var ndc = new THREE.Vector2(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -(((e.clientY - r.top) / r.height) * 2 - 1)
      );
      var ray = new THREE.Raycaster();
      ray.setFromCamera(ndc, camera);
      var hits = ray.intersectObjects(cards, true);
      if (!hits.length) return null;
      var obj = hits[0].object;
      while (obj && !obj.userData.isCard) obj = obj.parent;
      return obj || null;
    }

    renderer.domElement.addEventListener('pointerdown', function (e) {
      if (e.button != null && e.button !== 0) return;
      dragging = { x: e.clientX, y: e.clientY, start: targetFocus, moved: false, vertical: false };
      container.classList.add('dragging');
      try { renderer.domElement.setPointerCapture(e.pointerId); } catch (err) {}
      pointerPos(e);
    });
    renderer.domElement.addEventListener('pointermove', function (e) {
      pointerPos(e);
      if (!dragging) return;
      var dx = e.clientX - dragging.x;
      var dy = e.clientY - dragging.y;
      if (Math.abs(dx) > 5) dragging.moved = true;
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) dragging.vertical = true;
      if (!dragging.vertical) {
        targetFocus = dragging.start - dx / (spacing * 62);
      }
    });
    function screenRect(card) {
      if (!card) return null;
      var r = renderer.domElement.getBoundingClientRect();
      var v = new THREE.Vector3();
      card.getWorldPosition(v);
      v.project(camera);
      var x = (v.x * 0.5 + 0.5) * r.width + r.left;
      var y = (-v.y * 0.5 + 0.5) * r.height + r.top;
      var size = Math.min(200, Math.max(96, r.width * 0.15));
      return { x: x - size / 2, y: y - size / 2, width: size, height: size };
    }

    function endDrag(e) {
      if (!dragging) return;
      var dx = e.clientX - dragging.x;
      var moved = dragging.moved && !dragging.vertical && Math.abs(dx) > 28;
      var d = dragging;
      dragging = null;
      container.classList.remove('dragging');
      if (moved) {
        var snapped = mod(Math.round(targetFocus), n);
        targetFocus = snapped;
        if (callbacks.onFocus) callbacks.onFocus(snapped);
      } else {
        targetFocus = focus;
        if (!d.vertical) {
          var card = pick(e);
          if (card) {
            var index = card.userData.index;
            if (index === focus) {
              selectedLift = performance.now();
              if (callbacks.onSelect) callbacks.onSelect(index, { rect: screenRect(card) });
            } else if (callbacks.onFocus) callbacks.onFocus(index);
          }
        }
      }
    }
    renderer.domElement.addEventListener('pointerup', endDrag);
    renderer.domElement.addEventListener('pointercancel', function () {
      dragging = null;
      container.classList.remove('dragging');
      targetFocus = focus;
    });
    renderer.domElement.addEventListener('pointerleave', function () {
      if (!dragging) { pointerX = 0; pointerY = 0; }
    });
    renderer.domElement.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
        e.preventDefault();
        if (callbacks.onNavigate) callbacks.onNavigate(e.deltaX + e.deltaY > 0 ? 1 : -1);
      }
    }, { passive: false });

    raf = requestAnimationFrame(render);

    return {
      setTracks: setTracks,
      setFocus: setFocus,
      setCurrent: setCurrent,
      setPlaying: setPlaying,
      resize: resize,
      dispose: function () {
        cancelAnimationFrame(raf);
        ro.disconnect();
        textureCache.forEach(function (t) { t.dispose(); });
        textureCache.clear();
        disposeCards();
        renderer.dispose();
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }

  window.JerryShelf3D = { mount: mount };
})();
