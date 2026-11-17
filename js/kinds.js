/* kinds.js: one screen and one editor for each of the six building blocks (list, habit, log, notes, dates, cards) */
'use strict';
(function (A) {
  const h = A.h, P = A.P, K = A.kinds = {};
  const tr = P.tr;
  const whoName = id => { const m = A.by(A.state.people, id); return m ? m.emoji + ' ' + m.name : ''; };
  const whoSelect = (val, any) => A.select([['', any || A.t('Anyone')]].concat(A.members().map(m => [m.id, m.emoji + ' ' + m.name])), val || '');
  const undoToast = (text, undo) => A.toast(text, undo ? { action: A.t('Undo'), fn: undo } : null);
  const sectionsOf = pg => (pg.o && pg.o.sections) || null;
  A.FACES = ['😣', '🙁', '😐', '🙂', '😄'];
  A.CHARGE = ['🌑', '🌘', '🌗', '🌖', '🌕'];

  /* ================= list ================= */
  function dueText(r) {
    const bits = [];
    if (r.due) bits.push(A.rel(r.due));
    if (r.time) bits.push(P.clock(P.mins(r.time)));
    if (r.rep) bits.push(A.t('repeats'));
    return bits;
  }
  /* one line of a checklist; used on the page itself, on Home, and in the Day and Week screens */
  A.taskRow = function (pg, r, opt) {
    opt = opt || {};
    const o = pg.o || {}, done = P.isDone(pg, r), st = P.stepsDone(r), meta = opt.noDate ? (r.time && !opt.noTime ? [P.clock(P.mins(r.time))] : []) : dueText(r);
    const late = !done && r.due && r.due < A.today();
    if (opt.page) meta.unshift(P.name(pg));
    if (st.of) meta.push(A.t('{n} of {total} steps', { n: st.n, total: st.of }));
    if (r.min && r.time && !opt.noTime) meta.push(P.dur(r.min));
    if (o.who && r.who && A.shared()) meta.push(whoName(r.who));
    if (r.must) meta.push(A.t('must'));
    const next = st.of && !done ? (r.steps.find(s => !s.done) || {}).t : '';
    const tick = o.menu ? null : h('button.tick', {
      type: 'button', role: 'checkbox', 'aria-checked': String(done), 'aria-label': done ? A.t('Undo: {name}', { name: r.t }) : A.t('Mark done: {name}', { name: r.t }),
      onclick: () => { const undo = P.tick(pg.id, r.id, !done); if (!done) undoToast(r.rep ? A.t('Done. It comes back {when}.', { when: A.inDays(P.find(pg.id, r.id).due) }) : A.t('Done.'), undo); }
    }, done ? A.icon('check') : null);
    const star = (o.dates || o.star) && !done && opt.star !== false ? h('button.star', {
      type: 'button', 'aria-pressed': String(P.inTop(pg.id, r.id)), 'aria-label': A.t('One of today’s top three: {name}', { name: r.t }),
      onclick: () => { if (!P.toggleTop(pg.id, r.id)) A.toast(A.t('Three is the limit. Take one out first.')); }
    }, P.inTop(pg.id, r.id) ? '★' : '☆') : null;
    return h('div.row' + (done ? '.done' : '') + (late && !opt.calm ? '.carried' : ''), null, tick,
      h('button.row-main', { type: 'button', onclick: () => A.taskSheet(pg, r) },
        h('span.row-title', { text: r.t }),
        next ? h('span.row-meta.next-step', { text: A.t('Next: {step}', { step: next }) }) : null,
        meta.length ? h('span.row-meta', { text: meta.join(' · ') }) : null,
        o.big && st.of ? A.meter(st.n / st.of, 'ok') : null),
      star);
  };
  function inboxRow(pg, r) {
    const send = (days, label) => h('button.chip', { type: 'button', onclick: () => { P.move('inbox', r.id, 'tasks', days == null ? {} : { due: A.addDays(A.today(), days) }); A.toast(A.t('Moved to Tasks.')); } }, label);
    return h('div.row.inbox-row', null,
      h('button.row-main', { type: 'button', onclick: () => A.taskSheet(pg, r) }, h('span.row-title', { text: r.t })),
      h('span.row-actions', null, send(0, A.t('Today')), send(1, A.t('Tomorrow')), send(null, A.t('Later')),
        h('button.icon-btn', { type: 'button', 'aria-label': A.t('Delete: {name}', { name: r.t }), onclick: () => { const u = P.remove('inbox', r.id); undoToast(A.t('Deleted.'), u && u.undo); } }, A.icon('x'))));
  }
  K.list = function (root, pg) {
    const o = pg.o || {}, recs = P.recs(pg.id), secs = sectionsOf(pg), t = A.today();
    const open = recs.filter(r => !P.isDone(pg, r)), done = recs.filter(r => P.isDone(pg, r));
    /* add line: type and press Enter. On pages with dates, "tomorrow" or "friday 15:30" in the text sets the day. */
    const input = h('input', { type: 'text', id: 'add-' + pg.id, maxLength: 200, autocomplete: 'off', enterkeyhint: 'done', placeholder: o.inbox ? A.t('Whatever is on your mind…') : o.dates ? A.t('Add something. Try “call dentist tomorrow”.') : A.t('Add something…'), 'aria-label': A.t('Add to {page}', { page: P.name(pg) }) });
    const sec = secs ? A.select(secs.map((s, i) => [i, tr(s)]), A.ui.sec && A.ui.sec[pg.id] != null ? A.ui.sec[pg.id] : 0, { 'aria-label': A.t('Section'), onchange: e => { (A.ui.sec = A.ui.sec || {})[pg.id] = +e.target.value; } }) : null;
    root.append(h('form.quick.add-line', {
      onsubmit: e => {
        e.preventDefault();
        const q = o.dates ? P.parse(input.value) : { t: input.value.trim() };
        if (!q.t) return;
        const rec = { t: q.t.slice(0, 200) };
        if (q.due) rec.due = q.due;
        if (q.time) rec.time = q.time;
        if (sec) rec.sec = +sec.value;
        A.refocus = '#add-' + pg.id;
        P.add(pg.id, rec);
      }
    }, input, sec, h('button.btn.primary', { type: 'submit' }, A.t('Add'))));

    const rowOf = r => (o.inbox ? inboxRow(pg, r) : A.taskRow(pg, r));
    const panel = (title, list, sub, extra) => h('section.panel', null, title ? h('div.panel-head', null, h('h2', { text: title }), sub ? h('p.sub', { text: sub }) : null) : null, h('div.rows', null, list.map(rowOf)), extra);
    if (!recs.length) {
      root.append(h('section.panel', null, A.empty(pg.blurb ? tr(pg.blurb) + '. ' + A.t('Nothing here yet.') : A.t('Nothing here yet.'), null)));
      return;
    }
    if (o.menu) {
      const pick = () => { const r = open[Math.floor(Math.random() * open.length)]; if (r) A.sheet(A.t('How about this one?'), (body, api) => body.append(h('p.pick', { text: r.t }), r.note ? h('p.sub', { text: r.note }) : null, h('div.actions', null, A.btn(A.t('Another'), () => { api.close(); pick(); }), A.btn(A.t('Good idea'), api.close, 'primary')))); };
      root.append(h('div.actions.start', null, A.btn(A.t('Pick one for me'), pick, 'primary', 'spark')));
    }
    if (o.byWho && A.shared()) {
      A.members().concat([null]).forEach(m => {
        const mine = open.filter(r => (m ? r.who === m.id : !r.who || !A.by(A.members(), r.who)));
        if (mine.length) root.append(panel(m ? m.emoji + ' ' + m.name : A.t('Anyone'), mine.sort((a, b) => (a.due || '9') < (b.due || '9') ? -1 : 1), A.tn(mine.length, '{n} job|{n} jobs')));
      });
    } else if (secs) {
      secs.forEach((s, i) => {
        const mine = recs.filter(r => (+r.sec || 0) === i);
        if (!mine.length) return;
        const left = mine.filter(r => !P.isDone(pg, r)).length;
        root.append(panel(tr(s), mine, o.menu ? null : left ? A.tn(left, '{n} to go|{n} to go') : A.t('All done')));
      });
    } else if (o.dates) {
      const now = open.filter(r => r.due && r.due <= t).sort((a, b) => (a.due < b.due ? -1 : 1)), later = open.filter(r => r.due && r.due > t).sort((a, b) => (a.due < b.due ? -1 : 1)), free = open.filter(r => !r.due);
      if (now.length) root.append(panel(A.t('Today'), now, now.some(r => r.due < t) ? A.t('Some of these came over from earlier days. That is fine.') : null));
      if (later.length) root.append(panel(A.t('Coming up'), later));
      if (free.length) root.append(panel(A.t('Whenever'), free));
      if (!open.length) root.append(h('section.panel', null, h('p.quiet', { text: A.t('All clear. Nothing open here.') })));
    } else if (open.length) root.append(panel(null, open));
    else root.append(h('section.panel', null, h('p.quiet', { text: A.t('All clear. Nothing open here.') })));

    if (!secs && !o.byWho ? done.length : (o.byWho && done.length)) {
      const shown = done.slice(-30).reverse(), key = 'done-' + pg.id, openMap = A.ui.open || (A.ui.open = {});
      root.append(h('section.panel', null, h('details.more-info', { open: !!openMap[key], ontoggle: e => { openMap[key] = e.target.open; } },
        h('summary', { text: A.tn(done.length, '{n} done|{n} done') }), h('div.rows', null, shown.map(rowOf))),
        o.shop || o.inbox ? h('div.actions.start', null, A.btn(A.t('Clear the ticked ones'), () => { const ids = done.map(r => r.id); A.commit(s => { s.pl.rec[pg.id] = s.pl.rec[pg.id].filter(r => ids.indexOf(r.id) < 0); }); })) : null));
    }
    if (o.reset === 'manual' && done.length) root.append(h('div.actions.start', null, A.btn(A.t('Untick everything'), () => A.commit(() => recs.forEach(r => { r.done = false; delete r.at; })))));
    if (o.reset === 'day') root.append(h('p.quiet', { text: A.t('The ticks clear by themselves every morning.') }));
    if (o.reset === 'week') root.append(h('p.quiet', { text: A.t('The ticks clear by themselves every week.') }));
  };

  /* pre: values a new item starts with, such as the day it was added from */
  A.taskSheet = function (pg, r0, pre) {
    const o = pg.o || {}, isNew = !r0, r = r0 || Object.assign({ t: '' }, pre || {}), secs = sectionsOf(pg);
    A.sheet(isNew ? A.t('Add to {page}', { page: P.name(pg) }) : P.name(pg), (body, api) => {
      const text = h('input', { type: 'text', value: r.t, maxLength: 200 });
      const due = o.dates ? A.dateInput(r.due || '') : null, time = o.dates ? h('input', { type: 'time', value: r.time || '' }) : null;
      const len = o.dates ? A.select([[0, A.t('No set length')], [10, P.dur(10)], [15, P.dur(15)], [30, P.dur(30)], [45, P.dur(45)], [60, P.dur(60)], [90, P.dur(90)], [120, P.dur(120)]], r.min || 0) : null;
      const rep = o.repeat ? A.select(A.opts(P.REPEATS), r.rep || '', { onchange: () => { every.parentNode.hidden = rep.value !== 'days'; } }) : null;
      const every = h('input', { type: 'text', inputmode: 'numeric', maxLength: 3, value: String(r.every || 3) });
      const who = o.who && A.shared() ? whoSelect(r.who) : null;
      const sec = secs ? A.select(secs.map((s, i) => [i, tr(s)]), +r.sec || 0) : null;
      const note = h('textarea', { rows: 2, maxLength: 1000, value: r.note || '' });
      const must = h('input', { type: 'checkbox', checked: !!r.must });
      const steps = (r.steps || []).map(s => ({ t: s.t, done: !!s.done })), stepBox = h('div.steps-edit');
      const drawSteps = () => {
        stepBox.replaceChildren(steps.map((s, i) => h('div.step-line', null,
          h('input', { type: 'checkbox', checked: s.done, 'aria-label': A.t('Step done'), onchange: e => { s.done = e.target.checked; } }),
          h('input', { type: 'text', value: s.t, maxLength: 160, 'aria-label': A.t('Step {n}', { n: i + 1 }), oninput: e => { s.t = e.target.value; } }),
          h('button.icon-btn', { type: 'button', 'aria-label': A.t('Remove step {n}', { n: i + 1 }), onclick: () => { steps.splice(i, 1); drawSteps(); } }, A.icon('x')))),
          h('button.link', { type: 'button', onclick: () => { steps.push({ t: '', done: false }); drawSteps(); const ins = stepBox.querySelectorAll('input[type=text]'); if (ins.length) ins[ins.length - 1].focus(); } }, steps.length ? A.t('Add another step') : A.t('Make it smaller: add a first tiny step')));
      };
      const save = () => {
        const t = text.value.trim();
        if (!t) { A.toast(A.t('Give it a name.')); return; }
        const v = { t: t, note: note.value.trim() };
        if (o.dates) { v.due = A.isDate(due.value) ? due.value : ''; v.time = /^\d\d:\d\d$/.test(time.value) && (v.due || (v.due = A.today())) ? time.value : ''; v.min = +len.value || 0; v.must = must.checked; }
        if (rep) { v.rep = rep.value; v.every = A.clamp(Math.round(A.num(every.value)) || 3, 1, 365); if (v.rep && !v.due) v.due = A.today(); }
        if (who) v.who = who.value;
        if (sec) v.sec = +sec.value;
        if (o.steps) v.steps = steps.filter(s => s.t.trim()).map(s => ({ t: s.t.trim(), done: s.done }));
        if (isNew) P.add(pg.id, v); else P.save(pg.id, r.id, v);
        api.close();
      };
      body.append(h('div.form', null, A.field(A.t('What is it'), text),
        o.dates ? h('div.form-row', null, A.field(A.t('Day'), due), A.field(A.t('Time (optional)'), time)) : null,
        o.dates ? A.field(A.t('How long'), len, A.t('A day and a time make it a block on your day plan.')) : null,
        rep ? A.field(A.t('Repeats'), rep, A.t('It comes back counted from the day you did it, so nothing piles up.')) : null,
        rep ? (() => { const f = A.field(A.t('Every how many days'), every); f.hidden = (r.rep || '') !== 'days'; return f; })() : null,
        who ? A.field(A.t('Whose job'), who) : null, sec ? A.field(A.t('Section'), sec) : null,
        o.steps ? A.group(A.t('Steps'), stepBox, A.t('Stuck? Write only the first two-minute step. That is enough to start.')) : null,
        A.field(A.t('Note'), note),
        o.dates ? h('label.check', null, must, h('span', null, A.t('It has to happen'), h('span.field-hint', { text: A.t('Shown even on a low-energy day.') }))) : null),
        h('div.actions', null,
          isNew ? null : A.btn(A.t('Delete'), () => { const u = P.remove(pg.id, r.id); api.close(); undoToast(A.t('Deleted.'), u && u.undo); }, 'danger'),
          A.btn(isNew ? A.t('Add') : A.t('Save'), save, 'primary')));
      if (o.steps) drawSteps();
      if (isNew) setTimeout(() => text.focus(), 30);
    });
  };

  /* ================= habit ================= */
  A.habitRow = function (pg, r) {
    const w = P.habitWeek(r), t = A.today(), o = pg.o || {};
    const meta = [A.t('{n} of {total} this week', { n: w.n, total: w.per })];
    if (o.stock && r.stock != null && r.stock !== '') meta.push(A.tn(Math.round(+r.stock), '{n} left|{n} left'));
    if (r.time) meta.push(P.clock(P.mins(r.time)));
    return h('div.habit', null,
      h('button.habit-main', { type: 'button', onclick: () => A.habitSheet(pg, r) },
        h('span.row-emoji', { 'aria-hidden': 'true', text: r.emoji || pg.emoji }),
        h('span.row-main', null, h('span.row-title', null, r.t, w.met ? A.pill(A.t('Target met'), 'good') : null), h('span.row-meta', { text: meta.join(' · ') }))),
      h('div.week-dots', { role: 'group', 'aria-label': A.t('This week: {name}', { name: r.t }) }, w.days.map(d => h('button.dot' + (d.d === t ? '.is-today' : '') + (d.d > t ? '.future' : ''), {
        type: 'button', 'aria-pressed': String(d.on), disabled: d.d > t, 'aria-label': A.dLong(d.d),
        onclick: () => P.toggleHabit(pg.id, r.id, d.d)
      }, h('span', { text: A.fmt(d.d, { weekday: 'narrow' }) })))));
  };
  K.habit = function (root, pg) {
    const recs = P.recs(pg.id);
    if (!recs.length) { root.append(h('section.panel', null, A.empty(tr(pg.blurb), A.t('Add the first one'), () => A.habitSheet(pg)))); return; }
    const met = recs.filter(r => P.habitWeek(r).met).length;
    root.append(h('section.panel', null,
      h('div.panel-head', null, h('h2', { text: A.t('This week') }), h('p.sub', { text: A.t('{n} of {total} on target', { n: met, total: recs.length }) })),
      h('div.habits', null, recs.map(r => A.habitRow(pg, r)))),
      h('p.quiet', { text: A.t('A missed day changes nothing. Only the week counts, and next week starts fresh.') }));
  };
  A.habitSheet = function (pg, r0) {
    const o = pg.o || {}, isNew = !r0, r = r0 || { t: '', emoji: pg.emoji, per: o.stock ? 7 : 5 };
    A.sheet(isNew ? A.t('Add to {page}', { page: P.name(pg) }) : r.t, (body, api) => {
      const text = h('input', { type: 'text', value: r.t, maxLength: 80 }), emoji = h('input.emoji-in', { type: 'text', value: r.emoji || '', maxLength: 8, 'aria-label': A.t('Emoji') });
      const per = A.select([1, 2, 3, 4, 5, 6, 7].map(n => [n, n === 7 ? A.t('Every day') : A.tn(n, '{n} time a week|{n} times a week')]), r.per || 5);
      const time = h('input', { type: 'time', value: r.time || '' });
      const stock = A.amountInput(r.stock == null ? '' : r.stock), dose = A.amountInput(r.dose || 1), low = A.amountInput(r.low || 7);
      body.append(h('div.form', null, h('div.form-row.emoji-row', null, A.field(A.t('Emoji'), emoji), A.field(A.t('Name'), text)),
        A.field(A.t('How often'), per), A.field(A.t('Remind me at (optional)'), time),
        o.stock ? h('div.form-row', null, A.field(A.t('How many are left'), stock), A.field(A.t('Taken each time'), dose)) : null,
        o.stock ? A.field(A.t('Tell me to refill when this many are left'), low) : null),
        h('div.actions', null,
          isNew ? null : A.btn(A.t('Delete'), () => { const u = P.remove(pg.id, r.id); api.close(); undoToast(A.t('Deleted.'), u && u.undo); }, 'danger'),
          A.btn(isNew ? A.t('Add') : A.t('Save'), () => {
            if (!text.value.trim()) { A.toast(A.t('Give it a name.')); return; }
            const v = { t: text.value.trim(), emoji: emoji.value.trim() || pg.emoji, per: +per.value, time: /^\d\d:\d\d$/.test(time.value) ? time.value : '' };
            if (o.stock) { v.stock = stock.value.trim() === '' ? null : A.num(stock.value); v.dose = A.num(dose.value) || 1; v.low = A.num(low.value); }
            if (isNew) P.add(pg.id, Object.assign({ days: {} }, v)); else P.save(pg.id, r.id, v);
            api.close();
          }, 'primary')));
      if (isNew) setTimeout(() => text.focus(), 30);
    });
  };

  /* ================= log ================= */
  /* the control for one day's value; used on the page and on Home */
  A.logControl = function (pg, d, onchange) {
    const o = pg.o || {}, cur = P.logOf(pg.id, d) || {};
    const set = patch => { P.setLog(pg.id, d, patch); if (onchange) onchange(); };
    if (o.scale) {
      const row = (k, faces, label) => h('div.scale', { role: 'group', 'aria-label': label }, faces.map((f, i) => h('button.face', {
        type: 'button', 'aria-pressed': String(+cur[k] === i + 1), 'aria-label': label + ' ' + (i + 1), onclick: () => { const p = {}; p[k] = +cur[k] === i + 1 ? null : i + 1; set(p); }
      }, f)));
      return h('div.stack', null, row('v', A.FACES, A.t('Mood')), o.second ? h('p.field-label', { text: A.t('Energy') }) : null, o.second ? row('v2', A.CHARGE, A.t('Energy')) : null);
    }
    if (o.yes) return h('button.btn' + (cur.v ? '.primary' : ''), { type: 'button', 'aria-pressed': String(!!cur.v), onclick: () => set({ v: cur.v ? null : 1 }) }, cur.v ? A.icon('check') : null, cur.v ? A.t('Yes, today counts') : A.t('Mark today'));
    const step = +o.step || 1, max = +o.max || 999, val = cur.v == null || cur.v === '' ? null : +cur.v;
    const input = h('input.stepper-in', { type: 'text', inputmode: 'decimal', value: val == null ? '' : String(val), placeholder: '0', 'aria-label': P.name(pg), onchange: e => set({ v: e.target.value.trim() === '' ? null : A.clamp(A.num(e.target.value), 0, max) }) });
    /* the first tap starts from a sensible value (8 hours, 30 minutes), not from zero */
    const bump = n => set({ v: val == null ? (+o.good || step) : A.clamp(A.r2(val + n), 0, max) });
    return h('div.stepper', null,
      h('button.icon-btn', { type: 'button', 'aria-label': A.t('Less'), onclick: () => bump(-step) }, '−'), input, h('span.stepper-unit', { text: o.unit === 'h' ? A.t('hours') : o.unit === 'min' ? A.t('minutes') : (o.unit || '') }),
      h('button.icon-btn', { type: 'button', 'aria-label': A.t('More'), onclick: () => bump(step) }, A.icon('plus')));
  };
  const logShow = (pg, v) => { const o = pg.o || {}; if (v == null || v === '') return ''; return o.scale ? A.FACES[A.clamp(+v, 1, 5) - 1] : o.yes ? '✓' : String(+v); };
  K.log = function (root, pg) {
    const o = pg.o || {}, t = A.today(), cur = P.logOf(pg.id, t) || {}, wide = window.innerWidth >= 560, days = P.logDays(pg.id, wide ? 14 : 7), top = o.scale ? 5 : o.yes ? 1 : Math.max(+o.good || 1, Math.max.apply(null, days.map(x => +(x.r && x.r.v) || 0)));
    const note = h('input', { type: 'text', value: cur.note || '', maxLength: 200, placeholder: A.t('A word about today (optional)'), 'aria-label': A.t('Note for today'), onchange: e => P.setLog(pg.id, t, { note: e.target.value.trim() }) });
    root.append(h('section.panel', null, h('div.panel-head', null, h('h2', { text: A.t('Today') }), h('p.sub', { text: A.dLong(t) })), A.logControl(pg, t), note));
    const month = P.recs(pg.id).filter(r => A.ym(r.d) === A.ym(t)), avg = P.avg(month.map(r => r.v));
    const sub = o.yes ? A.tn(month.filter(r => r.v).length, '{n} day this month|{n} days this month') : avg == null ? A.t('Nothing logged this month yet.') : o.scale ? A.t('This month’s average: {v} out of 5', { v: avg.toFixed(1) }) : A.t('This month’s average: {v}', { v: avg.toFixed(1) });
    root.append(h('section.panel', null, h('div.panel-head', null, h('h2', { text: wide ? A.t('The last two weeks') : A.t('The last week') }), h('p.sub', { text: sub })),
      h('div.logbars', { role: 'group', 'aria-label': wide ? A.t('The last two weeks') : A.t('The last week'), style: { '--n': days.length } }, days.map(x => {
        const v = x.r ? +x.r.v || 0 : 0, v2 = o.second && x.r ? +x.r.v2 || 0 : 0;
        return h('button.logbar' + (x.d === t ? '.is-today' : ''), { type: 'button', 'aria-label': A.dLong(x.d) + ': ' + (x.r && x.r.v != null ? logShow(pg, x.r.v) : A.t('nothing logged')), onclick: () => A.logSheet(pg, x.d) },
          h('span.bars', { 'aria-hidden': 'true' }, h('i', { style: { height: (v / top * 100) + '%' } }), o.second ? h('i.second', { style: { height: (v2 / 5 * 100) + '%' } }) : null),
          h('span.logbar-day', { text: A.fmt(x.d, { weekday: 'narrow' }) }), h('span.logbar-n', { text: String(+x.d.slice(8)) }));
      })),
      o.second ? h('ul.legend', null, h('li', null, h('i.swatch.in'), A.t('Mood')), h('li', null, h('i.swatch.out'), A.t('Energy'))) : null));
    const noted = P.recs(pg.id).filter(r => r.note).sort((a, b) => (a.d < b.d ? 1 : -1)).slice(0, 8);
    if (noted.length) root.append(h('section.panel', null, h('div.panel-head', null, h('h2', { text: A.t('Notes') })), h('div.rows', null, noted.map(r =>
      h('button.row.row-btn', { type: 'button', onclick: () => A.logSheet(pg, r.d) }, h('span.row-emoji', { 'aria-hidden': 'true', text: logShow(pg, r.v) || '·' }), h('span.row-main', null, h('span.row-title', { text: r.note }), h('span.row-meta', { text: A.dLong(r.d) })))))));
  };
  A.logSheet = (pg, d) => A.sheet(() => A.dLong(d), (body, api) => {
    const cur = P.logOf(pg.id, d) || {};
    const note = h('input', { type: 'text', value: cur.note || '', maxLength: 200, 'aria-label': A.t('Note') , onchange: e => P.setLog(pg.id, d, { note: e.target.value.trim() }) });
    body.append(A.logControl(pg, d), A.field(A.t('Note'), note), h('div.actions', null,
      cur.id ? A.btn(A.t('Clear this day'), () => { P.remove(pg.id, cur.id); api.close(); }) : null, A.btn(A.t('Done'), api.close, 'primary')));
  }, { live: true });

  /* ================= notes ================= */
  const pickPicture = (max, then) => { const file = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: e => { const f = e.target.files[0]; if (f) A.shrinkImage(f, max, 0.72).then(then, () => A.toast(A.t('That file is not a picture this browser can read.'))); e.target.value = ''; } }); document.body.append(file); file.click(); setTimeout(() => file.remove(), 60000); };
  K.notes = function (root, pg) {
    const o = pg.o || {}, t = A.today(), recs = P.recs(pg.id).slice().sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : 0));
    const draft = (A.ui.draft = A.ui.draft || {}), d = draft[pg.id] || (draft[pg.id] = { body: '', img: '', open: '', p: Math.floor(Math.random() * 97) });
    const prompts = o.prompts || [], prompt = prompts.length ? tr(prompts[d.p % prompts.length]) : '';
    const body = o.short ? h('input', { type: 'text', id: 'note-' + pg.id, value: d.body, maxLength: 300, enterkeyhint: 'done', placeholder: A.t('Write it down…'), 'aria-label': P.name(pg), oninput: e => { d.body = e.target.value; }, onkeydown: e => { if (e.key === 'Enter') { e.preventDefault(); A.refocus = '#note-' + pg.id; save(); } } })
      : h('textarea', { rows: 4, maxLength: 6000, value: d.body, placeholder: prompt || A.t('Write it down…'), 'aria-label': P.name(pg), oninput: e => { d.body = e.target.value; } });
    const open = o.sealed ? A.dateInput(d.open || A.addDays(t, 365), { min: A.addDays(t, 1), onchange: e => { d.open = e.target.value; } }) : null;
    const save = () => {
      const text = d.body.trim();
      if (!text && !d.img) { A.toast(A.t('Write something first.')); return; }
      const rec = { d: t, body: text };
      if (prompt && !o.short) rec.prompt = prompt;
      if (d.img) rec.img = d.img;
      if (o.sealed) rec.open = A.isDate(open.value) && open.value > t ? open.value : A.addDays(t, 365);
      delete draft[pg.id];
      P.add(pg.id, rec);
      A.toast(o.sealed ? A.t('Sealed. It opens on {date}.', { date: A.dShort(rec.open) }) : A.t('Saved.'));
    };
    root.append(h('section.panel', null,
      prompt && !o.short ? h('div.prompt', null, h('p', { text: prompt }), prompts.length > 1 ? h('button.link', { type: 'button', onclick: () => { d.p++; A.render(); } }, A.t('Another prompt')) : null) : null,
      body, d.img ? h('span.note-img', { role: 'img', 'aria-label': A.t('The picture you chose'), style: { backgroundImage: 'url("' + d.img + '")' } }) : null,
      open ? A.field(A.t('Open it on'), open) : null,
      h('div.actions', null,
        o.board ? A.btn(d.img ? A.t('Change picture') : A.t('Add a picture'), () => pickPicture(900, url => { d.img = url; A.render(); })) : null,
        A.btn(o.sealed ? A.t('Seal the letter') : A.t('Save'), save, 'primary'))));
    if (!recs.length) return;
    if (o.board) {
      root.append(h('div.board', null, recs.map(r => h('button.board-card', { type: 'button', onclick: () => A.noteSheet(pg, r) },
        r.img ? h('span.board-img', { 'aria-hidden': 'true', style: { backgroundImage: 'url("' + r.img + '")' } }) : null, r.body ? h('span.board-text', { text: r.body }) : null))));
      return;
    }
    const list = h('div.notes');
    recs.forEach(r => {
      const sealed = o.sealed && r.open > t;
      list.append(h('button.note-card' + (sealed ? '.sealed' : ''), { type: 'button', onclick: () => (sealed ? A.toast(A.t('Still sealed. It opens on {date}.', { date: A.dLong(r.open) })) : A.noteSheet(pg, r)) },
        h('span.note-date', { text: sealed ? A.t('Opens on {date}', { date: A.dLong(r.open) }) : A.dLong(r.d) }),
        sealed ? h('span.note-body', { text: '💌' }) : [r.prompt ? h('span.note-prompt', { text: r.prompt }) : null, h('span.note-body', { text: r.body })]));
    });
    root.append(h('section.panel', null, list));
  };
  A.noteSheet = function (pg, r) {
    const o = pg.o || {};
    if (o.sealed && !r.read) P.save(pg.id, r.id, { read: 1 });
    A.sheet(A.dLong(r.d), (body, api) => {
      const text = h('textarea', { rows: o.short ? 3 : 8, maxLength: 6000, value: r.body || '' });
      body.append(r.prompt ? h('p.sub', { text: r.prompt }) : null,
        r.img ? h('span.note-img.big', { role: 'img', 'aria-label': A.t('Picture'), style: { backgroundImage: 'url("' + r.img + '")' } }) : null,
        text, h('div.actions', null,
          A.btn(A.t('Delete'), () => { const u = P.remove(pg.id, r.id); api.close(); undoToast(A.t('Deleted.'), u && u.undo); }, 'danger'),
          A.btn(A.t('Save'), () => { P.save(pg.id, r.id, { body: text.value.trim() }); api.close(); }, 'primary')));
    });
  };

  /* ================= dates ================= */
  A.dateRow = function (pg, r) {
    const n = P.daysTo(r), occ = P.nextOcc(r), age = P.turns(r), past = n < 0;
    const meta = [A.fmt(occ, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })];
    if (age > 0) meta.push(A.t('turns {n}', { n: age }));
    return h('button.row.row-btn', { type: 'button', onclick: () => A.dateSheet(pg, r) },
      h('span.row-emoji', { 'aria-hidden': 'true', text: r.emoji || pg.emoji }),
      h('span.row-main', null, h('span.row-title', { text: r.t }), h('span.row-meta', { text: meta.join(' · ') })),
      past ? null : n === 0 ? A.pill(A.t('Today'), 'good') : h('span.count', null, h('strong', { text: String(n) }), h('small', { text: A.tn(n, 'day|days') })));
  };
  K.dates = function (root, pg) {
    const recs = P.recs(pg.id), ahead = recs.filter(r => P.daysTo(r) >= 0).sort((a, b) => P.daysTo(a) - P.daysTo(b)), gone = recs.filter(r => P.daysTo(r) < 0);
    if (!recs.length) { root.append(h('section.panel', null, A.empty(tr(pg.blurb), A.t('Add the first one'), () => A.dateSheet(pg)))); return; }
    if (ahead.length) root.append(h('section.panel', null, h('div.rows', null, ahead.map(r => A.dateRow(pg, r)))));
    if (gone.length) root.append(h('section.panel', null, h('details.more-info', null, h('summary', { text: A.tn(gone.length, '{n} already passed|{n} already passed') }), h('div.rows', null, gone.map(r => A.dateRow(pg, r))))));
  };
  A.dateSheet = function (pg, r0) {
    const o = pg.o || {}, isNew = !r0, r = r0 || { t: '', d: '', yearly: !!o.yearly, emoji: pg.emoji, remind: 1 };
    A.sheet(isNew ? A.t('Add to {page}', { page: P.name(pg) }) : r.t, (body, api) => {
      const text = h('input', { type: 'text', value: r.t, maxLength: 80 }), emoji = h('input.emoji-in', { type: 'text', value: r.emoji || '', maxLength: 8, 'aria-label': A.t('Emoji') });
      const date = A.dateInput(r.d || '', { min: '1900-01-01' }), yearly = h('input', { type: 'checkbox', checked: !!r.yearly });
      const remind = A.select([['', A.t('No reminder')], [0, A.t('On the day')], [1, A.t('1 day before')], [3, A.t('3 days before')], [7, A.t('A week before')], [14, A.t('2 weeks before')]], r.remind == null ? '' : r.remind);
      body.append(h('div.form', null, h('div.form-row.emoji-row', null, A.field(A.t('Emoji'), emoji), A.field(A.t('What is it'), text)),
        A.field(A.t('Date'), date), h('label.check', null, yearly, h('span', { text: A.t('Every year') })), A.field(A.t('Remind me'), remind)),
        h('div.actions', null,
          isNew ? null : A.btn(A.t('Delete'), () => { const u = P.remove(pg.id, r.id); api.close(); undoToast(A.t('Deleted.'), u && u.undo); }, 'danger'),
          A.btn(isNew ? A.t('Add') : A.t('Save'), () => {
            const ok = /^\d{4}-\d{2}-\d{2}$/.test(date.value) && date.value >= '1900-01-01' && date.value <= '2100-12-31';
            if (!text.value.trim() || !ok) { A.toast(A.t('Add a name and a date.')); return; }
            const v = { t: text.value.trim(), d: date.value, yearly: yearly.checked, emoji: emoji.value.trim() || pg.emoji, remind: remind.value === '' ? null : +remind.value };
            if (isNew) P.add(pg.id, v); else P.save(pg.id, r.id, v);
            api.close();
          }, 'primary')));
      if (isNew) setTimeout(() => text.focus(), 30);
    });
  };

  /* ================= cards ================= */
  const fieldShow = (f, v) => (v == null || v === '' ? '' : f.type === 'money' ? A.money(+v || 0) : f.type === 'date' ? (A.isDate(v) ? A.dShort(v) : '') : f.type === 'rate' ? '★'.repeat(A.clamp(+v, 0, 5)) + '☆'.repeat(5 - A.clamp(+v, 0, 5)) : f.type === 'long' ? String(v).split('\n')[0] : String(v));
  K.cards = function (root, pg) {
    const o = pg.o || {}, recs = P.recs(pg.id), fields = o.fields || [], status = o.status || null, t = A.today();
    if (!recs.length) { root.append(h('section.panel', null, A.empty(tr(pg.blurb), A.t('Add the first one'), () => A.cardSheet(pg)))); return; }
    const val = (r, k) => (r.f ? r.f[k] : '');
    if (o.sum) {
      const tot = list => A.sum(list, r => +val(r, o.sum) || 0);
      const own = o.minus ? tot(recs.filter(r => !(+r.st || 0))) : tot(recs), owe = o.minus ? tot(recs.filter(r => +r.st === 1)) : 0;
      root.append(h('section.panel', null, h('dl.figures.two', null,
        h('div.strong', null, h('dt', { text: o.minus ? A.t('Net worth') : A.t('Total') }), h('dd', { text: A.money(own - owe) })),
        o.minus ? h('div', null, h('dt', { text: tr(status[0]) }), h('dd', { text: A.money(own) })) : null,
        o.minus ? h('div', null, h('dt', { text: tr(status[1]) }), h('dd', { text: A.money(owe) })) : null)));
    }
    if (o.avg) { const a = P.avg(recs.map(r => val(r, o.avg))); if (a != null) root.append(h('section.panel', null, h('dl.figures.two', null, h('div.strong', null, h('dt', { text: A.t('Average') }), h('dd', { text: a.toFixed(2) }))))); }
    const due = r => { const every = +val(r, 'every') || 0, last = val(r, 'last'); return o.nudge && every > 0 && (!A.isDate(last) || A.diff(last, t) >= every); };
    const row = r => {
      const meta = fields.map(f => (o.nudge && f.k === 'every' ? '' : f.k === 'last' && val(r, 'last') ? A.t('last time {when}', { when: A.inDays(val(r, 'last')) }) : fieldShow(f, val(r, f.k)))).filter(Boolean).slice(0, 3);
      return h('div.row', null,
        h('button.row-main', { type: 'button', onclick: () => A.cardSheet(pg, r) }, h('span.row-title', null, r.t, due(r) ? A.pill(A.t('Time to catch up'), 'warn') : null), meta.length ? h('span.row-meta', { text: meta.join(' · ') }) : null),
        due(r) ? h('button.chip', { type: 'button', onclick: () => { A.commit(() => { (r.f = r.f || {}).last = t; }); A.toast(A.t('Noted. You are up to date with {name}.', { name: r.t })); } }, A.t('Did it today')) : null,
        status && !o.plain && !o.nudge ? h('button.pill.pill-btn', { type: 'button', 'aria-label': A.t('{status}. Tap to change.', { status: tr(status[+r.st || 0]) }), onclick: () => A.commit(() => { r.st = ((+r.st || 0) + 1) % status.length; }) }, tr(status[+r.st || 0])) : null);
    };
    if (status) status.forEach((s, i) => {
      const mine = recs.filter(r => (+r.st || 0) === i);
      if (mine.length) root.append(h('section.panel', null, h('div.panel-head', null, h('h2', { text: tr(s) }), h('p.sub', { text: String(mine.length) })), h('div.rows', null, mine.map(row))));
    });
    else root.append(h('section.panel', null, h('div.rows', null, recs.slice().sort((a, b) => (due(b) ? 1 : 0) - (due(a) ? 1 : 0)).map(row))));
  };
  A.cardSheet = function (pg, r0) {
    const o = pg.o || {}, isNew = !r0, r = r0 || { t: '', st: 0, f: {} }, fields = o.fields || [], status = o.status || null;
    A.sheet(isNew ? A.t('Add to {page}', { page: P.name(pg) }) : r.t, (body, api) => {
      const text = h('input', { type: 'text', value: r.t, maxLength: 120 }), st = status ? A.select(status.map((s, i) => [i, tr(s)]), +r.st || 0) : null;
      const inputs = fields.map(f => {
        const v = r.f && r.f[f.k] != null ? r.f[f.k] : '';
        const el = f.type === 'long' ? h('textarea', { rows: 4, maxLength: 4000, value: String(v) })
          : f.type === 'date' ? A.dateInput(A.isDate(v) ? v : '')
            : f.type === 'rate' ? A.select([['', A.t('No rating')], [1, '★'], [2, '★★'], [3, '★★★'], [4, '★★★★'], [5, '★★★★★']], v)
              : f.type === 'money' || f.type === 'num' ? A.amountInput(v) : h('input', { type: 'text', value: String(v), maxLength: 200 });
        return { f: f, el: el };
      });
      body.append(h('div.form', null, A.field(A.t('Name'), text), st ? A.field(o.plain ? A.t('Day') : A.t('Status'), st) : null, inputs.map(x => A.field(tr(x.f.label), x.el))),
        h('div.actions', null,
          isNew ? null : A.btn(A.t('Delete'), () => { const u = P.remove(pg.id, r.id); api.close(); undoToast(A.t('Deleted.'), u && u.undo); }, 'danger'),
          A.btn(isNew ? A.t('Add') : A.t('Save'), () => {
            if (!text.value.trim()) { A.toast(A.t('Give it a name.')); return; }
            const fv = {};
            inputs.forEach(x => { const raw = x.el.value; fv[x.f.k] = x.f.type === 'money' || x.f.type === 'num' ? (String(raw).trim() === '' ? '' : A.num(raw)) : x.f.type === 'date' ? (A.isDate(raw) ? raw : '') : x.f.type === 'rate' ? (+raw || '') : String(raw).trim(); });
            const v = { t: text.value.trim(), st: st ? +st.value : 0, f: fv };
            if (isNew) P.add(pg.id, v); else P.save(pg.id, r.id, v);
            api.close();
          }, 'primary')));
      if (isNew) setTimeout(() => text.focus(), 30);
    });
  };

  /* what the page's "+" button does */
  A.addTo = function (pg) {
    if (pg.kind === 'list') { const el = document.getElementById('add-' + pg.id); if (el) { el.focus(); return; } A.taskSheet(pg); }
    else if (pg.kind === 'habit') A.habitSheet(pg);
    else if (pg.kind === 'dates') A.dateSheet(pg);
    else if (pg.kind === 'cards') A.cardSheet(pg);
  };
})(window.App);
