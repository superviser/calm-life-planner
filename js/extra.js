/* extra.js: the hub screens, the page frame, Meal plan, Month in review, and the planner's part of Settings */
'use strict';
(function (A) {
  const h = A.h, P = A.P, V = A.views, X = A.special;

  /* ---------- one line that says what is going on inside a page ---------- */
  function summary(pg) {
    if (pg.route || pg.view) return '';
    const recs = P.recs(pg.id), t = A.today();
    if (!recs.length) return '';
    if (pg.kind === 'list') { const n = recs.filter(r => !P.isDone(pg, r)).length; return pg.o && pg.o.menu ? A.tn(recs.length, '{n} idea|{n} ideas') : n ? A.tn(n, '{n} open|{n} open') : A.t('All done'); }
    if (pg.kind === 'habit') return A.t('{n} of {total} on target', { n: recs.filter(r => P.habitWeek(r).met).length, total: recs.length });
    if (pg.kind === 'log') { const r = P.logOf(pg.id, t); return r && r.v != null && r.v !== '' ? A.t('Logged today') : A.t('Not logged today'); }
    if (pg.kind === 'dates') { const next = recs.map(r => P.daysTo(r)).filter(n => n >= 0).sort((a, b) => a - b)[0]; return next == null ? '' : next === 0 ? A.t('One is today') : A.tn(next, 'Next in {n} day|Next in {n} days'); }
    return A.tn(recs.length, '{n} entry|{n} entries');
  }

  /* ---------- all hubs ---------- */
  V.hubs = function (root) {
    root.append(A.pageHead(A.t('Everything'), A.t('Ten hubs. Hide what you do not need in Settings.')));
    root.append(h('div.hub-grid', null, P.hubs().map(hub => {
      const pages = P.pages(hub.id);
      return h('a.hub-tile', { href: '#/hub/' + hub.id, style: { '--so': hub.so } },
        h('span.hub-emoji', { 'aria-hidden': 'true', text: hub.emoji }), h('strong', { text: A.t(hub.name) }),
        h('span.sub', { text: A.t(hub.blurb) }), h('span.hub-count', { text: A.tn(pages.length, '{n} page|{n} pages') }));
    })));
    root.append(h('section.panel', null, h('div.rows', null,
      h('a.row.row-btn.nav-row', { href: '#/settings' }, h('span.row-emoji', null, A.icon('settings')), h('span.row-main', null, h('span.row-title', { text: A.t('Settings') }), h('span.row-meta', { text: A.t('Name, look, language, hubs, reminders, backups') })), A.icon('right')))));
    if (!A.licensed) root.append(A.unlockPanel());
  };
  V.hub = function (root, id) {
    const hub = P.hubs().find(x => x.id === id);
    if (!hub) { A.go('hubs'); return; }
    root.append(A.pageHead(hub.emoji + ' ' + A.t(hub.name), A.t(hub.blurb), A.btn(A.t('New page'), () => A.newPageSheet(hub.id), null, 'plus')));
    const pages = P.pages(hub.id);
    root.append(h('section.panel', null, h('div.rows', null, pages.map(pg => {
      const sum = summary(pg);
      return h('a.row.row-btn.nav-row', { href: P.route(pg) }, h('span.row-emoji', { 'aria-hidden': 'true', text: pg.emoji }),
        h('span.row-main', null, h('span.row-title', { text: P.name(pg) }), pg.blurb ? h('span.row-meta', { text: A.t(pg.blurb) }) : null),
        sum ? h('span.pill', { text: sum }) : null, A.icon('right'));
    }))));
    const hidden = P.pages(hub.id, true).length - pages.length;
    if (hidden) root.append(h('p.quiet', { text: A.tn(hidden, '{n} page of this hub is hidden. Bring it back in Settings.|{n} pages of this hub are hidden. Bring them back in Settings.') }));
  };

  /* ---------- a page ---------- */
  V.p = function (root, id) {
    const pg = P.page(id);
    if (!pg || !P.live(pg) || pg.route) { A.go('home'); return; }
    const hub = P.hub(pg.hub), can = pg.kind && pg.kind !== 'log' && pg.kind !== 'notes';
    root.append(h('a.crumb', { href: '#/hub/' + pg.hub }, A.icon('left'), hub ? A.t(hub.name) : A.t('Everything')));
    root.append(A.pageHead(pg.emoji + ' ' + P.name(pg), pg.blurb ? A.t(pg.blurb) : null, can ? A.btn(A.t('Add'), () => A.addTo(pg), null, 'plus') : null));
    if (pg.view) X[pg.view](root, pg); else A.kinds[pg.kind](root, pg);
    if (pg.custom) root.append(h('button.link.danger', { type: 'button', onclick: () => A.confirm(A.t('Delete the page {name}?', { name: pg.name }), A.t('Everything on it is deleted with it. Built-in pages can be hidden instead.'), A.t('Delete'), () => { P.removePage(pg.id); A.go('hub/' + pg.hub); }, true) }, A.t('Delete this page')));
  };

  /* ---------- make your own page ---------- */
  A.newPageSheet = function (hubId) {
    const st = { kind: 'list', hub: hubId || 'plan', personal: false };
    A.sheet(A.t('Make your own page'), (body, api) => {
      const name = h('input', { type: 'text', maxLength: 40, placeholder: A.t('Plants to water, Films to watch…') }), emoji = h('input.emoji-in', { type: 'text', value: '📄', maxLength: 8, 'aria-label': A.t('Emoji') });
      const hub = A.select(P.hubs(true).map(x => [x.id, x.emoji + ' ' + A.t(x.name)]), st.hub);
      const mine = h('input', { type: 'checkbox', checked: false });
      const kinds = h('div.kinds', { role: 'group', 'aria-label': A.t('What kind of page') }, A.KINDS.map(k => h('button.choice', {
        type: 'button', 'aria-pressed': String(st.kind === k.id),
        onclick: e => { st.kind = k.id; kinds.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget))); }
      }, h('strong', null, h('span', { 'aria-hidden': 'true', text: k.emoji + ' ' }), A.t(k.name)), h('span.field-hint', { text: A.t(k.blurb) }))));
      body.append(h('div.form', null, h('div.form-row.emoji-row', null, A.field(A.t('Emoji'), emoji), A.field(A.t('Name'), name)),
        A.group(A.t('What kind of page'), kinds), A.field(A.t('In which hub'), hub),
        A.shared() ? h('label.check', null, mine, h('span', null, A.t('Private to each person'), h('span.field-hint', { text: A.t('Everyone sees only their own entries on this page.') }))) : null),
        h('div.actions', null, A.btn(A.t('Create the page'), () => {
          if (!name.value.trim()) { A.toast(A.t('Give it a name.')); return; }
          const o = st.kind === 'list' ? { dates: 1, repeat: 1, steps: 1 } : st.kind === 'log' ? { unit: '', max: 9999, step: 1 } : st.kind === 'cards' ? { fields: [{ k: 'note', label: A.t('Note'), type: 'long' }], status: [A.t('To do'), A.t('Doing'), A.t('Done')] } : {};
          const c = P.addPage({ name: name.value, emoji: emoji.value.trim() || '📄', kind: st.kind, hub: hub.value, personal: mine.checked, o: o });
          api.close();
          A.go('p/' + c.id);
        }, 'primary')));
      setTimeout(() => name.focus(), 30);
    });
  };

  /* ---------- Meal plan ---------- */
  X.meals = function (root) {
    const t = A.today(), start = P.weekStart(A.ui.mealWeek || t), end = A.addDays(start, 6);
    const set = v => { A.ui.mealWeek = P.weekStart(v) === P.weekStart(t) ? null : v; A.render(); };
    const recipes = P.recs('recipes');
    root.append(h('div.toolbar', null, h('div.monthnav', null,
      h('button.icon-btn', { type: 'button', 'aria-label': A.t('Previous week'), onclick: () => set(A.addDays(start, -7)) }, A.icon('left')),
      h('strong.monthnav-label', { text: A.fmt(start, { day: 'numeric', month: 'short' }) + ' – ' + A.fmt(end, { day: 'numeric', month: 'short' }) }),
      h('button.icon-btn', { type: 'button', 'aria-label': A.t('Next week'), onclick: () => set(A.addDays(start, 7)) }, A.icon('right')),
      start !== P.weekStart(t) ? h('button.chip', { type: 'button', onclick: () => set(t) }, A.t('This week')) : null)));
    const slot = (d, s) => {
      const m = P.meal(d, s[0]), name = P.mealName(m);
      return h('button.meal' + (name ? '.set' : ''), { type: 'button', 'aria-label': A.t(s[1]) + ', ' + A.dLong(d) + ': ' + (name || A.t('nothing planned')), onclick: () => mealSheet(d, s) },
        h('span.meal-slot', { text: A.t(s[1]) }), h('span.meal-name', { text: name || '+' }));
    };
    const grid = h('div.meals');
    for (let i = 0; i < 7; i++) {
      const d = A.addDays(start, i);
      grid.append(h('div.meal-day' + (d === t ? '.is-today' : ''), null, h('p.meal-date', null, h('strong', { text: A.fmt(d, { weekday: 'long' }) }), h('small', { text: ' ' + A.dShort(d) })), h('div.meal-slots', null, P.SLOTS.map(s => slot(d, s)))));
    }
    root.append(h('section.panel', null, grid));
    root.append(h('section.panel', null, h('div.panel-head', null, h('h2', { text: A.t('Shopping list') })),
      h('p.sub', { text: A.t('Every ingredient of this week’s recipes that is not on your list yet goes onto it.') }),
      h('div.actions.start', null,
        A.btn(A.t('Add this week’s ingredients'), () => { const n = P.shop(start); A.toast(n ? A.tn(n, '{n} thing added to Groceries.|{n} things added to Groceries.') : A.t('Nothing new to add. Meals from your recipes bring their ingredients.'), n ? { action: A.t('Open'), fn: () => A.go('p/groceries') } : null); }, 'primary'),
        A.btn(A.t('Groceries'), () => A.go('p/groceries')), A.btn(recipes.length ? A.t('Recipes') : A.t('Add a recipe'), () => A.go('p/recipes')))));
  };
  function mealSheet(d, s) {
    const cur = P.meal(d, s[0]) || { t: '', rid: '' }, recipes = P.recs('recipes');
    A.sheet(A.t(s[1]) + ' · ' + A.dLong(d), (body, api) => {
      const text = h('input', { type: 'text', value: cur.rid ? '' : cur.t, maxLength: 80, placeholder: A.t('Leftovers, eating out…') });
      const pick = recipes.length ? A.select([['', A.t('Not from a recipe')]].concat(recipes.map(r => [r.id, r.t])), cur.rid || '') : null;
      const save = () => { const rid = pick ? pick.value : ''; P.setMeal(d, s[0], rid ? { rid: rid } : { t: text.value.trim() }); api.close(); };
      body.append(h('form.form', { onsubmit: e => { e.preventDefault(); save(); } }, pick ? A.field(A.t('From your recipes'), pick) : null, A.field(pick ? A.t('Or just write it') : A.t('What is it'), text),
        h('div.actions', null, cur.t || cur.rid ? A.btn(A.t('Clear'), () => { P.setMeal(d, s[0], null); api.close(); }) : null, h('button.btn.primary', { type: 'submit' }, A.t('Save')))));
      if (!pick) setTimeout(() => text.focus(), 30);
    });
  }

  /* ---------- Month in review ---------- */
  X.review = function (root) {
    const t = A.today(), ym = A.ui.pReview || A.ym(t), r = P.review(ym), money = P.hubs().some(x => x.id === 'money') ? A.month(ym) : null;
    root.append(h('div.toolbar', null, A.monthNav(ym, v => { A.ui.pReview = v === A.ym(t) ? null : v; A.render(); })));
    const fig = (label, val) => h('div', null, h('dt', { text: label }), h('dd', { text: val }));
    const one = v => (v == null ? A.t('nothing yet') : v.toFixed(1));
    root.append(h('div.cols', null,
      h('div.col-main', null,
        h('section.panel', null, h('div.panel-head', null, h('h2', { text: A.t('What you did') }), h('p.sub', { text: A.monthName(ym) })),
          h('dl.figures', null, fig(A.t('Things done'), String(r.done)), fig(A.t('Habit ticks'), String(r.habits)), fig(A.t('Entries written'), String(r.notes)), fig(A.t('Time in focus'), P.dur(r.focus)))),
        h('section.panel', null, h('div.panel-head', null, h('h2', { text: A.t('How it felt') })),
          h('dl.figures', null, fig(A.t('Mood, out of 5'), one(r.mood)), fig(A.t('Energy, out of 5'), one(r.energy)), fig(A.t('Sleep, hours a night'), one(r.sleep)), fig(A.t('Movement'), P.dur(r.move))))),
      h('div.col-side', null,
        r.best.length ? h('section.panel', null, h('div.panel-head', null, h('h2', { text: A.t('Habits that held') })),
          h('div.rows', null, r.best.slice(0, 6).map(b => h('div.row', null, h('span.row-emoji', { 'aria-hidden': 'true', text: b.emoji }), h('span.row-main', null, h('span.row-title', { text: b.t })), h('span.row-amt', { text: A.tn(b.n, '{n} day|{n} days') }))))) : null,
        money ? h('a.panel.money-card', { href: '#/review' }, h('span.money-label', { text: A.t('Money left over this month') }), h('strong.money-num', { text: A.money(money.inc - money.out, { whole: true }) }), h('span.sub', { text: A.t('Open the money review') })) : null,
        h('p.quiet', { text: A.t('Only what you logged is counted. An empty month is not a bad month.') }))));
  };

  /* ---------- Settings: your day, Home, hubs and pages ---------- */
  A.plannerPanels = function () {
    const pl = A.state.pl, open = A.ui.open || (A.ui.open = {});
    const time = (box, k) => h('input', { type: 'time', value: box[k], onchange: e => { if (/^\d\d:\d\d$/.test(e.target.value)) A.commit(() => { box[k] = e.target.value; }); } });
    const swap = (list, i, by) => { const j = i + by; if (j < 0 || j >= list.length) return list; const n = list.slice(); n.splice(j, 0, n.splice(i, 1)[0]); return n; };
    const arrows = (list, i, save, name) => [
      h('button.icon-btn', { type: 'button', disabled: i === 0, 'aria-label': A.t('Move {name} up', { name: name }), onclick: () => save(swap(list, i, -1)) }, A.icon('up')),
      h('button.icon-btn', { type: 'button', disabled: i === list.length - 1, 'aria-label': A.t('Move {name} down', { name: name }), onclick: () => save(swap(list, i, 1)) }, A.icon('down'))];
    const eye = (on, name, fn) => h('input', { type: 'checkbox', role: 'switch', checked: on, 'aria-label': A.t('Show {name}', { name: name }), onchange: e => fn(e.target.checked) });

    const day = A.sec('day', A.t('Your day'), A.t('Home counts the time that is left between these two. Reminders stay quiet during quiet hours and arrive when they end.'),
      h('div.form', null, h('div.form-row', null, A.field(A.t('My day starts at'), time(pl.day, 'start')), A.field(A.t('My day ends at'), time(pl.day, 'end')))),
      h('div.toggles', null, A.toggle(A.t('Quiet hours'), A.t('No reminders in this window.'), pl.quiet.on, v => A.commit(() => { pl.quiet.on = v; }))),
      pl.quiet.on ? h('div.form', null, h('div.form-row', null, A.field(A.t('Quiet from'), time(pl.quiet, 'from')), A.field(A.t('Quiet until'), time(pl.quiet, 'to')))) : null);

    const cards = P.homeCards(), allCards = A.HOME_CARDS;
    const order = cards.concat(allCards.map(c => c.id).filter(id => cards.indexOf(id) < 0));
    const home = A.sec('home', A.t('Home'), A.t('Choose what Home shows, and in what order. The time left today always stays on top.'),
      h('div.rows.manage', null, order.map((id, i) => {
        const c = A.by(allCards, id), on = cards.indexOf(id) >= 0, name = A.t(c.name);
        return h('div.row', null, h('span.row-main', null, h('span.row-title', { text: name })),
          on ? arrows(cards, cards.indexOf(id), list => A.commit(() => { pl.home = list; }), name) : null,
          eye(on, name, v => A.commit(() => { pl.home = v ? cards.concat([id]) : cards.filter(x => x !== id); })));
      })));

    const hubs = P.hubs(true), hubIds = hubs.map(x => x.id);
    const hubRows = h('div.manage', null, hubs.map((hub, i) => {
      const name = A.t(hub.name), shown = !pl.hidden['hub:' + hub.id], pages = P.pages(hub.id, true), ids = pages.map(x => x.id), key = 'hub-' + hub.id;
      return h('details.manage-hub', { open: !!open[key], ontoggle: e => { open[key] = e.target.open; } },
        h('summary', null, h('span.row-emoji', { 'aria-hidden': 'true', text: hub.emoji }), h('span.row-main', null, h('span.row-title', { text: name }), h('span.row-meta', { text: shown ? A.tn(pages.filter(P.shown).length, '{n} page shown|{n} pages shown') : A.t('Hidden') })),
          h('span.manage-tools', { onclick: e => e.stopPropagation() }, arrows(hubIds, i, list => A.commit(() => { pl.order.hubs = list; }), name),
            eye(shown, name, v => A.commit(() => { if (v) delete pl.hidden['hub:' + hub.id]; else pl.hidden['hub:' + hub.id] = 1; })))),
        h('div.rows', null, pages.map((pg, j) => {
          const pn = P.name(pg);
          return h('div.row', null, h('span.row-emoji', { 'aria-hidden': 'true', text: pg.emoji }), h('span.row-main', null, h('span.row-title', { text: pn })),
            arrows(ids, j, list => A.commit(() => { pl.order[hub.id] = list; }), pn),
            eye(!pl.hidden[pg.id], pn, v => A.commit(() => { if (v) delete pl.hidden[pg.id]; else pl.hidden[pg.id] = 1; })));
        })));
    }));
    const pagesSec = A.sec('hubs', A.t('Hubs and pages'), A.t('Hide what you do not use and put the rest in your own order. Nothing is deleted: a hidden page keeps everything in it.'),
      hubRows, h('div.actions.start', null, A.btn(A.t('Make your own page'), () => A.newPageSheet(), 'primary', 'plus')));
    return [day, home, pagesSec];
  };
})(window.App);
