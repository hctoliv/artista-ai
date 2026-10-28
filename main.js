(() => {
  const A = window.ARTISTAS || [];
  const CATS = window.CATS || [];
  const BASE = 'https://oartista.ai';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const catLabel = n => n === 'Parabens do Artista' ? 'Parabéns do Artista' : n === 'Dj' ? 'DJ' : n;
  const url = a => `${BASE}/artista/${a.s}`;
  const img = a => `img/a/${a.s}.jpg`;
  const byName = {};
  A.forEach(a => { byName[norm(a.n)] = a; });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* intro once per session */
  const introMs = document.documentElement.classList.contains('seen') ? 0 : 2100;
  try { sessionStorage.setItem('oa-intro', '1'); } catch (e) {}

  /* hero headline */
  $$('.hero-h .ln').forEach((ln, i) => {
    ln.innerHTML = `<span>${ln.innerHTML}</span>`;
    const s = ln.firstChild;
    s.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }],
      { duration: 1100, delay: introMs + 120 * i, easing: 'cubic-bezier(.2,.7,.1,1)', fill: 'backwards' });
  });

  /* hero slideshow */
  const slides = $$('#stage img');
  let si = 0;
  setInterval(() => {
    slides[si].classList.remove('on');
    si = (si + 1) % slides.length;
    slides[si].classList.add('on');
    $('#slideN').textContent = String(si + 1).padStart(2, '0');
  }, 6000);

  /* spotlight follows pointer */
  const spot = $('#spot');
  let tx = 65, ty = 40, cx = 65, cy = 40, auto = true, t0 = performance.now();
  if (fine) $('#hero').addEventListener('pointermove', e => {
    auto = false;
    const r = e.currentTarget.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width * 100;
    ty = (e.clientY - r.top) / r.height * 100;
  });
  (function loop(t) {
    if (auto && !reduce) { const k = (t - t0) / 4000; tx = 55 + Math.sin(k) * 22; ty = 38 + Math.cos(k * 1.3) * 12; }
    cx += (tx - cx) * .08; cy += (ty - cy) * .08;
    spot.style.setProperty('--x', cx + '%'); spot.style.setProperty('--y', cy + '%');
    requestAnimationFrame(loop);
  })(t0);

  /* flipping names */
  const flipNames = ['Thiaguinho', 'Capital Inicial', 'Ivete Sangalo', 'Emicida', 'Ana Castela', 'Alok', 'Marisa Monte', 'Péricles', 'Fábio Porchat', 'Sepultura', 'Aline Barros', 'Jorge & Mateus', 'MC Kekel', 'Gilberto Gil', 'Vintage Culture']
    .map(n => byName[norm(n)]).filter(Boolean);
  const fN = $('#flip'), fC = $('#flipCat');
  let fi = 0;
  setInterval(() => {
    fi = (fi + 1) % flipNames.length;
    const a = flipNames[fi];
    [fN, fC].forEach(el => { el.classList.remove('in'); el.classList.add('out'); });
    setTimeout(() => {
      fN.textContent = a.n; fC.textContent = a.c.map(catLabel).join(', ');
      [fN, fC].forEach(el => { el.classList.remove('out'); void el.offsetWidth; el.classList.add('in'); });
    }, 350);
  }, 2600);

  /* counts per category */
  const count = {};
  A.forEach(a => a.c.forEach(c => { count[c] = (count[c] || 0) + 1; }));
  const cats = CATS.filter(c => count[c.n]).sort((a, b) => count[b.n] - count[a.n]);

  /* hero chips */
  ['Sertanejo', 'Pagode', 'Funk', 'Stand-up', 'Rock', 'Gospel', 'Dj', 'MPB', 'Forró'].forEach(n => {
    if (!count[n]) return;
    const b = document.createElement('button');
    b.className = 'chip'; b.textContent = catLabel(n);
    b.onclick = () => { setTab(n); $('#explorar').scrollIntoView({ behavior: 'smooth' }); };
    $('#heroChips').appendChild(b);
  });

  /* search */
  const q = $('#q'), res = $('#qRes');
  let hits = [], act = -1;
  const searchA = s => {
    const k = norm(s);
    if (!k) return [];
    const byN = A.filter(a => norm(a.n).includes(k));
    const byC = A.filter(a => !byN.includes(a) && a.c.some(c => norm(catLabel(c)).includes(k)));
    return byN.concat(byC);
  };
  const renderRes = () => {
    const v = q.value.trim();
    if (!v) { res.hidden = true; return; }
    hits = searchA(v);
    act = -1;
    res.innerHTML = (hits.length ? hits.slice(0, 6).map((a, i) =>
      `<a class="sr" href="${url(a)}" target="_blank" rel="noopener" data-i="${i}"><img src="${img(a)}" alt=""><span><b>${esc(a.n)}</b><small>${esc(a.c.map(catLabel).join(', '))}</small></span></a>`).join('')
      : `<p class="sr-empty">Nada por aqui com “${esc(v)}”.</p>`) +
      `<a class="sr-all" href="${BASE}/artistas" target="_blank" rel="noopener">Buscar no catálogo completo ↗</a>`;
    res.hidden = false;
  };
  q.addEventListener('input', renderRes);
  q.addEventListener('focus', renderRes);
  q.addEventListener('keydown', e => {
    const items = $$('.sr', res);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      act = (act + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((it, i) => it.classList.toggle('act', i === act));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (act >= 0 && items[act]) items[act].click(); else go();
    } else if (e.key === 'Escape') res.hidden = true;
  });
  document.addEventListener('click', e => { if (!$('#search').contains(e.target)) res.hidden = true; });
  const go = () => {
    res.hidden = true;
    const cat = cats.find(c => norm(catLabel(c.n)) === norm(q.value));
    if (cat) setTab(cat.n); else { setTab('*'); $('#exQ').value = q.value; render(); }
    $('#explorar').scrollIntoView({ behavior: 'smooth' });
  };
  $('#qGo').onclick = go;

  /* ticker */
  const tk = cats.map(c => `<span>${esc(catLabel(c.n))}</span>`).join('');
  $('#ticker').innerHTML = tk + tk;

  /* line-up poster */
  const tiers = [
    ['Música', 'r1', ['Ivete Sangalo', 'Anitta', 'Thiaguinho', 'Gilberto Gil', 'Capital Inicial', 'Gusttavo Lima']],
    [null, 'r2', ['IZA', 'Ludmilla', 'Emicida', 'Marisa Monte', 'Jorge & Mateus', 'Henrique & Juliano', 'Péricles', 'Seu Jorge', 'Ana Castela', 'Titãs', 'Jota Quest', 'Alok']],
    [null, 'r3', ['Luan Santana', 'Zé Neto & Cristiano', 'Maiara e Maraísa', 'Claudia Leitte', 'Léo Santana', 'Ferrugem', 'Belo', 'Alexandre Pires', 'Dudu Nobre', 'Sorriso Maroto', 'Grupo Menos é Mais', 'Joelma', 'João Gomes', 'Xand Avião', 'Sepultura', 'Raimundos', 'CPM 22', 'Barão Vermelho', 'Os Mutantes', 'Angra', 'Criolo', 'Liniker', 'Filipe Ret', 'Xamã', 'Gabriel Pensador', 'Carlinhos Brown', 'Chitãozinho & Xororó', 'Zezé Di Camargo & Luciano', 'Bruno & Marrone', 'Simone Mendes', 'Gaby Amarantos', 'Anavitória']],
    ['Pista', 'r2', ['Vintage Culture', 'Pedro Sampaio', 'Dennis DJ', 'Gui Boratto', 'Bhaskar', 'ANNA', 'Öwnboss', 'DJ Rennan da Penha']],
    ['Humor e Parabéns', 'r2', ['Fábio Porchat', 'Whindersson Nunes', 'Tata Werneck', 'Marcelo Adnet', 'Leandro Hassum', 'Sergio Malandro', 'Thiago Ventura', 'Danilo Gentili']],
    ['Fé', 'r3', ['Aline Barros', 'Gabriela Rocha', 'Fernandinho', 'Isadora Pompeo', 'Diante do Trono', 'Anderson Freire', 'Thalles Roberto', 'Paloma Possi', 'Rosa de Saron', 'Kleber Lucas', 'Cassiane']],
  ];
  const used = new Set();
  let html = '';
  tiers.forEach(([label, cls, names]) => {
    const list = names.map(n => byName[norm(n)]).filter(a => a && !used.has(a.s));
    if (!list.length) return;
    list.forEach(a => used.add(a.s));
    if (label) html += `<p class="p-label">${label}</p>`;
    html += `<div class="p-row ${cls}">` + list.map(a => `<a href="${url(a)}" target="_blank" rel="noopener" data-s="${a.s}" data-c="${esc(catLabel(a.c[0]))}">${esc(a.n)}</a>`).join('') + '</div>';
  });
  const rest = A.filter(a => !used.has(a.s)).slice(0, innerWidth < 760 ? 24 : 60);
  html += `<p class="p-label">E muito mais</p><div class="p-row r4">` + rest.map(a => `<a href="${url(a)}" target="_blank" rel="noopener" data-s="${a.s}" data-c="${esc(catLabel(a.c[0]))}">${esc(a.n)}</a>`).join('') + '</div>';
  const poster = $('#poster');
  poster.innerHTML = html;

  if (fine) {
    const peek = $('#peek'), pImg = $('img', peek), pTag = $('span', peek);
    let px = 0, py = 0, mx = 0, my = 0, on = false;
    poster.addEventListener('pointerover', e => {
      const a = e.target.closest('a[data-s]');
      if (!a) return;
      pImg.src = `img/a/${a.dataset.s}.jpg`; pTag.textContent = a.dataset.c;
      peek.classList.add('on'); poster.classList.add('dim'); on = true;
    });
    poster.addEventListener('pointerout', e => {
      if (e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('a[data-s]')) return;
      peek.classList.remove('on'); poster.classList.remove('dim'); on = false;
    });
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; });
    (function follow() {
      px += (mx - px) * .18; py += (my - py) * .18;
      if (on) peek.style.left = px + 'px', peek.style.top = py + 'px';
      requestAnimationFrame(follow);
    })();
  }

  /* explore */
  let cur = '*', shown = 0;
  const PAGE = 24;
  const tabs = $('#tabs');
  tabs.innerHTML = `<button class="tab" role="tab" data-c="*">Todos<sup>${A.length}</sup></button>` +
    cats.map(c => `<button class="tab" role="tab" data-c="${esc(c.n)}">${esc(catLabel(c.n))}<sup>${count[c.n]}</sup></button>`).join('');
  tabs.addEventListener('click', e => { const b = e.target.closest('.tab'); if (b) setTab(b.dataset.c); });
  function setTab(c) {
    cur = c;
    $$('.tab', tabs).forEach(b => {
      const s = b.dataset.c === c;
      b.setAttribute('aria-selected', s);
      if (s) tabs.scrollTo({ left: b.offsetLeft - 40, behavior: 'smooth' });
    });
    if (c !== '*') $('#exQ').value = '';
    render();
  }
  const list = () => {
    const k = norm($('#exQ').value);
    return A.filter(a => (cur === '*' || a.c.includes(cur)) && (!k || norm(a.n).includes(k)));
  };
  const card = (a, i) => `<a class="card" href="${url(a)}" target="_blank" rel="noopener" style="animation-delay:${(i % PAGE) * 30}ms">
      <div class="card-in"><img src="${img(a)}" alt="${esc(a.n)}" loading="lazy" width="400" height="480"><span class="card-go">↗</span></div>
      <h3>${esc(a.n)}</h3><p>${esc(a.c.map(catLabel).join(', '))}</p></a>`;
  function render(more) {
    const L = list();
    const g = $('#grid');
    if (!more) { shown = 0; g.innerHTML = ''; }
    const next = L.slice(shown, shown + PAGE);
    g.insertAdjacentHTML('beforeend', next.map((a, i) => card(a, shown + i)).join(''));
    shown += next.length;
    if (!L.length) g.innerHTML = `<p class="ex-empty">Nenhum artista com esse filtro aqui. Tente o catálogo completo.</p>`;
    $('#exCount').textContent = `${L.length} ${L.length === 1 ? 'artista' : 'artistas'}${cur === '*' ? '' : ' em ' + catLabel(cur)}`;
    $('#more').hidden = shown >= L.length;
  }
  $('#more').onclick = () => render(true);
  $('#exQ').addEventListener('input', () => render());
  setTab('*');

  /* card tilt */
  if (fine) {
    $('#grid').addEventListener('pointermove', e => {
      const c = e.target.closest('.card-in');
      if (!c) return;
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.transform = `rotateY(${(x - .5) * 10}deg) rotateX(${(.5 - y) * 10}deg)`;
      c.style.setProperty('--gx', x * 100 + '%'); c.style.setProperty('--gy', y * 100 + '%');
    });
    $('#grid').addEventListener('pointerout', e => {
      const c = e.target.closest('.card-in');
      if (c && !c.contains(e.relatedTarget)) c.style.transform = '';
    });
  }

  /* advertise wall */
  const pool = A.slice(0, 60);
  const cols = innerWidth < 760 ? 3 : 6;
  let wall = '';
  for (let c = 0; c < cols; c++) {
    const imgs = pool.filter((_, i) => i % cols === c).slice(0, 6);
    const h = imgs.map(a => `<img src="${img(a)}" alt="" loading="lazy">`).join('');
    wall += `<div class="ad-col" style="animation-duration:${50 + c * 7}s">${h}${h}</div>`;
  }
  $('#adWall').innerHTML = wall;
  const sel = $('#adGen');
  sel.innerHTML = '<option value="">Gênero</option>' + cats.map(c => `<option>${esc(catLabel(c.n))}</option>`).join('');
  $('#adForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const msg = `Olá! Quero anunciar no O Artista.Ai.\nNome artístico: ${f.get('nome')}` +
      (f.get('genero') ? `\nGênero: ${f.get('genero')}` : '') + (f.get('cidade') ? `\nCidade: ${f.get('cidade')}` : '');
    window.open('https://wa.me/5511932200422?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  });

  /* reveal + counters */
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in');
    io.unobserve(en.target);
  }), { threshold: .2 });
  $$('.reveal').forEach(el => io.observe(el));
  const cio = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    const b = en.target, to = +b.dataset.to, t1 = performance.now();
    (function step(t) {
      const p = Math.min(1, (t - t1) / 1600), v = Math.round(to * (1 - Math.pow(1 - p, 3)));
      b.textContent = v.toLocaleString('pt-BR');
      if (p < 1) requestAnimationFrame(step);
    })(t1);
    cio.unobserve(b);
  }), { threshold: .6 });
  $$('[data-to]').forEach(el => cio.observe(el));

  /* header: zones + hide on scroll */
  const hd = $('#hd'), zones = $$('[data-hd]');
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    const y = scrollY;
    hd.classList.toggle('solid', y > 40);
    hd.classList.toggle('hide', y > lastY && y > 400 && !document.body.classList.contains('menu-open'));
    lastY = y;
    const probe = hd.offsetHeight / 2;
    const z = zones.find(s => { const r = s.getBoundingClientRect(); return r.top <= probe && r.bottom > probe; });
    hd.classList.toggle('light', !!z && z.dataset.hd === 'light' && !document.body.classList.contains('menu-open'));
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* mobile menu */
  const burger = $('#burger');
  burger.onclick = () => {
    const o = document.body.classList.toggle('menu-open');
    hd.classList.toggle('menu-open', o);
    burger.setAttribute('aria-expanded', o);
    onScroll();
  };
  $$('#nav a').forEach(a => a.addEventListener('click', () => { document.body.classList.remove('menu-open'); hd.classList.remove('menu-open'); burger.setAttribute('aria-expanded', false); }));
})();
