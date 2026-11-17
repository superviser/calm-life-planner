/* main.js: app shell, navigation, language, start-up */
'use strict';
(function (A) {
  const h = A.h, P = A.P;
  /* the budget planner's pages all belong to the Money hub */
  const MONEY = ['today', 'budget', 'plan', 'save', 'debt', 'pause', 'review', 'people'];
  const moneyOn = () => P.hubs().some(x => x.id === 'money');

  function demoBar() {
    return h('div.demo-bar', { role: 'region', 'aria-label': A.t('Demo notice') },
      h('p', null, h('strong', { text: A.t('Demo.') + ' ' }), h('span', { text: A.t('Try everything. Nothing is saved.') })),
      h('div.demo-actions', null,
        h('button.chip.demo-own', { type: 'button', onclick: A.demoFresh }, A.t('Start my own planner')),
        h('button.chip.solid', { type: 'button', onclick: () => A.unlockSheet() }, A.icon('unlock'), A.t('Unlock'))));
  }

  /* Phone: Home, Day, the add button, Tasks, Everything. Tablet: a rail of hubs. Computer: hubs with the open hub's pages under it. */
  function shell() {
    const p = A.state.profile, app = A.$('#app');
    const item = (cls, href, id, icon, label, so) => h('a.nav-item' + cls, { href: href, 'data-id': id, style: { '--so': so == null ? 90 : so } },
      /^[a-z]+$/.test(icon) ? A.icon(icon) : h('span.nav-emoji', { 'aria-hidden': 'true', text: icon }), h('span', { text: label }));
    const hubs = P.hubs().map(hub => [
      item('.nav-x.nav-hub', '#/hub/' + hub.id, 'hub-' + hub.id, hub.emoji, A.t(hub.name), hub.so),
      h('div.nav-sub', { 'data-hub': hub.id }, P.pages(hub.id).map(pg => h('a.nav-page', { href: P.route(pg), 'data-page': pg.route || pg.id }, h('span', { 'aria-hidden': 'true', text: pg.emoji + ' ' }), P.name(pg))))]);
    app.replaceChildren();
    if (!A.licensed) app.append(demoBar());
    app.append(h('nav.nav', { 'aria-label': A.t('Sections') },
      h('a.brand', { href: '#/home' }, h('span.brand-icon', { 'aria-hidden': 'true' }), h('span.brand-name', { text: p.appName })),
      h('button.nav-add', { type: 'button', 'aria-label': A.t('Add something'), onclick: () => A.captureSheet() }, A.icon('plus'), h('span', { text: A.t('Add') })),
      item('', '#/home', 'home', 'today', A.t('Home'), 0),
      item('.nav-quick', '#/p/day', 'q-day', 'plan', A.t('Day'), 200),
      item('.nav-quick', '#/p/tasks', 'q-tasks', 'check', A.t('Tasks'), 200),
      hubs,
      item('.nav-x', '#/settings', 'settings', 'settings', A.t('Settings'), 90),
      item('.nav-more', '#/hubs', 'more', 'more', A.t('All'), 90)),
      h('main', { id: 'main', tabindex: '-1' }));
  }

  /* '#/p/tasks' is the view "p" with the argument "tasks" */
  const where = () => {
    const seg = location.hash.replace(/^#\/?/, '').split('/'), id = seg[0] || 'home';
    if (!A.views[id]) return ['home', ''];
    if (id === 'people' && !A.shared()) return ['home', ''];
    return [id, seg[1] || ''];
  };
  /* which hub the screen being shown belongs to */
  const hubOf = (id, arg) => {
    if (id === 'hub') return arg;
    if (id === 'p') { const pg = P.page(arg); return pg ? pg.hub : ''; }
    return MONEY.indexOf(id) >= 0 ? 'money' : '';
  };
  let raf = 0, ready = false, shellSig = '', lastAtt = -1, lastMin = -1;
  A.render = function () {
    cancelAnimationFrame(raf); raf = 0;
    if (!ready || !A.state) return;
    /* the frame around the pages is rebuilt only when what it shows has changed: language, household, demo or full, hubs and pages */
    const sig = [A.shared(), A.i18n.lang, A.licensed, P.hubs().map(x => x.id + ':' + P.pages(x.id).map(pg => pg.id + (pg.custom ? pg.name + pg.emoji : '')).join(',')).join('|')].join('|');
    if (sig !== shellSig || !A.$('#main')) { shellSig = sig; shell(); A.route = null; }
    const main = A.$('#main'), w = where(), id = w[0], arg = w[1], full = id + '/' + arg, changed = full !== A.route + '/' + A.arg;
    const y = window.scrollY, p = A.state.profile, el = document.documentElement, hub = hubOf(id, arg), hubDef = P.hub(hub);
    A.route = id; A.arg = arg;
    el.dataset.section = id;
    el.style.setProperty('--so', hubDef ? hubDef.so : id === 'home' ? 0 : 90);
    A.applyLook();
    const page = h('div.page.page-' + id + (arg ? '.page-' + id + '-' + arg.replace(/[^a-z0-9-]/gi, '') : ''));
    /* the budget planner's pages get a way back to the Money hub */
    if (hub === 'money' && id !== 'hub' && id !== 'p') page.append(h('a.crumb', { href: '#/hub/money' }, A.icon('left'), A.t('Money')));
    A.views[id](page, arg);
    /* the same page drawn again keeps the keyboard where it was */
    if (changed) main.replaceChildren(page); else A.keepFocus(main, () => main.replaceChildren(page));
    const n = moneyOn() ? A.attention().length : 0, quick = id === 'p' && (arg === 'day' || arg === 'tasks') ? 'q-' + arg : '';
    lastAtt = n; lastMin = P.nowMin();
    document.querySelectorAll('.nav-item').forEach(a => {
      const d = a.dataset.id, on = d === id || d === quick || d === 'hub-' + hub || (d === 'more' && id !== 'home' && id !== 'settings' && !quick);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      if (d === 'hub-money') {
        const old = a.querySelector('.badge');
        if (old) old.remove();
        if (n) a.append(h('span.badge', { 'aria-label': A.tn(n, '{n} thing waiting on you|{n} things waiting on you'), text: String(n) }));
      }
    });
    document.querySelectorAll('.nav-sub').forEach(s => { s.classList.toggle('open', s.dataset.hub === hub); });
    document.querySelectorAll('.nav-page').forEach(a => { if (a.dataset.page === (id === 'p' ? arg : id)) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    const bi = A.$('.brand-icon'), bn = A.$('.brand-name');
    if (bi) { bi.textContent = p.iconImg ? '' : p.icon; bi.style.backgroundImage = p.iconImg ? 'url("' + p.iconImg + '")' : ''; }
    if (bn) bn.textContent = p.appName;
    window.scrollTo(0, changed ? 0 : y);
    if (A.refocus) { const f = A.$(A.refocus); A.refocus = null; if (f) f.focus({ preventScroll: true }); }
  };
  const paint = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(A.render); };

  /* ---------- language: follows the person using the device ---------- */
  let langBusy = false, langFailed = '';
  A.syncLang = function () {
    if (!A.state || langBusy) return;
    const want = A.pickLang(A.look().lang);
    if (want === A.i18n.lang || want === langFailed) return;
    langBusy = true;
    A.loadLang(want).then(ok => {
      langBusy = false;
      if (!ok) { langFailed = want; A.toast(A.t('That language could not be loaded. Check your connection and try again.'), { ms: 6000 }); return; }
      langFailed = '';
      A.cache = {};
      /* the demo budget is written out again in the new language; a real budget is never touched */
      if (!A.licensed && A.state.meta.sample) { A.state = A.resample(); A.cache = {}; A.emit('mode'); }
      else A.emit('lang');
      A.syncLang();
    });
  };

  A.on(what => {
    if (what === 'saved' || what === 'quiet') return;
    if (what === 'saveerror') { A.toast(A.t('This device would not save just now. Keep the app open: it keeps trying.'), { ms: 9000 }); return; }
    if (what === 'saveok') { A.toast(A.t('Saved. Everything is safe again.')); return; }
    if (what === 'cloud') { if (A.route === 'settings' && !document.querySelector('dialog[open]')) paint(); return; }
    /* the budget itself was swapped for another one: anything still open would be editing the old one */
    if (what === 'mode' || what === 'swap') { A.closeSheets(); A.ui.fill = null; }
    if (what !== 'lang') A.syncLang();
    paint();
    A.rem.tick();
  });

  const wait = ms => new Promise(r => setTimeout(r, ms));
  const notice = (lines, button) => A.$('#app').replaceChildren(h('div.boot', null, lines.map(t => h('p', { text: t })),
    button ? h('p', null, h('button.btn.primary', { type: 'button', onclick: () => location.reload() }, button)) : null));

  async function boot() {
    try { await A.store.ready(); }
    catch (e) {
      /* Never guess when saved data cannot be reached: opening an empty budget over it would be worse than waiting. */
      await A.loadLang(A.pickLang('auto'));
      notice([A.t('Your saved planner is busy in another tab or window of this app.'), A.t('Close the other one, then reload. Nothing has been lost.')], A.t('Reload'));
      return;
    }
    const unreadable = async () => {
      await A.loadLang(A.pickLang('auto'));
      notice([A.t('Your saved planner could not be read just now.'), A.t('Nothing has been changed. Close other tabs of this app, then reload.')], A.t('Reload'));
    };
    const link = A.readLink();
    if (link && link.move) await A.openMove(link);
    let lic = null, saved, cloud = null, me = null;
    try { lic = await A.store.get('licence'); } catch (e) { await unreadable(); return; }
    A.licensed = !!A.cfg.offlineUnlocked || !!(lic && A.codeOk(lic.code));
    /* Arriving through the link from the purchase, or from another device: unlock without typing anything. */
    if (link && !A.licensed && A.codeOk(link.code)) {
      try { await A.store.set('licence', { code: A.normCode(link.code), at: Date.now() }); A.licensed = true; link.unlocked = true; }
      catch (e) { /* stays in the demo; the link is explained below */ }
    }
    if (A.licensed) {
      try { saved = await A.store.get('state'); cloud = await A.store.get('cloud'); me = await A.store.get('me'); }
      catch (e) { await unreadable(); return; }
    }
    A.keepStorage();
    await A.backupLoad(lic && lic.at);
    const known = A.validState(saved);
    /* ?lang=de opens a demo or a new budget in that language; a saved budget keeps the language its owner chose */
    const force = (/[?&]lang=([a-z]{2})\b/.exec(location.search) || [])[1];
    A.meId = me || null;
    if (known) {
      A.state = A.migrate(saved);
      await A.loadLang(A.pickLang(A.look().lang));
    } else {
      await A.loadLang(A.pickLang(force || 'auto'));
      A.state = A.licensed ? A.blank() : A.sample();
      if (force && A.i18n.lang === force) A.state.profile.lang = force;
    }
    A.cache = {};
    A.cloud.cfg = cloud || null;
    /* Unlocked and connected to a cloud, yet nothing saved here: the budget is brought back from the cloud, never replaced by an empty one. */
    const lost = A.licensed && !known && !!A.cloud.cfg;
    let settled = !A.cloud.cfg;
    if (A.cloud.cfg) {
      if (lost) A.cloud.cfg.syncedAt = 0;
      const pulled = (lost ? A.cloud.restore() : A.cloud.pull()).then(() => { settled = true; A.cloud.queue(); }, () => { settled = true; });
      await Promise.race([pulled, wait(2500)]);
      /* things that log themselves wait for the cloud's answer, so they are not logged on top of an older copy */
      if (!settled) pulled.then(() => { A.autopost(); });
    }
    A.checkin();
    if (A.licensed) A.touch();
    if (settled) A.autopost();
    let lostNote = false;
    if (lost && !A.state.meta.onboarded) { A.state.meta.onboarded = true; A.touch(); lostNote = true; }
    ready = true;
    A.render();
    window.addEventListener('hashchange', () => {
      /* a one-tap link opened while the app is already showing: start again so it is handled like any other arrival */
      if (/^#(unlock|join|move)=/.test(location.hash)) location.reload(); else A.render();
    });
    if (lostNote) A.toast(A.t('Your planner is kept in your personal cloud, which could not be reached just now. It comes back by itself once this device is online.'), { ms: 12000 });
    if (A.licensed && !A.state.meta.onboarded && !(link && (link.join || link.state))) A.onboard();
    if (link) A.afterLink(link, known);

    let day = A.today();
    const tick = () => {
      if (A.today() !== day) {
        /* a new day: nothing stays pointed at yesterday */
        day = A.today(); A.cache = {};
        A.ui.day = A.ui.ym = A.ui.calYm = A.ui.reviewYm = A.ui.peopleYm = A.ui.fill = A.ui.planDay = A.ui.planWeek = A.ui.planYm = A.ui.mealWeek = A.ui.pReview = null;
        A.checkin(); A.touch(); A.autopost(); A.render();
      } else if (!document.querySelector('dialog[open]')) {
        /* a pause that has just run out; and, on Home and on the day plan, the time that is left: but never while something is being typed */
        const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '');
        const clock = (A.route === 'home' || (A.route === 'p' && A.arg === 'day')) && P.nowMin() !== lastMin && !typing;
        if ((moneyOn() ? A.attention().length : 0) !== lastAtt || clock) A.render();
      }
      A.rem.tick();
    };
    setInterval(tick, 60000);
    A.rem.tick();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') { A.flush(); if (A.cloud.cfg) A.cloud.push(); }
      else { tick(); if (A.cloud.cfg) A.cloud.sync(); }
    });

    /* add ?nosw to the address while developing, so edits show up without the offline cache in the way */
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !/[?&]nosw\b/.test(location.search)) {
      let had = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.register('sw.js').catch(() => { /* the app still works without offline support */ });
      A.update.start();
      /* whatever this visit has already loaded (the language, a font, a picture) is handed over to be kept for offline use */
      const keep = () => navigator.serviceWorker.ready.then(reg => {
        const urls = performance.getEntriesByType('resource').map(r => r.name).filter(u => u.indexOf(location.origin) === 0);
        if (A.i18n.lang !== 'en') urls.push(new URL('i18n/' + A.i18n.lang + '.json', location.href).href);
        if (reg.active) reg.active.postMessage({ type: 'keep', urls: Array.from(new Set(urls)) });
      }).catch(() => null);
      keep();
      A.on(what => { if (what === 'lang') keep(); });
      navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.type === 'open') A.go('home'); });
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        /* the worker has just taken charge: hand over what was loaded before it did, and once more for what was still on its way */
        keep(); setTimeout(keep, 4000);
        if (had) A.toast(A.t('A newer version of the app is ready.'), { action: A.t('Reload'), fn: () => location.reload(), ms: 20000 });
        had = true;
      });
    }
  }
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); A.installEvt = e; if (A.route === 'settings') A.render(); });

  boot().catch(err => {
    console.error(err);
    const app = document.getElementById('app');
    if (app) app.replaceChildren(h('p.boot', { text: A.t('Something went wrong while opening. Reload the page; your saved planner is not affected.') }));
  });
})(window.App);
