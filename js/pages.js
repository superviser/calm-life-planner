/* pages.js: the hubs and their pages, as data.
   A page is either one of six building blocks (kind: list, habit, log, notes, dates, cards) with a few options,
   a special screen (view), or one of the budget planner's pages (route). Names are marked for translation with A.T
   and translated when shown. */
'use strict';
(function (A) {
  const T = A.T;
  A.HUBS = [
    { id: 'plan', name: T('Plan'), emoji: '🗓️', so: 200, blurb: T('Today, this week and everything on your mind') },
    { id: 'money', name: T('Money'), emoji: '💰', so: 55, blurb: T('What is safe to spend, bills, savings and debt') },
    { id: 'well', name: T('Wellness'), emoji: '🌿', so: 120, blurb: T('Habits, meals, sleep and medication') },
    { id: 'mind', name: T('Mind'), emoji: '🧠', so: 300, blurb: T('Mood, journal and the things that help') },
    { id: 'goals', name: T('Goals'), emoji: '🎯', so: 30, blurb: T('Where you are heading, in small steps') },
    { id: 'people', name: T('People'), emoji: '💛', so: 340, blurb: T('Birthdays, catching up and gift ideas') },
    { id: 'house', name: T('Household'), emoji: '🏡', so: 90, blurb: T('Cleaning, chores and where things are') },
    { id: 'learn', name: T('Learn'), emoji: '📚', so: 250, blurb: T('Books, courses, classes and ideas') },
    { id: 'explore', name: T('Explore'), emoji: '✈️', so: 180, blurb: T('Trips, packing lists and memories') },
    { id: 'career', name: T('Career'), emoji: '💼', so: 220, blurb: T('Side projects, income and contacts') }
  ];

  /* fields of a "cards" page: key, label, type (text, long, num, money, date, rate, sel, check) */
  const f = (k, label, type, more) => Object.assign({ k: k, label: label, type: type || 'text' }, more);
  const DAYS = [T('Monday'), T('Tuesday'), T('Wednesday'), T('Thursday'), T('Friday'), T('Saturday'), T('Sunday')];
  const p = (id, hub, name, emoji, def) => Object.assign({ id: id, hub: hub, name: name, emoji: emoji }, def);

  A.PAGES = [
    /* ---------- Plan ---------- */
    p('day', 'plan', T('Day'), '☀️', { view: 'day', blurb: T('Today in time blocks. Fill it in one tap.') }),
    p('week', 'plan', T('Week'), '📆', { view: 'week', blurb: T('Seven days side by side') }),
    p('month', 'plan', T('Month'), '🗓️', { view: 'month', blurb: T('Tasks, dates and bills on one calendar') }),
    p('tasks', 'plan', T('Tasks'), '✅', { kind: 'list', personal: 1, o: { dates: 1, repeat: 1, steps: 1, star: 1 }, blurb: T('Everything you have to do, repeating things included') }),
    p('inbox', 'plan', T('Brain dump'), '🧺', { kind: 'list', personal: 1, o: { inbox: 1 }, blurb: T('Capture now, sort later') }),
    p('projects', 'plan', T('Projects'), '🧩', { kind: 'list', personal: 1, o: { steps: 1, dates: 1, big: 1 }, blurb: T('Bigger things, one step at a time') }),
    p('focus', 'plan', T('Focus timer'), '⏳', { view: 'focus', blurb: T('A timer you can see, with calm background sound') }),
    p('countdowns', 'plan', T('Countdowns'), '🎉', { kind: 'dates', personal: 1, blurb: T('Days until the things you are waiting for') }),
    p('reset', 'plan', T('Weekly reset'), '🔄', { kind: 'list', personal: 1, o: { reset: 'week' }, blurb: T('A short checklist that starts fresh every week') }),

    /* ---------- Money: the budget planner ---------- */
    p('m-today', 'money', T('Money today'), '💵', { route: 'today', blurb: T('Safe to spend, with bills already set aside') }),
    p('m-budget', 'money', T('Envelopes'), '✉️', { route: 'budget', blurb: T('A budget for every kind of spending') }),
    p('m-bills', 'money', T('Bills and paydays'), '🧾', { route: 'plan', blurb: T('Everything that repeats, in the day it is due') }),
    p('m-save', 'money', T('Savings'), '🏺', { route: 'save', blurb: T('Funds and goals') }),
    p('m-debt', 'money', T('Debt'), '📉', { route: 'debt', blurb: T('Payoff order and the date it ends') }),
    p('m-pause', 'money', T('Pause list'), '⏸️', { route: 'pause', blurb: T('Wait before you buy') }),
    p('m-review', 'money', T('Money review'), '📊', { route: 'review', blurb: T('Where the money went') }),
    p('m-people', 'money', T('Who spent what'), '👛', { route: 'people', when: 'shared', blurb: T('Each person, month by month') }),
    p('networth', 'money', T('Net worth'), '⚖️', { kind: 'cards', o: { status: [T('I own'), T('I owe')], fields: [f('amt', T('Amount'), 'money'), f('note', T('Note'))], sum: 'amt', minus: 1 }, blurb: T('What you own minus what you owe') }),
    p('nospend', 'money', T('No-spend days'), '🌱', { kind: 'log', personal: 1, o: { yes: 1 }, blurb: T('Mark a day when you bought nothing extra') }),

    /* ---------- Wellness ---------- */
    p('habits', 'well', T('Habits'), '🌱', { kind: 'habit', personal: 1, blurb: T('Weekly targets. Nothing to break.') }),
    p('routines', 'well', T('Routines'), '🌅', { kind: 'list', personal: 1, o: { reset: 'day', sections: [T('Morning'), T('Evening')] }, blurb: T('Morning and evening, step by step') }),
    p('meals', 'well', T('Meal plan'), '🍽️', { view: 'meals', blurb: T('The week on a plate, and a shopping list from it') }),
    p('recipes', 'well', T('Recipes'), '📖', { kind: 'cards', o: { fields: [f('ing', T('Ingredients, one per line'), 'long'), f('how', T('How to make it'), 'long'), f('min', T('Minutes'), 'num')], status: [T('To try'), T('Favourites')] }, blurb: T('What you like to cook') }),
    p('groceries', 'well', T('Groceries'), '🛒', { kind: 'list', o: { shop: 1 }, blurb: T('The shopping list. Tick it off in the shop.') }),
    p('sleep', 'well', T('Sleep'), '😴', { kind: 'log', personal: 1, o: { unit: 'h', max: 14, step: 0.5, good: 8 }, blurb: T('Hours slept, night by night') }),
    p('meds', 'well', T('Medication'), '💊', { kind: 'habit', personal: 1, o: { stock: 1 }, blurb: T('Taken or not, and when to refill') }),
    p('move', 'well', T('Movement'), '🚶', { kind: 'log', personal: 1, o: { unit: 'min', max: 240, step: 5, good: 30 }, blurb: T('Minutes of moving, any kind') }),
    p('pets', 'well', T('Pet care'), '🐾', { kind: 'list', o: { dates: 1, repeat: 1 }, blurb: T('Feeding, walks, vet and treatments') }),

    /* ---------- Mind ---------- */
    p('mood', 'mind', T('Mood and energy'), '🌤️', { kind: 'log', personal: 1, o: { scale: 5, second: 1 }, blurb: T('One tap a day. Patterns show up by themselves.') }),
    p('journal', 'mind', T('Journal'), '📓', { kind: 'notes', personal: 1, o: { prompts: [T('What is taking up the most room in your head today?'), T('What went better than expected?'), T('What would make tomorrow a little easier?'), T('What are you avoiding, and what is the smallest first step?'), T('What did you do today that future you will thank you for?')] }, blurb: T('A few lines, with a prompt if you want one') }),
    p('gratitude', 'mind', T('Gratitude jar'), '🫙', { kind: 'notes', personal: 1, o: { short: 1 }, blurb: T('One good thing at a time') }),
    p('therapy', 'mind', T('Therapy notes'), '🪑', { kind: 'notes', personal: 1, o: { prompts: [T('What I want to bring up next time'), T('What I took away from the last session')] }, blurb: T('What to bring up, and what you took away') }),
    p('coping', 'mind', T('Coping toolbox'), '🧰', { kind: 'list', personal: 1, o: { menu: 1, sections: [T('When I am overwhelmed'), T('When I am low'), T('When I cannot start')] }, blurb: T('What helps, ready before you need it') }),
    p('dopamine', 'mind', T('Dopamine menu'), '🍭', { kind: 'list', personal: 1, o: { menu: 1, sections: [T('Quick, 5 minutes'), T('Longer, an hour'), T('Treats')] }, blurb: T('Good things to pick from when you need a lift') }),

    /* ---------- Goals ---------- */
    p('goals', 'goals', T('Goals'), '🎯', { kind: 'list', personal: 1, o: { steps: 1, dates: 1, big: 1 }, blurb: T('Each goal broken into steps you can tick') }),
    p('vision', 'goals', T('Vision board'), '🖼️', { kind: 'notes', personal: 1, o: { board: 1 }, blurb: T('Pictures and words for the life you want') }),
    p('yearmap', 'goals', T('Year map'), '🧭', { kind: 'list', personal: 1, o: { sections: [T('January to March'), T('April to June'), T('July to September'), T('October to December')] }, blurb: T('Four quarters, a few milestones each') }),
    p('affirm', 'goals', T('Affirmations'), '✨', { kind: 'notes', personal: 1, o: { short: 1, daily: 1 }, blurb: T('Words you want to hear. One shows on Home each day.') }),
    p('letters', 'goals', T('Letters to future me'), '💌', { kind: 'notes', personal: 1, o: { sealed: 1 }, blurb: T('Write now, open on the date you choose') }),
    p('review', 'goals', T('Month in review'), '🔎', { view: 'review', blurb: T('What you did, without having to remember') }),

    /* ---------- People ---------- */
    p('circle', 'people', T('Inner circle'), '🫶', { kind: 'cards', personal: 1, o: { fields: [f('every', T('Catch up every (days)'), 'num'), f('last', T('Last time'), 'date'), f('note', T('Things to remember'), 'long')], nudge: 1 }, blurb: T('A nudge when it has been a while') }),
    p('birthdays', 'people', T('Birthdays and dates'), '🎂', { kind: 'dates', o: { yearly: 1 }, blurb: T('Never the day after again') }),
    p('gifts', 'people', T('Gift ideas'), '🎁', { kind: 'cards', o: { fields: [f('who', T('For')), f('amt', T('Price'), 'money'), f('where', T('Where to get it'))], status: [T('Idea'), T('Bought'), T('Given')] }, blurb: T('Write it down when you think of it') }),
    p('events', 'people', T('Events and hosting'), '🥂', { kind: 'list', o: { steps: 1, dates: 1, big: 1 }, blurb: T('What has to happen before people arrive') }),

    /* ---------- Household ---------- */
    p('cleaning', 'house', T('Cleaning'), '🧽', { kind: 'list', o: { dates: 1, repeat: 1, who: 1 }, blurb: T('Jobs that come back by themselves') }),
    p('chores', 'house', T('Chore chart'), '🧹', { kind: 'list', o: { dates: 1, repeat: 1, who: 1, byWho: 1 }, when: 'shared', blurb: T('Who does what, this week') }),
    p('declutter', 'house', T('Declutter zones'), '📦', { kind: 'list', o: { sections: [T('Kitchen'), T('Bedroom'), T('Bathroom'), T('Living room'), T('Storage')] }, blurb: T('One small zone at a time') }),
    p('inventory', 'house', T('Home inventory'), '🗄️', { kind: 'cards', o: { fields: [f('where', T('Where it is')), f('amt', T('Value'), 'money'), f('until', T('Warranty until'), 'date'), f('note', T('Note'))] }, blurb: T('Where things are, and what they are worth') }),
    p('emergency', 'house', T('Emergency info'), '🆘', { kind: 'cards', o: { fields: [f('phone', T('Phone')), f('note', T('Details'), 'long')] }, blurb: T('Numbers and details in one place') }),

    /* ---------- Learn ---------- */
    p('books', 'learn', T('Bookshelf'), '📚', { kind: 'cards', personal: 1, o: { fields: [f('by', T('Author')), f('rate', T('Rating'), 'rate'), f('note', T('Notes'), 'long')], status: [T('To read'), T('Reading'), T('Finished')] }, blurb: T('What you want to read, and what you thought') }),
    p('courses', 'learn', T('Courses'), '🎓', { kind: 'list', personal: 1, o: { steps: 1, dates: 1, big: 1 }, blurb: T('Lessons to tick off') }),
    p('ideas', 'learn', T('Ideas vault'), '💡', { kind: 'notes', personal: 1, o: { short: 1 }, blurb: T('Somewhere safe for ideas') }),
    p('skills', 'learn', T('Skill roadmaps'), '🪜', { kind: 'list', personal: 1, o: { steps: 1, big: 1 }, blurb: T('From beginner to good, step by step') }),
    p('timetable', 'learn', T('Class timetable'), '🏫', { kind: 'cards', personal: 1, o: { fields: [f('time', T('Time')), f('where', T('Room'))], status: DAYS, plain: 1 }, blurb: T('Which class, when and where') }),
    p('exams', 'learn', T('Assignments and exams'), '📝', { kind: 'list', personal: 1, o: { dates: 1, steps: 1, star: 1 }, blurb: T('Deadlines you can see coming') }),
    p('grades', 'learn', T('Grades'), '🅰️', { kind: 'cards', personal: 1, o: { fields: [f('grade', T('Grade'), 'num'), f('note', T('Note'))], avg: 'grade' }, blurb: T('Results, and the average') }),

    /* ---------- Explore ---------- */
    p('places', 'explore', T('Places'), '🌍', { kind: 'cards', personal: 1, o: { fields: [f('when', T('When')), f('note', T('Notes'), 'long')], status: [T('Want to go'), T('Been there')] }, blurb: T('Where you have been and where you want to go') }),
    p('trips', 'explore', T('Trips'), '🧳', { kind: 'list', o: { steps: 1, dates: 1, big: 1 }, blurb: T('Bookings and plans for each trip') }),
    p('packing', 'explore', T('Packing lists'), '🎒', { kind: 'list', o: { reset: 'manual', sections: [T('Clothes'), T('Wash bag'), T('Tech'), T('Papers')] }, blurb: T('Tick as you pack, untick for the next trip') }),
    p('bucket', 'explore', T('Bucket list'), '🪂', { kind: 'list', personal: 1, blurb: T('Things to do one day') }),
    p('memories', 'explore', T('Memories'), '📷', { kind: 'notes', personal: 1, o: { board: 1 }, blurb: T('A picture and a few words') }),

    /* ---------- Career ---------- */
    p('side', 'career', T('Side projects'), '🚀', { kind: 'list', personal: 1, o: { steps: 1, dates: 1, big: 1 }, blurb: T('What you are building on the side') }),
    p('income', 'career', T('Income streams'), '💸', { kind: 'cards', personal: 1, o: { fields: [f('amt', T('A month'), 'money'), f('note', T('Note'))], sum: 'amt' }, blurb: T('Where money comes from, and how much') }),
    p('cv', 'career', T('CV notes'), '🪪', { kind: 'notes', personal: 1, blurb: T('Wins and facts to remember for your CV') }),
    p('network', 'career', T('Networking'), '🤝', { kind: 'cards', personal: 1, o: { fields: [f('role', T('Who they are')), f('every', T('Follow up every (days)'), 'num'), f('last', T('Last time'), 'date'), f('note', T('Notes'), 'long')], nudge: 1 }, blurb: T('Who to follow up with, and when') })
  ];

  /* the building blocks a buyer can make their own page from */
  A.KINDS = [
    { id: 'list', name: T('Checklist'), emoji: '✅', blurb: T('Things to tick off, with dates if you like') },
    { id: 'habit', name: T('Habit tracker'), emoji: '🌱', blurb: T('Things to do a few times a week') },
    { id: 'log', name: T('Daily log'), emoji: '📈', blurb: T('One number or rating a day') },
    { id: 'notes', name: T('Notes'), emoji: '📝', blurb: T('Dated entries with a title and text') },
    { id: 'dates', name: T('Dates'), emoji: '🎉', blurb: T('Days to remember or count down to') },
    { id: 'cards', name: T('Collection'), emoji: '🗂️', blurb: T('Cards with a name, a note and a status') }
  ];
  /* what Home can show; the buyer picks and orders them */
  A.HOME_CARDS = [
    { id: 'top', name: T('Top three') }, { id: 'capture', name: T('Quick capture') }, { id: 'today', name: T('Today’s ticks') },
    { id: 'mood', name: T('Mood check-in') }, { id: 'money', name: T('Safe to spend') }, { id: 'nudges', name: T('Gentle nudges') },
    { id: 'words', name: T('Words for today') }
  ];
})(window.App);
