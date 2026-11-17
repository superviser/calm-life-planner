/* planner.js: the engine under every planner page.
   Pages are data (pages.js); their records live in state.pl.rec[pageId]. This file knows how to read and change them:
   who sees what, ticking and repeating, what is due today, the top three, time left today, "fill my day",
   quick capture, nudges, reminders and the month in review. Nothing here touches the screen. */
'use strict';
(function (A) {
  const P = A.P = {}, pad = A.pad;
  const obj = x => x && typeof x === 'object' && !Array.isArray(x);
  const S = () => A.state.pl;

  P.blank = () => ({
    rec: {}, hidden: {}, order: {}, custom: [], home: null, top: {}, energy: {}, meals: {}, fl: {},
    day: { start: '07:00', end: '22:30' }, quiet: { on: false, from: '21:30', to: '08:00' }, focus: { min: 25, sound: 'brown' }
  });
  /* called by A.migrate: a planner state that came through a file, a link or the cloud is made whole again */
  P.migrate = function (s) {
    const b = P.blank(), pl = obj(s.pl) ? s.pl : {};
    ['rec', 'hidden', 'order', 'top', 'energy', 'meals', 'fl'].forEach(k => { if (!obj(pl[k])) pl[k] = {}; });
    if (!Array.isArray(pl.custom)) pl.custom = [];
    pl.custom = pl.custom.filter(c => obj(c) && typeof c.id === 'string' && typeof c.name === 'string' && A.KINDS.some(k => k.id === c.kind));
    ['day', 'quiet', 'focus'].forEach(k => { pl[k] = Object.assign(b[k], obj(pl[k]) ? pl[k] : {}); });
    const hm = v => (/^\d\d:\d\d$/.test(v || '') ? v : null);
    const def = P.blank();   /* untouched defaults: b's own boxes have just been filled with what came in */
    pl.day.start = hm(pl.day.start) || def.day.start; pl.day.end = hm(pl.day.end) || def.day.end;
    pl.quiet.from = hm(pl.quiet.from) || def.quiet.from; pl.quiet.to = hm(pl.quiet.to) || def.quiet.to;
    pl.quiet.on = pl.quiet.on === true;
    pl.focus.min = [10, 15, 25, 45, 60].indexOf(+pl.focus.min) >= 0 ? +pl.focus.min : def.focus.min;
    if (pl.home && !Array.isArray(pl.home)) pl.home = null;
    Object.keys(pl.rec).forEach(id => {
      const list = Array.isArray(pl.rec[id]) ? pl.rec[id] : [];
      pl.rec[id] = list.filter(obj).map(r => { if (typeof r.id !== 'string' || !r.id) r.id = A.uid(); if (r.due && !A.isDate(r.due)) delete r.due; if (r.d && !A.isDate(r.d)) r.d = A.today(); return r; });
    });
    s.pl = pl;
  };

  /* ---------- who is looking ---------- */
  /* In a household each person has their own tasks, habits, moods and notes; "_" is the single person, or everybody. */
  P.who = () => { const me = A.shared() ? A.me() : null; return me ? me.id : '_'; };
  const perWho = key => { const box = S()[key], w = P.who(); return box[w] || (box[w] = {}); };

  /* ---------- hubs and pages ---------- */
  P.tr = x => (x == null ? '' : A.t(x));
  const customDef = c => ({ id: c.id, hub: c.hub, name: c.name, emoji: c.emoji || '📄', kind: c.kind, personal: c.personal ? 1 : 0, o: c.o || {}, custom: true });
  P.all = () => A.memo('pl-pages', () => A.PAGES.concat(S().custom.map(customDef)));
  P.page = id => A.memo('pl-page-' + id, () => P.all().find(x => x.id === id) || null);
  P.name = pg => (pg.custom ? pg.name : A.t(pg.name));
  P.hub = id => A.HUBS.find(h => h.id === id) || null;
  P.shown = pg => !S().hidden[pg.id] && (pg.when !== 'shared' || A.shared());
  const ordered = (items, order) => {
    if (!Array.isArray(order) || !order.length) return items;
    const at = id => { const i = order.indexOf(id); return i < 0 ? 999 : i; };
    return items.map((x, i) => [x, i]).sort((a, b) => (at(a[0].id) - at(b[0].id)) || (a[1] - b[1])).map(x => x[0]);
  };
  P.hubs = all => ordered(A.HUBS, S().order.hubs).filter(h => all || !S().hidden['hub:' + h.id]);
  P.pages = (hub, all) => ordered(P.all().filter(pg => pg.hub === hub), S().order[hub]).filter(pg => all ? (pg.when !== 'shared' || A.shared()) : P.shown(pg));
  P.route = pg => (pg.route ? '#/' + pg.route : '#/p/' + pg.id);
  /* a page counts as in use only when its hub is shown too */
  P.live = pg => !!pg && P.shown(pg) && !S().hidden['hub:' + pg.hub];
  P.addPage = function (def) {
    const c = { id: 'c-' + A.uid(), hub: def.hub, name: String(def.name).trim().slice(0, 40), emoji: def.emoji || '📄', kind: def.kind, personal: def.personal ? 1 : 0, o: def.o || {} };
    A.commit(s => { s.pl.custom.push(c); });
    return c;
  };
  P.removePage = id => A.commit(s => { s.pl.custom = s.pl.custom.filter(c => c.id !== id); delete s.pl.rec[id]; delete s.pl.hidden[id]; });

  /* ---------- records ---------- */
  P.raw = id => S().rec[id] || [];
  P.recs = function (id) {
    const pg = P.page(id), all = P.raw(id);
    if (!pg || !pg.personal || !A.shared()) return all;
    const me = P.who();
    return all.filter(r => !r.who || r.who === me);
  };
  P.find = (id, rid) => P.raw(id).find(r => r.id === rid) || null;
  P.add = function (id, rec, what) {
    const pg = P.page(id), r = Object.assign({ id: A.uid() }, rec);
    if (pg && pg.personal && A.shared() && !r.who) r.who = P.who();
    A.commit(s => { (s.pl.rec[id] = s.pl.rec[id] || []).push(r); }, what);
    return r;
  };
  P.save = (id, rid, patch) => A.commit(s => { const r = (s.pl.rec[id] || []).find(x => x.id === rid); if (r) Object.assign(r, patch); });
  /* returns what is needed to put it back */
  P.remove = function (id, rid) {
    const list = P.raw(id), at = list.findIndex(r => r.id === rid);
    if (at < 0) return null;
    const r = list[at];
    A.commit(s => { s.pl.rec[id] = s.pl.rec[id].filter(x => x.id !== rid); });
    return { undo: () => A.commit(s => { const l = (s.pl.rec[id] = s.pl.rec[id] || []); if (!l.some(x => x.id === rid)) l.splice(Math.min(at, l.length), 0, r); }) };
  };
  P.move = function (from, rid, to, patch) {
    const r = P.find(from, rid);
    if (!r) return;
    A.commit(s => {
      s.pl.rec[from] = s.pl.rec[from].filter(x => x.id !== rid);
      (s.pl.rec[to] = s.pl.rec[to] || []).push(Object.assign(r, patch || {}));
    });
  };

  /* ---------- dates and time ---------- */
  /* the Monday-or-Sunday that starts the week a date is in */
  P.weekStart = function (d, first) {
    const ws = first == null ? A.state.profile.weekStart : first, back = (A.date(d).getDay() - ws + 7) % 7;
    return A.addDays(d, -back);
  };
  const mins = hm => { const p = String(hm || '').split(':'); return (+p[0] || 0) * 60 + (+p[1] || 0); };
  const hm = m => pad(Math.floor(m / 60) % 24) + ':' + pad(Math.round(m % 60));
  P.mins = mins; P.hm = hm;
  P.nowMin = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
  P.clock = m => { const d = new Date(2024, 0, 1, Math.floor(m / 60) % 24, Math.round(m % 60)); return new Intl.DateTimeFormat(A.locale(), { hour: 'numeric', minute: '2-digit' }).format(d); };
  P.dur = function (m) {
    m = Math.max(0, Math.round(m));
    const h = Math.floor(m / 60), r = m % 60;
    return h && r ? A.t('{h} h {m} min', { h: h, m: r }) : h ? A.t('{h} h', { h: h }) : A.t('{m} min', { m: r });
  };
  /* waking hours left today: the planner's "safe to spend" */
  P.dayLeft = function () {
    const start = mins(S().day.start), end = mins(S().day.end) > start ? mins(S().day.end) : 24 * 60, now = P.nowMin();
    return { start: start, end: end, now: now, left: Math.max(0, end - Math.max(now, start)), gone: A.clamp((now - start) / (end - start), 0, 1), over: now >= end, early: now < start };
  };

  /* ---------- checklists and tasks ---------- */
  P.isDone = function (pg, r) {
    const k = pg && pg.o && pg.o.reset;
    if (k === 'day') return r.at === A.today();
    if (k === 'week') return !!r.at && P.weekStart(r.at) === P.weekStart(A.today());
    return !!r.done;
  };
  P.REPEATS = [['', A.T('Does not repeat')], ['daily', A.T('Every day')], ['weekdays', A.T('Every weekday')], ['weekly', A.T('Every week')], ['biweekly', A.T('Every 2 weeks')], ['monthly', A.T('Every month')], ['days', A.T('Every few days')]];
  /* A repeating job comes back counted from the day it was done, so nothing ever piles up behind you. */
  P.nextDue = function (r, from) {
    if (r.rep === 'daily') return A.addDays(from, 1);
    if (r.rep === 'weekdays') { let d = A.addDays(from, 1); while ([0, 6].indexOf(A.date(d).getDay()) >= 0) d = A.addDays(d, 1); return d; }
    if (r.rep === 'weekly') return A.addDays(from, 7);
    if (r.rep === 'biweekly') return A.addDays(from, 14);
    if (r.rep === 'monthly') { const ym = A.addMonths(A.ym(from), 1); return ym + '-' + pad(Math.min(+from.slice(8), A.monthDays(ym))); }
    if (r.rep === 'days') return A.addDays(from, A.clamp(Math.round(+r.every) || 3, 1, 365));
    return from;
  };
  /* Tick or untick. Returns a function that takes it back. */
  P.tick = function (pid, rid, on) {
    const r = P.find(pid, rid);
    if (!r) return () => {};
    const before = { done: r.done, at: r.at, due: r.due, last: r.last, n: r.n, steps: (r.steps || []).map(s => !!s.done) }, t = A.today();
    A.commit(() => {
      if (on === false) { r.done = false; delete r.at; return; }
      if (r.rep) {
        r.last = t; r.n = (r.n || 0) + 1; r.due = P.nextDue(r, t);
        (r.steps || []).forEach(s => { s.done = false; });
      } else { r.done = true; r.at = t; }
    });
    return () => A.commit(() => {
      const x = P.find(pid, rid);
      if (!x) return;
      x.done = before.done; x.at = before.at; x.due = before.due; x.last = before.last; x.n = before.n;
      (x.steps || []).forEach((s, i) => { s.done = !!before.steps[i]; });
      ['at', 'due', 'last', 'n'].forEach(k => { if (x[k] === undefined) delete x[k]; });
    });
  };
  P.stepsDone = r => { const s = r.steps || []; return { n: s.filter(x => x.done).length, of: s.length }; };
  const dated = () => A.memo('pl-dated', () => P.all().filter(pg => pg.kind === 'list' && pg.o && pg.o.dates && P.live(pg)));
  const mineOf = (pg, r) => !pg.o.who || !A.shared() || !r.who || r.who === P.who();
  /* every open task with a date, across all pages, as { pg, r } */
  P.dated = () => A.memo('pl-tasks-' + P.who(), () => {
    const out = [];
    dated().forEach(pg => P.recs(pg.id).forEach(r => { if (r.due && !r.done && mineOf(pg, r)) out.push({ pg: pg, r: r }); }));
    return out;
  });
  const byTime = (a, b) => (a.r.time || '99') < (b.r.time || '99') ? -1 : (a.r.time || '99') > (b.r.time || '99') ? 1 : 0;
  P.onDay = d => P.dated().filter(x => x.r.due === d).sort(byTime);
  P.carried = () => { const t = A.today(); return P.dated().filter(x => x.r.due < t).sort((a, b) => (a.r.due < b.r.due ? -1 : 1)); };
  P.doneOn = function (d) {
    const out = [];
    dated().forEach(pg => P.recs(pg.id).forEach(r => { if ((r.done && r.at === d) || (r.rep && r.last === d)) out.push({ pg: pg, r: r }); }));
    return out;
  };
  /* what was not done simply moves to today: no backlog, no red */
  P.carryAll = function () {
    const t = A.today(), list = P.carried(), was = list.map(x => [x.pg.id, x.r.id, x.r.due]);
    if (!list.length) return () => {};
    A.commit(() => list.forEach(x => { x.r.due = t; }));
    return () => A.commit(() => was.forEach(w => { const r = P.find(w[0], w[1]); if (r) r.due = w[2]; }));
  };

  /* ---------- the top three ---------- */
  const key = (pid, rid) => pid + ':' + rid;
  P.top = function (d) {
    d = d || A.today();
    const ids = (S().top[P.who()] || {})[d] || [], out = [];
    ids.forEach(k => { const i = k.indexOf(':'), pg = P.page(k.slice(0, i)), r = pg && P.find(pg.id, k.slice(i + 1)); if (r) out.push({ pg: pg, r: r }); });
    return out;
  };
  P.inTop = (pid, rid, d) => ((S().top[P.who()] || {})[d || A.today()] || []).indexOf(key(pid, rid)) >= 0;
  /* returns false when three are already chosen */
  P.toggleTop = function (pid, rid, d) {
    d = d || A.today();
    const k = key(pid, rid), have = P.inTop(pid, rid, d);
    if (!have && P.top(d).filter(x => !(x.r.done || (x.r.rep && x.r.last === d))).length >= 3) return false;
    A.commit(() => {
      const box = perWho('top'), list = (box[d] = (box[d] || []).filter(x => x !== k));
      if (!have) list.push(k);
      /* only the last two weeks are kept */
      Object.keys(box).forEach(x => { if (x < A.addDays(A.today(), -14)) delete box[x]; });
    });
    return true;
  };
  /* when nothing is chosen yet: what would make sense */
  P.suggest = function () {
    const t = A.today(), pool = P.onDay(t).concat(P.carried());
    return pool.sort((a, b) => (b.r.must ? 1 : 0) - (a.r.must ? 1 : 0) || (b.r.star ? 1 : 0) - (a.r.star ? 1 : 0)).slice(0, 5);
  };

  /* ---------- energy: full, low, foggy ---------- */
  /* moon phases stand for energy: every device can draw them */
  P.ENERGY = [['full', A.T('Full'), '🌕'], ['low', A.T('Low'), '🌗'], ['fog', A.T('Foggy'), '🌫️']];
  P.energy = () => (S().energy[P.who()] || {})[A.today()] || 'full';
  P.setEnergy = v => A.commit(() => { const box = perWho('energy'); Object.keys(box).forEach(k => { if (k < A.addDays(A.today(), -60)) delete box[k]; }); box[A.today()] = v; });

  /* ---------- the day in time blocks ---------- */
  /* A time block is simply a task with a date, a time and a length. */
  P.blocks = function (d) {
    return P.onDay(d).filter(x => x.r.time).map(x => { const s = mins(x.r.time), m = A.clamp(+x.r.min || 30, 5, 600); return { pg: x.pg, r: x.r, s: s, e: s + m }; }).sort((a, b) => a.s - b.s);
  };
  P.nowNext = function () {
    const t = A.today(), now = P.nowMin(), bl = P.blocks(t);
    return { now: bl.find(b => b.s <= now && now < b.e) || null, next: bl.find(b => b.s > now) || null };
  };
  /* Puts today's unscheduled tasks into the free time that is left: top three first, then what must happen. Returns an undo. */
  P.fill = function (d) {
    d = d || A.today();
    const day = P.dayLeft(), today = d === A.today();
    let cursor = today ? Math.max(day.start, Math.ceil((day.now + 5) / 15) * 15) : day.start;
    const busy = P.blocks(d).map(b => [b.s, b.e]), placed = [];
    const rank = x => (P.inTop(x.pg.id, x.r.id, d) ? 0 : x.r.must ? 1 : x.r.star ? 2 : 3);
    const todo = P.onDay(d).filter(x => !x.r.time).sort((a, b) => rank(a) - rank(b));
    A.commit(() => todo.forEach(x => {
      const len = A.clamp(+x.r.min || 30, 5, 240);
      let s = cursor;
      for (let guard = 0; guard < 60; guard++) {
        const hit = busy.find(b => s < b[1] && s + len > b[0]);
        if (!hit) break;
        s = Math.ceil((hit[1] + 10) / 5) * 5;
      }
      if (s + len > day.end) return;
      x.r.time = hm(s); if (!x.r.min) x.r.min = len;
      busy.push([s, s + len]); placed.push([x.pg.id, x.r.id]);
      cursor = s + len + 10;
    }));
    return { n: placed.length, left: todo.length - placed.length, undo: () => A.commit(() => placed.forEach(p => { const r = P.find(p[0], p[1]); if (r) delete r.time; })) };
  };

  /* ---------- quick capture: "call dentist tomorrow 15:30" ---------- */
  P.parse = function (text) {
    let t = String(text || '').replace(/\s+/g, ' ').trim(), due = '', time = '';
    const today = A.today(), cut = re => { const m = re.exec(t); if (!m) return null; t = (t.slice(0, m.index) + ' ' + t.slice(m.index + m[0].length)).replace(/\s+/g, ' ').trim(); return m; };
    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), word = w => new RegExp('(^|\\s)' + esc(w) + '(?=$|\\s|[,.!])', 'iu');
    const tm = cut(/(^|\s)(?:at\s+)?([01]?\d|2[0-3])[:.]([0-5]\d)(?=$|\s)/i);
    if (tm) time = pad(+tm[2]) + ':' + tm[3];
    const words = [[A.t('today'), 0], ['today', 0], [A.t('tomorrow'), 1], ['tomorrow', 1]];
    for (let i = 0; i < words.length && !due; i++) if (words[i][0] && cut(word(words[i][0]))) due = A.addDays(today, words[i][1]);
    if (!due) for (let i = 1; i <= 7 && !due; i++) {
      const d = A.addDays(today, i);
      if (cut(word(A.fmt(d, { weekday: 'long' })))) due = d;
    }
    if (time && !due) due = today;
    return { t: t, due: due, time: time };
  };
  /* goes to Tasks when it has a day, otherwise to the brain dump */
  P.capture = function (text) {
    const q = P.parse(text);
    if (!q.t) return null;
    const pid = q.due ? 'tasks' : 'inbox', rec = { t: q.t.slice(0, 200) };
    if (q.due) rec.due = q.due;
    if (q.time) rec.time = q.time;
    return { pid: pid, r: P.add(pid, rec), due: q.due, time: q.time };
  };

  /* ---------- habits ---------- */
  P.habitWeek = function (r, d) {
    const start = P.weekStart(d || A.today()), days = [];
    for (let i = 0; i < 7; i++) { const x = A.addDays(start, i); days.push({ d: x, on: !!(r.days && r.days[x]) }); }
    const per = A.clamp(Math.round(+r.per) || 7, 1, 7), n = days.filter(x => x.on).length;
    return { days: days, n: n, per: per, met: n >= per };
  };
  P.toggleHabit = function (pid, rid, d) {
    d = d || A.today();
    A.commit(() => {
      const r = P.find(pid, rid);
      if (!r) return;
      r.days = r.days || {};
      const on = !r.days[d], dose = Math.max(0, +r.dose || 1);
      if (on) r.days[d] = 1; else delete r.days[d];
      if (r.stock != null && r.stock !== '') r.stock = Math.max(0, (+r.stock || 0) + (on ? -dose : dose));
      Object.keys(r.days).forEach(k => { if (k < A.addDays(A.today(), -400)) delete r.days[k]; });
    });
  };
  const habitPages = () => A.memo('pl-habit-pages', () => P.all().filter(pg => pg.kind === 'habit' && P.live(pg)));
  /* habits still open today: not ticked yet, and this week's target not reached */
  P.habitsToday = function () {
    const t = A.today(), out = [];
    habitPages().forEach(pg => P.recs(pg.id).forEach(r => { const w = P.habitWeek(r, t); if (!(r.days && r.days[t]) && !w.met) out.push({ pg: pg, r: r, w: w }); }));
    return out;
  };

  /* ---------- daily logs ---------- */
  P.logOf = (pid, d) => P.recs(pid).find(r => r.d === d) || null;
  P.setLog = function (pid, d, patch) {
    const cur = P.logOf(pid, d);
    if (cur) A.commit(() => { Object.assign(cur, patch); });
    else P.add(pid, Object.assign({ d: d }, patch));
  };
  P.logDays = function (pid, n, end) {
    end = end || A.today();
    const by = {}, out = [];
    P.recs(pid).forEach(r => { by[r.d] = r; });
    for (let i = n - 1; i >= 0; i--) { const d = A.addDays(end, -i); out.push({ d: d, r: by[d] || null }); }
    return out;
  };
  P.avg = list => { const v = list.filter(x => x != null && x !== '' && isFinite(+x)).map(Number); return v.length ? A.sum(v) / v.length : null; };

  /* ---------- dates: birthdays, countdowns ---------- */
  P.nextOcc = function (r, from) {
    from = from || A.today();
    if (!r.yearly) return r.d;
    const md = r.d.slice(5), fix = y => { const ym = y + '-' + md.slice(0, 2); return ym + '-' + pad(Math.min(+md.slice(3), A.monthDays(ym))); };
    const y = +from.slice(0, 4), a = fix(y);
    return a >= from ? a : fix(y + 1);
  };
  P.daysTo = (r, from) => A.diff(from || A.today(), P.nextOcc(r, from));
  /* how many years it will be on the next occurrence (birthdays with a year) */
  P.turns = r => (r.yearly && +r.d.slice(0, 4) > 1900 ? +P.nextOcc(r).slice(0, 4) - +r.d.slice(0, 4) : 0);
  const datePages = () => A.memo('pl-date-pages', () => P.all().filter(pg => pg.kind === 'dates' && P.live(pg)));
  P.upcoming = function (days, from) {
    from = from || A.today();
    const out = [];
    datePages().forEach(pg => P.recs(pg.id).forEach(r => { const n = P.daysTo(r, from); if (n >= 0 && n <= days) out.push({ pg: pg, r: r, n: n, d: P.nextOcc(r, from) }); }));
    return out.sort((a, b) => a.n - b.n);
  };
  P.datesOn = d => { const out = []; datePages().forEach(pg => P.recs(pg.id).forEach(r => { if (P.nextOcc(r, d) === d) out.push({ pg: pg, r: r }); })); return out; };

  /* ---------- gentle nudges ---------- */
  P.nudges = function () {
    const t = A.today(), out = [];
    P.upcoming(7).forEach(x => out.push({ emoji: x.r.emoji || x.pg.emoji, go: P.route(x.pg), text: x.n === 0 ? A.t('{name}: today', { name: x.r.t }) : x.n === 1 ? A.t('{name}: tomorrow', { name: x.r.t }) : A.tn(x.n, '{name}: in {n} day|{name}: in {n} days', { name: x.r.t }) }));
    P.all().forEach(pg => {
      if (!P.live(pg)) return;
      if (pg.kind === 'cards' && pg.o && pg.o.nudge) P.recs(pg.id).forEach(r => {
        const every = +(r.f && r.f.every) || 0, last = r.f && r.f.last;
        if (every > 0 && (!A.isDate(last) || A.diff(last, t) >= every)) out.push({ emoji: pg.emoji, go: P.route(pg), text: A.t('It has been a while since you caught up with {name}.', { name: r.t }) });
      });
      if (pg.kind === 'habit' && pg.o && pg.o.stock) P.recs(pg.id).forEach(r => {
        if (r.stock != null && r.stock !== '' && +r.stock <= (+r.low || 7)) out.push({ emoji: '💊', go: P.route(pg), text: A.tn(Math.round(+r.stock), '{name}: {n} left. Time to refill.|{name}: {n} left. Time to refill.', { name: r.t }) });
      });
      if (pg.kind === 'notes' && pg.o && pg.o.sealed) P.recs(pg.id).forEach(r => {
        if (r.open && r.open <= t && !r.read) out.push({ emoji: '💌', go: P.route(pg), text: A.t('A letter you wrote to yourself can be opened now.') });
      });
    });
    const inbox = P.page('inbox'), n = inbox && P.live(inbox) ? P.recs('inbox').filter(r => !r.done).length : 0;
    if (n >= 8) out.push({ emoji: '🧺', go: '#/p/inbox', text: A.tn(n, '{n} thing is waiting in your brain dump.|{n} things are waiting in your brain dump. Sort two or three.') });
    return out.slice(0, 6);
  };

  /* ---------- words for today ---------- */
  P.words = function () {
    const pg = P.page('affirm');
    if (!pg || !P.live(pg)) return null;
    const list = P.recs('affirm').filter(r => (r.body || r.t || '').trim());
    if (!list.length) return null;
    const r = list[A.diff('2024-01-01', A.today()) % list.length];
    return (r.body || r.t).trim();
  };

  /* ---------- meals ---------- */
  P.SLOTS = [['b', A.T('Breakfast')], ['l', A.T('Lunch')], ['d', A.T('Dinner')]];
  P.meal = (d, slot) => { const x = (S().meals[d] || {})[slot]; return x ? { t: x.t || '', rid: x.rid || '' } : null; };
  P.setMeal = (d, slot, v) => A.commit(s => {
    const day = (s.pl.meals[d] = s.pl.meals[d] || {});
    if (v && (v.t || v.rid)) day[slot] = v; else delete day[slot];
    if (!Object.keys(day).length) delete s.pl.meals[d];
    Object.keys(s.pl.meals).forEach(k => { if (k < A.addDays(A.today(), -120)) delete s.pl.meals[k]; });
  });
  P.mealName = m => { if (!m) return ''; const r = m.rid ? P.find('recipes', m.rid) : null; return r ? r.t : m.t; };
  /* every ingredient of the week's planned recipes that is not on the shopping list yet goes onto it */
  P.shop = function (from) {
    const have = {}, add = [];
    P.raw('groceries').forEach(r => { if (!r.done) have[r.t.trim().toLowerCase()] = 1; });
    for (let i = 0; i < 7; i++) P.SLOTS.forEach(s => {
      const m = P.meal(A.addDays(from, i), s[0]), r = m && m.rid ? P.find('recipes', m.rid) : null;
      String((r && r.f && r.f.ing) || '').split('\n').map(x => x.trim()).filter(Boolean).forEach(line => {
        const k = line.toLowerCase();
        if (!have[k]) { have[k] = 1; add.push(line.slice(0, 120)); }
      });
    });
    if (add.length) A.commit(s => { const l = (s.pl.rec.groceries = s.pl.rec.groceries || []); add.forEach(t => l.push({ id: A.uid(), t: t })); });
    return add.length;
  };

  /* ---------- focus ---------- */
  P.focusDone = minutes => A.commit(() => { const box = perWho('fl'), t = A.today(); box[t] = Math.round((box[t] || 0) + minutes); Object.keys(box).forEach(k => { if (k < A.addDays(t, -400)) delete box[k]; }); }, 'quiet');
  P.focusOn = d => (S().fl[P.who()] || {})[d] || 0;

  /* ---------- the month in review ---------- */
  P.review = function (ym) {
    const from = ym + '-01', to = A.monthEnd(ym), inM = d => !!d && d >= from && d <= to, out = { done: 0, habits: 0, habitDays: 0, notes: 0, focus: 0, mood: null, energy: null, sleep: null, move: 0, best: [] };
    P.all().forEach(pg => {
      if (!P.live(pg)) return;
      const recs = P.recs(pg.id);
      if (pg.kind === 'list') recs.forEach(r => { if ((r.done && inM(r.at)) || (r.rep && inM(r.last))) out.done++; });
      if (pg.kind === 'habit') recs.forEach(r => { const n = Object.keys(r.days || {}).filter(inM).length; out.habits += n; if (n) out.best.push({ t: r.t, emoji: r.emoji || pg.emoji, n: n }); });
      if (pg.kind === 'notes') out.notes += recs.filter(r => inM(r.d)).length;
    });
    out.best.sort((a, b) => b.n - a.n);
    const logs = (pid, k) => P.recs(pid).filter(r => inM(r.d)).map(r => r[k]);
    out.mood = P.avg(logs('mood', 'v')); out.energy = P.avg(logs('mood', 'v2')); out.sleep = P.avg(logs('sleep', 'v'));
    out.move = A.sum(logs('move', 'v').filter(v => isFinite(+v)).map(Number));
    const fl = S().fl[P.who()] || {};
    out.focus = A.sum(Object.keys(fl).filter(inM), k => fl[k]);
    return out;
  };

  /* ---------- reminders: joined onto the budget planner's own schedule ---------- */
  const moneySchedule = A.schedule;
  A.schedule = function () {
    const out = moneySchedule(), now = Date.now(), t = A.today(), q = S().quiet;
    const at = (d, m) => { const x = A.date(d); x.setHours(Math.floor(m / 60), m % 60, 0, 0); return x.getTime(); };
    /* during quiet hours a reminder waits until they end */
    const calm = m => {
      if (!q.on) return m;
      const a = mins(q.from), b = mins(q.to);
      /* a window that runs past midnight ends on the next morning: 1440 minutes later */
      if (a > b) return m >= a ? b + 1440 : m < b ? b : m;
      return m >= a && m < b ? b : m;
    };
    const rem = mins(A.state.profile.remindAt || '09:00');
    for (let i = 0; i < 3; i++) {
      const d = A.addDays(t, i);
      P.blocks(d).forEach(b => {
        const when = at(d, calm(b.s));
        if (when > now - 36e5) out.push({ id: 'pl' + b.r.id + d, at: when, title: b.r.t, body: A.t('Starts at {time}.', { time: P.clock(b.s) }) });
      });
    }
    P.all().forEach(pg => {
      if (pg.kind !== 'dates' || !P.live(pg)) return;
      P.recs(pg.id).forEach(r => {
        if (r.remind == null || r.remind === '') return;
        const occ = P.nextOcc(r, t), day = A.addDays(occ, -(+r.remind || 0)), when = at(day, calm(rem));
        if (when > now - 6 * 36e5 && A.diff(t, day) <= 60) out.push({ id: 'pd' + r.id + occ, at: when, title: +r.remind ? A.tn(+r.remind, '{name}: in {n} day|{name}: in {n} days', { name: r.t }) : A.t('{name}: today', { name: r.t }), body: A.fmt(occ, { weekday: 'long', month: 'long', day: 'numeric' }) });
      });
    });
    habitPages().forEach(pg => P.recs(pg.id).forEach(r => {
      if (!/^\d\d:\d\d$/.test(r.time || '')) return;
      for (let i = 0; i < 2; i++) {
        const d = A.addDays(t, i), when = at(d, calm(mins(r.time)));
        if (when > now - 36e5 && !(r.days && r.days[d])) out.push({ id: 'ph' + r.id + d, at: when, title: r.t, body: A.t('Tap to tick it off.') });
      }
    }));
    return out.sort((a, b) => a.at - b.at);
  };
})(window.App);
