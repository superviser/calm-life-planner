/* home.js: Home answers "what now?": the time that is left today, the one thing for now, then at most three more.
   An energy switch reshapes it: on a low day only what must happen; on a foggy day one small thing at a time. */
'use strict';
(function (A) {
  const h = A.h, P = A.P, V = A.views;
  const mood = () => { const pg = P.page('mood'); return pg && P.live(pg) ? pg : null; };

  /* ---------- quick capture ---------- */
  function captured(res) {
    if (!res) { A.toast(A.t('Type something first.')); return; }
    const v = { when: res.due ? A.inDays(res.due) : '' };
    A.toast(res.due ? A.t('Added to Tasks for {when}.', v) : A.t('Kept in your brain dump. Sort it later.'), { action: A.t('Open'), fn: () => A.go(res.pid === 'tasks' ? 'p/tasks' : 'p/inbox') });
  }
  A.captureLine = function (id) {
    const input = h('input.quick-input', { id: id || 'capture', type: 'text', maxLength: 200, autocomplete: 'off', enterkeyhint: 'done', placeholder: A.t('Anything on your mind. Try “call dentist tomorrow”.'), 'aria-label': A.t('Quick capture') });
    return h('form.quick', { onsubmit: e => { e.preventDefault(); if (!input.value.trim()) return; A.refocus = '#' + input.id; captured(P.capture(input.value)); } },
      input, h('button.btn.primary', { type: 'submit' }, A.t('Keep it')));
  };
  /* the big "+" button: one line for anything, and a way to money */
  A.captureSheet = () => A.sheet(A.t('Add'), (body, api) => {
    const input = h('input', { type: 'text', maxLength: 200, autocomplete: 'off', enterkeyhint: 'done', placeholder: A.t('Anything on your mind…'), 'aria-label': A.t('Quick capture') });
    const keep = () => { if (!input.value.trim()) return; api.close(); captured(P.capture(input.value)); };
    const money = P.hubs().some(x => x.id === 'money');
    body.append(h('form.form', { onsubmit: e => { e.preventDefault(); keep(); } }, input,
      h('p.field-hint', { text: A.t('With a day in it (“tomorrow”, “friday 15:30”) it goes straight to your tasks. Without one it waits in the brain dump.') }),
      h('div.actions', null, money ? A.btn(A.t('A spend or income instead'), () => { api.close(); A.addSheet(); }) : null, h('button.btn.primary', { type: 'submit' }, A.t('Keep it')))));
    setTimeout(() => input.focus(), 30);
  });

  /* ---------- the hero: time left today ---------- */
  function ribbon(day) {
    const span = day.end - day.start, pos = m => (A.clamp((m - day.start) / span, 0, 1) * 100).toFixed(2) + '%';
    const bar = h('div.ribbon', { 'aria-hidden': 'true' }, h('i.ribbon-gone', { style: { width: (day.gone * 100).toFixed(2) + '%' } }));
    P.blocks(A.today()).forEach(b => bar.append(h('i.ribbon-block' + (b.e <= day.now ? '.past' : ''), { style: { left: pos(b.s), width: 'calc(' + pos(b.e) + ' - ' + pos(b.s) + ')' } })));
    if (!day.early && !day.over) bar.append(h('i.ribbon-now', { style: { left: (day.gone * 100).toFixed(2) + '%' } }));
    return h('div.ribbon-wrap', null, bar, h('div.ribbon-ends', { 'aria-hidden': 'true' }, h('span', { text: P.clock(day.start) }), h('span', { text: P.clock(day.end) })));
  }
  function hero(low) {
    const day = P.dayLeft(), nn = P.nowNext(), t = A.today();
    const line = b => A.t('{name} until {time}', { name: b.r.t, time: P.clock(b.e) });
    const sub = nn.now ? A.t('Now: {what}', { what: line(nn.now) }) : nn.next ? A.t('Next: {name} at {time}', { name: nn.next.r.t, time: P.clock(nn.next.s) })
      /* blocks that are all behind us are not "nothing planned": say nothing then */
      : P.blocks(t).length ? '' : A.t('Nothing is planned for a set time.');
    const open = P.onDay(t).filter(x => !x.r.time).length;
    return h('section.tray', null, h('div.hero', null,
      h('p.hero-label', { text: day.over ? A.t('The day is done') : day.early ? A.t('Your day starts at {time}', { time: P.clock(day.start) }) : A.t('Time left today') }),
      h('p.hero-num.time', { text: day.over ? A.t('Rest') : P.dur(day.left) }),
      ribbon(day),
      sub ? h('p.hero-sub', { text: sub }) : null,
      nn.now && nn.next ? h('p.sub', { text: A.t('Next: {name} at {time}', { name: nn.next.r.t, time: P.clock(nn.next.s) }) }) : null,
      low ? null : h('div.actions.start', { style: { marginTop: '10px' } },
        open && !day.over ? A.btn(A.tn(open, 'Fill my day ({n} task)|Fill my day ({n} tasks)'), () => {
          const res = P.fill(t);
          A.toast(res.n ? (res.left ? A.tn(res.n, '{n} task has a time now. The rest did not fit today.|{n} tasks have a time now. The rest did not fit today.') : A.tn(res.n, '{n} task has a time now.|{n} tasks have a time now.')) : A.t('There is no free time left today. Tomorrow is fine.'), res.n ? { action: A.t('Undo'), fn: res.undo } : null);
        }, 'primary', 'spark') : null,
        A.btn(A.t('Day plan'), () => A.go('p/day')))));
  }

  /* ---------- cards ---------- */
  function topCard() {
    const t = A.today(), top = P.top(t), list = h('div.rows');
    if (top.length) top.forEach(x => list.append(A.taskRow(x.pg, x.r, { noDate: true, calm: true })));
    const sug = top.length >= 3 ? [] : P.suggest().filter(x => !P.inTop(x.pg.id, x.r.id, t)).slice(0, 3 - top.length + 1);
    return h('section.panel.top3', null,
      h('div.panel-head', null, h('h2', { text: A.t('Top three') }), h('p.sub', { text: top.length ? A.t('{n} of 3 chosen', { n: top.length }) : A.t('Three, not twelve.') })),
      top.length ? list : h('p.quiet', { text: A.t('Pick up to three things that would make today a good day.') }),
      sug.length ? h('div.suggest', null, h('p.field-label', { text: top.length ? A.t('Room for one more?') : A.t('These are due') }),
        sug.map(x => h('button.chip.big', { type: 'button', onclick: () => { P.toggleTop(x.pg.id, x.r.id); } }, h('span', { 'aria-hidden': 'true', text: '☆ ' }), x.r.t))) : null,
      !top.length && !sug.length ? h('div.actions.start', null, A.btn(A.t('Add a task'), () => A.taskSheet(P.page('tasks'), null), 'primary')) : null);
  }
  function captureCard() {
    const n = P.recs('inbox').filter(r => !r.done).length;
    return h('section.panel', null, A.captureLine(),
      n ? h('button.link', { type: 'button', onclick: () => A.go('p/inbox') }, A.tn(n, '{n} thing in your brain dump|{n} things in your brain dump')) : null);
  }
  function todayCard(mustOnly) {
    const t = A.today(), inTop = x => P.inTop(x.pg.id, x.r.id, t), keep = x => !inTop(x) && (!mustOnly || x.r.must);
    const due = P.onDay(t).filter(keep), carried = P.carried().filter(keep), habits = P.habitsToday().filter(x => !mustOnly || (x.pg.o && x.pg.o.stock)), dates = P.datesOn(t);
    const meals = P.SLOTS.map(s => [s, P.meal(t, s[0])]).filter(x => x[1]);
    const done = P.doneOn(t).length;
    if (!due.length && !carried.length && !habits.length && !dates.length && !(meals.length && !mustOnly)) {
      return mustOnly ? null : h('section.panel', null, h('div.panel-head', null, h('h2', { text: A.t('Today') })), h('p.quiet', { text: done ? A.tn(done, 'Nothing else is waiting. {n} thing done today.|Nothing else is waiting. {n} things done today.') : A.t('Nothing else is waiting today.') }));
    }
    const s = h('section.panel', null, h('div.panel-head', null, h('h2', { text: mustOnly ? A.t('Only what has to happen') : A.t('Today') }), done ? h('p.sub', { text: A.tn(done, '{n} done|{n} done') }) : null));
    if (dates.length) s.append(h('div.chips', null, dates.map(x => h('a.chip', { href: P.route(x.pg) }, h('span', { 'aria-hidden': 'true', text: (x.r.emoji || x.pg.emoji) + ' ' }), x.r.t))));
    if (due.length) s.append(h('div.rows', null, due.map(x => A.taskRow(x.pg, x.r, { noDate: true, page: x.pg.id !== 'tasks' }))));
    if (habits.length) s.append(h('div.ticks', { role: 'group', 'aria-label': A.t('Habits still open today') }, habits.map(x => h('button.chip.big', {
      type: 'button', onclick: () => { P.toggleHabit(x.pg.id, x.r.id, t); A.toast(A.t('{name}: ticked for today.', { name: x.r.t }), { action: A.t('Undo'), fn: () => P.toggleHabit(x.pg.id, x.r.id, t) }); }
    }, h('span', { 'aria-hidden': 'true', text: (x.r.emoji || x.pg.emoji) + ' ' }), x.r.t))));
    if (carried.length) s.append(h('div.carry', null,
      h('p.field-label', { text: A.tn(carried.length, '{n} thing came over from earlier|{n} things came over from earlier') }),
      h('div.rows', null, carried.slice(0, 4).map(x => A.taskRow(x.pg, x.r, { calm: true, page: x.pg.id !== 'tasks' }))),
      h('div.actions.start', null, A.btn(A.t('Move them all to today'), () => { const undo = P.carryAll(); A.toast(A.t('Moved to today. A clean start.'), { action: A.t('Undo'), fn: undo }); }),
        carried.length > 4 ? A.btn(A.t('See all'), () => A.go('p/tasks')) : null)));
    if (meals.length && !mustOnly) s.append(h('a.meal-line', { href: '#/p/meals' }, h('span', { 'aria-hidden': 'true', text: '🍽️ ' }), meals.map(x => A.t(x[0][1]) + ': ' + P.mealName(x[1])).join(' · ')));
    return s;
  }
  function moodCard() {
    const pg = mood();
    if (!pg) return null;
    return h('section.panel.calm-hide', null, h('div.panel-head', null, h('h2', { text: A.t('How are you?') }), h('a.link', { href: '#/p/mood' }, A.t('History'))), A.logControl(pg, A.today()));
  }
  function moneyCard() {
    if (!P.hubs().some(x => x.id === 'money')) return null;
    const N = A.now(), m = N.m, att = A.attention().length;
    if (!m.expected && !m.out && !m.roll && !att) return null;
    return h('a.panel.money-card.calm-hide', { href: '#/today' },
      h('span.money-label', { text: m.safe < 0 ? A.t('Past this month’s money by') : A.t('Safe to spend') }),
      h('strong.money-num', { text: A.money(Math.abs(m.safe), { whole: true }) }),
      h('span.sub', { text: att ? A.tn(att, '{n} bill or payday is waiting on you|{n} bills or paydays are waiting on you') : m.safe < 0 ? A.t('Bills are already counted') : A.t('About {amt} a day until {date}', { amt: A.money(Math.max(0, N.share), { whole: true }), date: A.dShort(A.monthEnd(m.ym)) }) }));
  }
  function nudgeCard() {
    const list = P.nudges();
    if (!list.length) return null;
    return h('section.panel.calm-hide', null, h('div.panel-head', null, h('h2', { text: A.t('Gentle nudges') })),
      h('div.rows', null, list.map(n => h('a.row.row-btn', { href: n.go }, h('span.row-emoji', { 'aria-hidden': 'true', text: n.emoji }), h('span.row-main', null, h('span.row-title.soft', { text: n.text }))))));
  }
  function wordsCard() {
    const w = P.words();
    return w ? h('blockquote.words.calm-hide', null, h('p', { text: w })) : null;
  }
  const CARDS = { top: topCard, capture: captureCard, today: () => todayCard(false), mood: moodCard, money: moneyCard, nudges: nudgeCard, words: wordsCard };
  P.homeCards = () => { const all = A.HOME_CARDS.map(c => c.id), own = A.state.pl.home; return own ? own.filter(id => all.indexOf(id) >= 0) : all; };

  /* ---------- foggy day: one small thing ---------- */
  function fogCard() {
    const t = A.today(), pool = [];
    P.top(t).filter(x => !x.r.done).forEach(x => pool.push(x));
    P.onDay(t).concat(P.carried()).forEach(x => { if (!pool.some(y => y.r.id === x.r.id)) pool.push(x); });
    pool.sort((a, b) => (b.r.must ? 1 : 0) - (a.r.must ? 1 : 0));
    const i = (A.ui.fog || 0) % Math.max(1, pool.length), x = pool[i];
    const habit = !x ? P.habitsToday()[0] : null;
    const step = x ? ((x.r.steps || []).find(s => !s.done) || {}).t : '';
    return h('section.panel.fog', null,
      h('p.field-label', { text: A.t('One small thing') }),
      x ? h('p.fog-task', { text: step || x.r.t }) : habit ? h('p.fog-task', { text: habit.r.t }) : h('p.fog-task', { text: A.t('Nothing has to happen right now. A glass of water counts.') }),
      x && step ? h('p.sub', { text: A.t('The first step of “{name}”', { name: x.r.t }) }) : null,
      h('div.actions.start', null,
        x ? A.btn(A.t('Done'), () => {
          if (step) A.commit(() => { const s = x.r.steps.find(z => !z.done); if (s) s.done = true; }); else P.tick(x.pg.id, x.r.id, true);
          A.toast(A.t('That counts. Well done.'));
        }, 'primary', 'check') : habit ? A.btn(A.t('Done'), () => P.toggleHabit(habit.pg.id, habit.r.id, t), 'primary', 'check') : null,
        pool.length > 1 ? A.btn(A.t('Something else'), () => { A.ui.fog = i + 1; A.render(); }) : null,
        x && !step ? A.btn(A.t('Make it smaller'), () => A.taskSheet(x.pg, x.r)) : null));
  }

  V.home = function (root) {
    const p = A.state.profile, hr = new Date().getHours(), en = P.energy(), t = A.today();
    const name = A.shared() && A.me() ? A.me().name : p.userName, v = { name: name };
    const hi = name
      ? (hr < 5 ? A.t('Still up, {name}', v) : hr < 12 ? A.t('Good morning, {name}', v) : hr < 18 ? A.t('Good afternoon, {name}', v) : A.t('Good evening, {name}', v))
      : (hr < 5 ? A.t('Still up') : hr < 12 ? A.t('Good morning') : hr < 18 ? A.t('Good afternoon') : A.t('Good evening'));
    root.append(A.pageHead(hi, A.dLong(t)));
    root.append(h('div.energy', null, h('span.field-label', { id: 'energy-label', text: A.t('Energy today') }),
      A.seg(P.ENERGY.map(e => [e[0], e[2] + ' ' + A.t(e[1])]), en, val => P.setEnergy(val), A.t('Energy today'))));
    const keep = A.backupCard();   /* not on a foggy day: one thing at a time */
    if (keep && en !== 'fog') root.append(keep);
    if (en === 'fog') {
      root.append(h('p.mode-note', { text: A.t('Foggy day. One thing at a time; everything else can wait.') }), fogCard(), h('section.panel', null, A.captureLine()));
      return;
    }
    if (en === 'low') {
      root.append(h('p.mode-note', { text: A.t('Low-energy day. Only what has to happen is shown.') }));
      root.append(h('div.cols', null, h('div.col-main', null, hero(true), topCard()), h('div.col-side', null, todayCard(true), h('section.panel', null, A.captureLine()))));
      return;
    }
    const ids = P.homeCards(), main = [], side = [];
    ids.forEach(id => { const el = CARDS[id] && CARDS[id](); if (el) (id === 'top' || id === 'capture' || id === 'today' ? main : side).push(el); });
    root.append(h('div.cols', null, h('div.col-main', null, hero(false), main), h('div.col-side', null, side)));
  };
})(window.App);
