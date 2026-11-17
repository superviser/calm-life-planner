/* plan.js: the special screens of the Plan hub: Day (time blocks), Week, Month, Focus timer */
'use strict';
(function (A) {
  const h = A.h, P = A.P, X = A.special = {};
  const tasks = () => P.page('tasks');

  const dayNav = (d, set, step, label) => h('div.monthnav', null,
    h('button.icon-btn', { type: 'button', 'aria-label': step === 7 ? A.t('Previous week') : A.t('Previous day'), onclick: () => set(A.addDays(d, -step)) }, A.icon('left')),
    h('strong.monthnav-label', { text: label }),
    h('button.icon-btn', { type: 'button', 'aria-label': step === 7 ? A.t('Next week') : A.t('Next day'), onclick: () => set(A.addDays(d, step)) }, A.icon('right')),
    (step === 7 ? P.weekStart(d) !== P.weekStart(A.today()) : d !== A.today()) ? h('button.chip', { type: 'button', onclick: () => set(A.today()) }, step === 7 ? A.t('This week') : A.t('Today')) : null);

  /* a line to add a task straight onto one day: "dentist 15:30" */
  function addForDay(d, id) {
    const input = h('input.quick-input', { id: id, type: 'text', maxLength: 200, autocomplete: 'off', enterkeyhint: 'done', placeholder: A.t('Add to this day. A time like 15:30 makes it a block.'), 'aria-label': A.t('Add a task to this day') });
    return h('form.quick', {
      onsubmit: e => {
        e.preventDefault();
        const q = P.parse(input.value);
        if (!q.t) return;
        const rec = { t: q.t.slice(0, 200), due: d };
        if (q.time) rec.time = q.time;
        A.refocus = '#' + id;
        P.add('tasks', rec);
      }
    }, input, h('button.btn.primary', { type: 'submit' }, A.t('Add')));
  }
  /* everything that belongs to one day: dates, timed blocks, anytime tasks, money */
  A.dayParts = function (d) {
    const all = P.onDay(d), timed = P.blocks(d), free = all.filter(x => !x.r.time), dates = P.datesOn(d);
    const money = P.hubs().some(x => x.id === 'money') ? A.items(d, d).filter(it => !it.skipped) : [];
    return { timed: timed, free: free, dates: dates, money: money, done: P.doneOn(d), n: all.length + dates.length + money.length };
  };
  function dayBody(d) {
    const p = A.dayParts(d), box = h('div.stack');
    if (p.dates.length) box.append(h('div.chips', null, p.dates.map(x => h('a.chip', { href: P.route(x.pg) }, h('span', { 'aria-hidden': 'true', text: (x.r.emoji || x.pg.emoji) + ' ' }), x.r.t))));
    if (p.timed.length) box.append(h('div.agenda-day', null, p.timed.map(b => h('div.block', null,
      h('span.block-time', null, h('strong', { text: P.clock(b.s) }), h('small', { text: P.clock(b.e) })),
      A.taskRow(b.pg, b.r, { noDate: true, noTime: true, page: b.pg.id !== 'tasks' })))));
    if (p.free.length) box.append(h('div', null, p.timed.length ? h('p.field-label', { text: A.t('Any time') }) : null, h('div.rows', null, p.free.map(x => A.taskRow(x.pg, x.r, { noDate: true, page: x.pg.id !== 'tasks' })))));
    if (p.money.length) box.append(h('div', null, h('p.field-label', { text: A.t('Money') }), h('div.rows', null, p.money.map(it => A.itemRow(it)))));
    if (!p.n) box.append(h('p.quiet', { text: d === A.today() ? A.t('Nothing planned today. Add one thing, or enjoy the space.') : A.t('Nothing planned for this day.') }));
    return { el: box, parts: p };
  }

  /* ---------- Day ---------- */
  X.day = function (root) {
    const t = A.today(), d = A.ui.planDay || t, isToday = d === t, day = P.dayLeft();
    root.append(h('div.toolbar', null, dayNav(d, v => { A.ui.planDay = v === t ? null : v; A.render(); }, 1, A.dLong(d))));
    const body = dayBody(d), free = body.parts.free.length;
    const fill = () => {
      const res = P.fill(d);
      A.toast(res.n ? (res.left ? A.tn(res.n, '{n} task has a time now. The rest did not fit.|{n} tasks have a time now. The rest did not fit.') : A.tn(res.n, '{n} task has a time now.|{n} tasks have a time now.')) : A.t('There is no free time left on this day.'), res.n ? { action: A.t('Undo'), fn: res.undo } : null);
    };
    const main = h('section.panel', null,
      h('div.panel-head', null, h('h2', { text: isToday ? A.t('Today') : A.fmt(d, { weekday: 'long' }) }),
        isToday && !day.over ? h('p.sub', { text: A.t('{time} left today', { time: P.dur(day.left) }) }) : null),
      addForDay(d, 'add-day'), body.el,
      h('div.actions.start', null, free ? A.btn(A.tn(free, 'Fill my day ({n} task)|Fill my day ({n} tasks)'), fill, 'primary', 'spark') : null));
    const side = h('div.col-side');
    if (isToday) {
      const carried = P.carried();
      if (carried.length) side.append(h('section.panel', null,
        h('div.panel-head', null, h('h2', { text: A.t('Came over from earlier') }), h('p.sub', { text: A.t('No catching up needed. Move them, or leave them.') })),
        h('div.rows', null, carried.slice(0, 8).map(x => A.taskRow(x.pg, x.r, { calm: true, page: x.pg.id !== 'tasks' }))),
        h('div.actions.start', null, A.btn(A.t('Move them all to today'), () => { const undo = P.carryAll(); A.toast(A.t('Moved to today. A clean start.'), { action: A.t('Undo'), fn: undo }); }))));
    }
    if (body.parts.done.length) side.append(h('section.panel', null, h('div.panel-head', null, h('h2', { text: A.t('Done') }), h('p.sub', { text: String(body.parts.done.length) })),
      h('div.rows', null, body.parts.done.map(x => h('div.row.done', null, h('span.row-main', null, h('span.row-title', { text: x.r.t })))))));
    const tomorrow = A.addDays(d, 1), next = P.onDay(tomorrow);
    side.append(h('section.panel', null, h('div.panel-head', null, h('h2', { text: A.rel(tomorrow) }), h('button.link', { type: 'button', onclick: () => { A.ui.planDay = tomorrow === t ? null : tomorrow; A.render(); } }, A.t('Open'))),
      next.length ? h('div.rows', null, next.slice(0, 5).map(x => A.taskRow(x.pg, x.r, { noDate: true, star: false }))) : h('p.quiet', { text: A.t('Nothing planned yet.') })));
    root.append(h('div.cols', null, h('div.col-main', null, main), side));
  };

  /* a small sheet for one day, opened from the week and the month */
  A.dayPeek = d => A.sheet(() => A.dLong(d), (body, api) => {
    body.append(addForDay(d, 'add-peek'), dayBody(d).el,
      h('div.actions', null, A.btn(A.t('Open this day'), () => { api.close(); A.ui.planDay = d === A.today() ? null : d; A.go('p/day'); }, 'primary')));
  }, { live: true });

  /* ---------- Week ---------- */
  X.week = function (root) {
    const t = A.today(), start = P.weekStart(A.ui.planWeek || t), end = A.addDays(start, 6);
    const label = A.fmt(start, { day: 'numeric', month: 'short' }) + ' – ' + A.fmt(end, { day: 'numeric', month: 'short' });
    root.append(h('div.toolbar', null, dayNav(start, v => { A.ui.planWeek = P.weekStart(v) === P.weekStart(t) ? null : v; A.render(); }, 7, label)));
    const grid = h('div.week');
    for (let i = 0; i < 7; i++) {
      const d = A.addDays(start, i), p = A.dayParts(d), items = p.timed.map(b => ({ pg: b.pg, r: b.r })).concat(p.free);
      const meals = P.SLOTS.map(s => P.mealName(P.meal(d, s[0]))).filter(Boolean);
      grid.append(h('section.week-day' + (d === t ? '.is-today' : '') + (d < t ? '.past' : ''), null,
        h('button.week-head', { type: 'button', 'aria-label': A.dLong(d), onclick: () => A.dayPeek(d) }, h('span.week-wd', { text: A.fmt(d, { weekday: 'short' }) }), h('strong.week-n', { text: String(+d.slice(8)) })),
        p.dates.length ? h('div.week-dates', null, p.dates.map(x => h('span.tag', null, h('span', { 'aria-hidden': 'true', text: x.r.emoji || x.pg.emoji }), x.r.t))) : null,
        items.length ? h('div.rows', null, items.map(x => A.taskRow(x.pg, x.r, { noDate: true, star: false }))) : null,
        p.money.length ? h('p.week-note', null, h('span', { 'aria-hidden': 'true', text: '💰 ' }), p.money.map(it => it.r.name).join(', ')) : null,
        meals.length ? h('p.week-note', null, h('span', { 'aria-hidden': 'true', text: '🍽️ ' }), meals.join(', ')) : null,
        !p.n && !meals.length ? h('p.quiet', { text: A.t('Free') }) : null,
        h('button.link', { type: 'button', onclick: () => A.taskSheet(tasks(), null, { due: d }) }, A.t('Add'))));
    }
    root.append(grid);
  };

  /* ---------- Month ---------- */
  X.month = function (root) {
    const t = A.today(), ym = A.ui.planYm || A.ym(t);
    const ws = A.state.profile.weekStart, lead = (A.date(ym + '-01').getDay() - ws + 7) % 7, days = A.monthDays(ym), grid = h('div.cal');
    for (let i = 0; i < 7; i++) grid.append(h('span.cal-wd', { text: A.fmt('2024-09-0' + (1 + (ws + i) % 7), { weekday: 'short' }) }));
    for (let i = 0; i < lead; i++) grid.append(h('span.cal-pad'));
    for (let n = 1; n <= days; n++) {
      const d = ym + '-' + A.pad(n), p = A.dayParts(d);
      const marks = p.dates.map(() => 'date').concat(p.timed.concat(p.free).map(() => 'task'), p.money.map(it => it.r.type)).slice(0, 4);
      const names = p.dates.map(x => x.r.t).concat(p.timed.concat(p.free).map(x => x.r.t), p.money.map(it => it.r.name));
      grid.append(h('button.cal-day' + (d === t ? '.is-today' : '') + (d < t ? '.past' : ''), {
        type: 'button', 'aria-label': A.dLong(d) + ', ' + (names.length ? names.join(', ') : A.t('nothing planned')), onclick: () => A.dayPeek(d)
      }, h('span.cal-n', { text: String(n) }), h('span.day-marks', null, marks.map(m => h('i.mark', { 'data-type': m })))));
    }
    const ahead = P.upcoming(45);
    root.append(h('div.cols', null,
      h('div.col-main', null, h('section.panel', null, A.monthNav(ym, v => { A.ui.planYm = v === A.ym(t) ? null : v; A.render(); }), grid,
        h('ul.legend', null, [['task', A.t('Task')], ['date', A.t('Date to remember')], ['out', A.t('Bill')], ['in', A.t('Income')]].map(m => h('li', null, h('i.mark', { 'data-type': m[0] }), m[1]))))),
      h('div.col-side', null, h('section.panel', null, h('div.panel-head', null, h('h2', { text: A.t('Coming up') })),
        ahead.length ? h('div.rows', null, ahead.slice(0, 8).map(x => A.dateRow(x.pg, x.r))) : h('p.quiet', { text: A.t('No dates in the next six weeks.') })))));
  };

  /* ---------- Focus timer ---------- */
  /* The sound is made in the browser from noise, so there are no audio files to load. */
  const F = { endAt: 0, left: 0, total: 0, on: false, timer: null, ctx: null, src: null, gain: null };
  const SOUNDS = [['none', A.T('Silence')], ['brown', A.T('Brown noise')], ['pink', A.T('Pink noise')], ['white', A.T('White noise')], ['rain', A.T('Rain')]];
  function noise(ctx, kind) {
    const n = ctx.sampleRate * 3, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, last = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
      else if (kind === 'pink') { b0 = 0.99765 * b0 + w * 0.0990460; b1 = 0.96300 * b1 + w * 0.2965164; b2 = 0.57000 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.16; }
      else d[i] = w * 0.3;
    }
    return buf;
  }
  function stopSound() { try { if (F.src) F.src.stop(); } catch (e) { /* already stopped */ } F.src = null; }
  function startSound(kind, vol) {
    stopSound();
    if (kind === 'none') return;
    try {
      F.ctx = F.ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (F.ctx.state === 'suspended') F.ctx.resume();
      const src = F.ctx.createBufferSource(), gain = F.ctx.createGain();
      src.buffer = noise(F.ctx, kind === 'rain' ? 'white' : kind); src.loop = true;
      gain.gain.value = vol;
      if (kind === 'rain') {
        /* rain: hiss with the low rumble and the sharp top taken off */
        const hi = F.ctx.createBiquadFilter(), lo = F.ctx.createBiquadFilter();
        hi.type = 'highpass'; hi.frequency.value = 900; lo.type = 'lowpass'; lo.frequency.value = 7000;
        src.connect(hi); hi.connect(lo); lo.connect(gain);
      } else src.connect(gain);
      gain.connect(F.ctx.destination);
      src.start();
      F.src = src; F.gain = gain;
    } catch (e) { /* no sound on this device: the timer still works */ }
  }
  function chime() {
    try {
      const ctx = F.ctx || new (window.AudioContext || window.webkitAudioContext)();
      [660, 880].forEach((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.25); g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + i * 0.25 + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.25 + 0.6); o.connect(g); g.connect(ctx.destination); o.start(ctx.currentTime + i * 0.25); o.stop(ctx.currentTime + i * 0.25 + 0.7); });
    } catch (e) { /* silent finish */ }
  }
  const remaining = () => (F.on ? Math.max(0, F.endAt - Date.now()) : F.left);
  const mmss = ms => { const s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ':' + A.pad(s % 60); };
  function paint() {
    const el = document.getElementById('focus-time'), ring = document.getElementById('focus-ring');
    if (!el) return;
    const left = remaining();
    el.textContent = mmss(left);
    if (ring) ring.style.setProperty('--p', F.total ? (1 - left / F.total).toFixed(4) : '0');
  }
  function finish() {
    clearInterval(F.timer); F.timer = null; F.on = false; F.left = 0;
    stopSound(); chime();
    const m = Math.round(F.total / 60000);
    P.focusDone(m);
    A.toast(A.tn(m, '{n} minute of focus done. Take a short break.|{n} minutes of focus done. Take a short break.'), { ms: 8000 });
    if (A.rem && A.rem.perm() === 'granted' && document.visibilityState !== 'visible') A.rem.show({ id: 'focus' + Date.now(), title: A.t('Focus time is over'), body: A.t('Take a short break.') });
    F.total = 0;
    if (A.route === 'p') A.render();
  }
  function run() {
    clearInterval(F.timer);
    F.timer = setInterval(() => { if (F.on && remaining() <= 0) finish(); else paint(); }, 500);
  }
  X.focus = function (root) {
    const cfg = A.state.pl.focus, t = A.today(), idle = !F.on && !F.left;
    const setCfg = patch => A.commit(s => { Object.assign(s.pl.focus, patch); }, 'quiet');
    const total = idle ? cfg.min * 60000 : F.total, left = idle ? total : remaining();
    const start = () => {
      if (idle) { F.total = cfg.min * 60000; F.left = F.total; }
      F.endAt = Date.now() + F.left; F.on = true;
      startSound(cfg.sound, cfg.vol == null ? 0.5 : cfg.vol);
      run(); A.render();
    };
    const pause = () => { F.left = remaining(); F.on = false; stopSound(); clearInterval(F.timer); A.render(); };
    const reset = () => { F.on = false; F.left = 0; F.total = 0; stopSound(); clearInterval(F.timer); A.render(); };
    const today = P.onDay(t).concat(P.carried());
    root.append(h('div.cols', null,
      h('div.col-main', null, h('section.panel.focus', null,
        h('div.focus-ring', { id: 'focus-ring', style: { '--p': total ? (1 - left / total).toFixed(4) : '0' } }, h('div.focus-inner', null,
          h('strong.focus-time', { id: 'focus-time', role: 'timer', 'aria-live': 'off', text: mmss(left) }),
          h('span.sub', { text: F.on ? A.t('Focusing') : idle ? A.t('Ready') : A.t('Paused') }))),
        cfg.task && idle ? h('p.sub', { text: cfg.task }) : null,
        h('div.actions', { style: { justifyContent: 'center' } },
          F.on ? A.btn(A.t('Pause'), pause) : A.btn(idle ? A.t('Start') : A.t('Carry on'), start, 'primary'),
          idle ? null : A.btn(A.t('Stop'), reset)))),
      h('div.col-side', null,
        h('section.panel', null, h('div.panel-head', null, h('h2', { text: A.t('Set it up') })),
          h('div.form', null,
            A.group(A.t('How long'), A.seg([10, 15, 25, 45, 60].map(m => [m, P.dur(m)]), cfg.min, v => { setCfg({ min: v }); if (idle) A.render(); }, A.t('How long'))),
            A.field(A.t('Background sound'), A.select(A.opts(SOUNDS), cfg.sound, { onchange: e => { setCfg({ sound: e.target.value }); if (F.on) startSound(e.target.value, cfg.vol == null ? 0.5 : cfg.vol); } })),
            A.field(A.t('Volume'), h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: cfg.vol == null ? 0.5 : cfg.vol, oninput: e => { if (F.gain) F.gain.gain.value = +e.target.value; }, onchange: e => setCfg({ vol: +e.target.value }) })),
            today.length ? A.field(A.t('What are you working on? (optional)'), A.select([['', A.t('Nothing in particular')]].concat(today.slice(0, 20).map(x => [x.r.t, x.r.t])), cfg.task || '', { onchange: e => { setCfg({ task: e.target.value }); } })) : null)),
        h('section.panel', null, h('dl.figures.two', null,
          h('div.strong', null, h('dt', { text: A.t('Focused today') }), h('dd', { text: P.dur(P.focusOn(t)) })),
          h('div', null, h('dt', { text: A.t('This week') }), h('dd', { text: P.dur(A.sum([0, 1, 2, 3, 4, 5, 6], i => P.focusOn(A.addDays(P.weekStart(t), i)))) })))))));
    if (F.on) run();
  };
  A.focusState = F;
})(window.App);
