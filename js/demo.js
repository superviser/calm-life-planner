/* demo.js: the demo household's planner. Every date is relative to today, and every text is written in the language
   being shown, so the demo never goes stale and never looks foreign. Sam's pages are full; Alex and Mia have a few
   things of their own, so switching "who am I" in the demo shows that each person has their own planner. */
'use strict';
(function (A) {
  const P = A.P;
  P.demo = function (s) {
    const pl = P.blank(), t = A.today(), d = n => A.addDays(t, n), SAM = 'p-sam', ALEX = 'p-alex', MIA = 'p-mia';
    const put = (pid, list, who) => { pl.rec[pid] = (pl.rec[pid] || []).concat(list.map(x => Object.assign({ id: A.uid() }, who ? { who: who } : {}, x))); return pl.rec[pid]; };
    const steps = (list, doneN) => list.map((s, i) => ({ t: s, done: i < doneN }));
    const ticks = (pattern, weeks) => { const days = {}; for (let i = 0; i < weeks * 7; i++) if (pattern[(A.date(d(-i)).getDay() + 6) % 7] && (i || pattern[7] !== 0)) days[d(-i)] = 1; return days; };

    /* ---------- Plan ---------- */
    const tasks = put('tasks', [
      { t: A.t('Reply to the landlord about the boiler'), due: t, must: true },
      { t: A.t('Finish the quarterly report'), due: t, time: '10:00', min: 90, steps: steps([A.t('Open the file and read the last page'), A.t('Fill in the three missing numbers'), A.t('Write the summary paragraph'), A.t('Send it to Dana')], 1) },
      { t: A.t('Lunch away from the desk'), due: t, time: '13:00', min: 45 },
      { t: A.t('Call the dentist'), due: t },
      { t: A.t('20-minute walk'), due: t, time: '17:30', min: 20 },
      { t: A.t('Book the car service'), due: d(-2) },
      { t: A.t('Return the parcel'), due: d(-1) },
      { t: A.t('Water the plants'), due: d(1), rep: 'days', every: 3 },
      { t: A.t('Send the birthday card'), due: d(2) },
      { t: A.t('Team meeting'), due: d(1), time: '09:30', min: 60 },
      { t: A.t('Renew the library books'), due: d(4) },
      { t: A.t('Take the bins out'), due: d(3), rep: 'weekly' },
      { t: A.t('Sort the holiday photos') },
      { t: A.t('Pay the phone bill'), done: true, at: t },
      { t: A.t('Order printer ink'), done: true, at: d(-1) }
    ], SAM);
    pl.top[SAM] = {}; pl.top[SAM][t] = [tasks[0], tasks[1], tasks[4]].map(r => 'tasks:' + r.id);
    put('tasks', [{ t: A.t('Pick up the dry cleaning'), due: t }, { t: A.t('Plan Saturday’s hike'), due: d(2) }], ALEX);
    put('tasks', [{ t: A.t('Finish the maths worksheet'), due: t, must: true }, { t: A.t('Pack the swimming bag'), due: d(1) }], MIA);
    put('inbox', [{ t: A.t('Idea: a shelf above the desk') }, { t: A.t('Ask about the gym’s morning classes') }, { t: A.t('Look up that podcast about sleep') }, { t: A.t('The car makes a noise when it is cold') }, { t: A.t('Gift for Dad: the map book?') }], SAM);
    put('projects', [
      { t: A.t('Repaint the bedroom'), due: d(20), steps: steps([A.t('Choose the colour'), A.t('Buy paint and tape'), A.t('Move the furniture'), A.t('Paint the first coat'), A.t('Paint the second coat')], 2) },
      { t: A.t('Sort out the paperwork'), steps: steps([A.t('Put everything in one box'), A.t('Throw away what is out of date'), A.t('Label three folders')], 1) }
    ], SAM);
    put('countdowns', [{ t: A.t('Trip to Portugal'), d: d(47), emoji: '✈️', remind: 7 }, { t: A.t('Concert'), d: d(12), emoji: '🎶', remind: 1 }, { t: A.t('Last day of school'), d: d(96), emoji: '🎒', remind: null }], SAM);
    put('reset', [{ t: A.t('Empty the brain dump') }, { t: A.t('Look at next week’s calendar') }, { t: A.t('Pick three things for Monday') }, { t: A.t('Check which bills are due') }, { t: A.t('Tidy the desk for five minutes'), at: t, done: true }], SAM);

    /* ---------- Money extras ---------- */
    put('networth', [{ t: A.t('Savings account'), st: 0, f: { amt: 2150 } }, { t: A.t('The car'), st: 0, f: { amt: 6500 } }, { t: A.t('Credit card'), st: 1, f: { amt: 3950 } }, { t: A.t('Car loan'), st: 1, f: { amt: 14350 } }]);
    put('nospend', [1, 2, 4, 6, 9, 10, 13].map(n => ({ d: d(-n), v: 1 })), SAM);

    /* ---------- Wellness ---------- */
    put('habits', [
      { t: A.t('Drink water before coffee'), emoji: '💧', per: 5, days: ticks([1, 1, 1, 0, 1, 1, 1], 4) },
      { t: A.t('Move for 20 minutes'), emoji: '🚶', per: 3, days: ticks([1, 0, 1, 0, 1, 0, 0], 4) },
      { t: A.t('Read a few pages'), emoji: '📖', per: 4, days: ticks([1, 1, 0, 1, 0, 0, 1], 4) },
      { t: A.t('Phone out of the bedroom'), emoji: '📵', per: 3, days: ticks([0, 1, 1, 0, 1, 0, 0], 4) },
      { t: A.t('Stretch'), emoji: '🧘', per: 2, days: ticks([0, 0, 1, 0, 0, 1, 0], 4) }
    ], SAM);
    put('habits', [{ t: A.t('Practise the guitar'), emoji: '🎸', per: 3, days: ticks([1, 0, 0, 1, 0, 0, 0], 3) }], ALEX);
    put('routines', [
      { t: A.t('Open the curtains'), sec: 0, at: t, done: true }, { t: A.t('Glass of water and medication'), sec: 0, at: t, done: true }, { t: A.t('Get dressed, even at home'), sec: 0 }, { t: A.t('Look at today’s top three'), sec: 0 },
      { t: A.t('Lay out tomorrow’s clothes'), sec: 1 }, { t: A.t('Phone on the charger, outside the bedroom'), sec: 1 }, { t: A.t('Lights out by eleven'), sec: 1 }
    ], SAM);
    const recipes = put('recipes', [
      { t: A.t('Tomato pasta'), st: 1, f: { ing: [A.t('Pasta'), A.t('Tinned tomatoes'), A.t('Garlic'), A.t('Olive oil'), A.t('Parmesan')].join('\n'), how: A.t('Boil the pasta. Warm the garlic in oil, add the tomatoes, simmer ten minutes. Mix.'), min: 20 } },
      { t: A.t('Sheet-pan chicken and vegetables'), st: 1, f: { ing: [A.t('Chicken thighs'), A.t('Potatoes'), A.t('Carrots'), A.t('Onion'), A.t('Olive oil')].join('\n'), how: A.t('Everything on one tray, oil and salt, 40 minutes in a hot oven.'), min: 50 } },
      { t: A.t('Lentil soup'), st: 0, f: { ing: [A.t('Red lentils'), A.t('Onion'), A.t('Carrots'), A.t('Stock cube'), A.t('Lemon')].join('\n'), how: A.t('Soften the onion and carrot, add lentils and stock, simmer 25 minutes, squeeze of lemon.'), min: 35 } },
      { t: A.t('Omelette'), st: 1, f: { ing: [A.t('Eggs'), A.t('Cheese'), A.t('Butter')].join('\n'), how: A.t('Three eggs, a hot pan, cheese in the middle, fold.'), min: 10 } }
    ]);
    const ws = P.weekStart(t, s.profile.weekStart), meal = (i, slot, v) => { const k = A.addDays(ws, i); (pl.meals[k] = pl.meals[k] || {})[slot] = v; };
    [[0, 'd', { rid: recipes[0].id }], [1, 'd', { rid: recipes[1].id }], [2, 'l', { t: A.t('Leftovers') }], [2, 'd', { rid: recipes[3].id }], [3, 'd', { rid: recipes[2].id }], [4, 'd', { t: A.t('Pizza night') }], [5, 'b', { t: A.t('Pancakes') }], [6, 'd', { rid: recipes[0].id }]].forEach(m => meal(m[0], m[1], m[2]));
    const today = P.SLOTS.some(s => (pl.meals[t] || {})[s[0]]);
    if (!today) (pl.meals[t] = pl.meals[t] || {}).d = { rid: recipes[1].id };
    put('groceries', [{ t: A.t('Milk') }, { t: A.t('Bread') }, { t: A.t('Eggs') }, { t: A.t('Bananas') }, { t: A.t('Coffee') }, { t: A.t('Washing-up liquid'), done: true, at: t }, { t: A.t('Rice'), done: true, at: t }]);
    put('sleep', [7.5, 6, 8, 7, 5.5, 7, 8.5, 7, 6.5, 7.5, 8, 6, 7, 7.5].map((v, i) => ({ d: d(-i - 1), v: v })), SAM);
    put('meds', [{ t: A.t('Morning medication'), emoji: '💊', per: 7, time: '08:00', stock: 6, dose: 1, low: 7, days: ticks([1, 1, 1, 1, 1, 1, 1, 0], 3) }, { t: A.t('Vitamin D'), emoji: '🌞', per: 7, stock: 48, dose: 1, low: 10, days: ticks([1, 1, 0, 1, 1, 1, 0, 0], 3) }], SAM);
    put('move', [30, 0, 45, 20, 0, 60, 25, 0, 30, 40, 0, 20, 35, 15].map((v, i) => ({ d: d(-i - 1), v: v })).filter(x => x.v), SAM);
    put('pets', [{ t: A.t('Feed the cat'), due: t, rep: 'daily' }, { t: A.t('Flea treatment'), due: d(9), rep: 'monthly' }, { t: A.t('Vet check-up'), due: d(40) }]);

    /* ---------- Mind ---------- */
    const moods = [4, 3, 4, 2, 3, 4, 5, 3, 3, 4, 2, 4, 4, 3], charge = [3, 2, 4, 2, 2, 3, 4, 3, 2, 4, 1, 3, 4, 3];
    put('mood', moods.map((v, i) => Object.assign({ d: d(-i - 1), v: v, v2: charge[i] }, i === 3 ? { note: A.t('Slept badly, too much on at work.') } : i === 6 ? { note: A.t('Long walk in the morning helped.') } : {})), SAM);
    put('journal', [
      { d: d(-1), body: A.t('Got the report half done, which is more than I expected. The trick was starting with the smallest part.'), prompt: A.t('What went better than expected?') },
      { d: d(-3), body: A.t('Too many tabs open, in the browser and in my head. Wrote everything into the brain dump and felt lighter.'), prompt: A.t('What is taking up the most room in your head today?') },
      { d: d(-6), body: A.t('Lay out clothes tonight. That is all.'), prompt: A.t('What would make tomorrow a little easier?') }
    ], SAM);
    put('gratitude', [{ d: d(-1), body: A.t('Coffee in the sun before anyone was up.') }, { d: d(-2), body: A.t('Mia’s joke at dinner.') }, { d: d(-4), body: A.t('The neighbour took the parcel in.') }, { d: d(-7), body: A.t('A whole evening with nothing planned.') }], SAM);
    put('therapy', [{ d: d(-5), body: A.t('Bring up: how hard it is to start tasks that have no deadline.'), prompt: A.t('What I want to bring up next time') }, { d: d(-12), body: A.t('Take away: decide the first two-minute step the evening before.'), prompt: A.t('What I took away from the last session') }], SAM);
    put('coping', [{ t: A.t('Step outside for three minutes'), sec: 0 }, { t: A.t('Write down everything that is shouting at me'), sec: 0 }, { t: A.t('Text someone, no need to explain'), sec: 1 }, { t: A.t('A shower and clean clothes'), sec: 1 }, { t: A.t('Set a ten-minute timer and only start'), sec: 2 }, { t: A.t('Do the smallest part badly'), sec: 2 }], SAM);
    put('dopamine', [{ t: A.t('One favourite song, loud'), sec: 0 }, { t: A.t('Stretch by an open window'), sec: 0 }, { t: A.t('Make a proper cup of tea'), sec: 0 }, { t: A.t('Walk to the park and back'), sec: 1 }, { t: A.t('Cook something new'), sec: 1 }, { t: A.t('Call a friend'), sec: 1 }, { t: A.t('A film with snacks'), sec: 2 }, { t: A.t('The good bakery'), sec: 2 }], SAM);

    /* ---------- Goals ---------- */
    put('goals', [
      { t: A.t('Pay off the credit card'), due: d(390), steps: steps([A.t('Stop using it for groceries'), A.t('Set up the extra monthly payment'), A.t('Halfway there'), A.t('Last payment')], 2) },
      { t: A.t('Run five kilometres without stopping'), due: d(120), steps: steps([A.t('Walk and run for 20 minutes, three times'), A.t('Run two kilometres'), A.t('Run three and a half'), A.t('Run five')], 1) },
      { t: A.t('Read twelve books this year'), steps: steps([A.t('Three books'), A.t('Six books'), A.t('Nine books'), A.t('Twelve books')], 2) }
    ], SAM);
    put('vision', [{ d: d(-30), body: A.t('A small house with a garden and a workshop.') }, { d: d(-30), body: A.t('Mornings without rushing.') }, { d: d(-28), body: A.t('Debt-free, with six months put aside.') }, { d: d(-20), body: A.t('Strong enough to carry the kids on my shoulders.') }], SAM);
    put('yearmap', [{ t: A.t('Build the emergency cushion'), sec: 0, done: true, at: d(-200) }, { t: A.t('Start running'), sec: 1, done: true, at: d(-100) }, { t: A.t('Trip to Portugal'), sec: 2 }, { t: A.t('Repaint the bedroom'), sec: 2 }, { t: A.t('Credit card under half'), sec: 3 }, { t: A.t('A calm December'), sec: 3 }], SAM);
    put('affirm', [{ d: d(-40), body: A.t('Done is better than perfect.') }, { d: d(-40), body: A.t('I only have to start. Starting is the whole job.') }, { d: d(-35), body: A.t('Rest is part of the work.') }, { d: d(-30), body: A.t('My worth is not my to-do list.') }], SAM);
    put('letters', [{ d: d(-180), body: A.t('If you are reading this, you kept going for half a year. I am proud of you. Did the trip happen?'), open: d(-1) }, { d: d(-10), body: A.t('To me, next year: I hope the mornings are slower now.'), open: d(355) }], SAM);

    /* ---------- People ---------- */
    put('circle', [{ t: A.t('Grandma'), f: { every: 7, last: d(-9), note: A.t('Ask about the garden.') } }, { t: A.t('Jo'), f: { every: 21, last: d(-6), note: A.t('New job since spring.') } }, { t: A.t('Uncle Pete'), f: { every: 30, last: d(-41), note: '' } }], SAM);
    put('birthdays', [{ t: 'Mia', d: (+t.slice(0, 4) - 9) + '-' + d(3).slice(5), yearly: true, emoji: '🎂', remind: 3 }, { t: A.t('Grandma'), d: '1948-' + d(64).slice(5), yearly: true, emoji: '🎂', remind: 7 }, { t: A.t('Wedding anniversary'), d: '2015-' + d(150).slice(5), yearly: true, emoji: '💍', remind: 7 }, { t: 'Alex', d: '1990-' + d(230).slice(5), yearly: true, emoji: '🎂', remind: 7 }]);
    put('gifts', [{ t: A.t('Sketchbook and good pencils'), st: 0, f: { who: 'Mia', amt: 28, where: A.t('The art shop in town') } }, { t: A.t('Gardening gloves'), st: 1, f: { who: A.t('Grandma'), amt: 15, where: '' } }, { t: A.t('Concert tickets'), st: 0, f: { who: 'Alex', amt: 90, where: '' } }]);
    put('events', [{ t: A.t('Mia’s birthday party'), due: d(3), steps: steps([A.t('Send the invitations'), A.t('Order the cake'), A.t('Buy balloons and candles'), A.t('Tidy the living room'), A.t('Charge the camera')], 2) }]);

    /* ---------- Household ---------- */
    put('cleaning', [{ t: A.t('Hoover the living room'), due: d(1), rep: 'weekly', who: SAM }, { t: A.t('Clean the bathroom'), due: d(2), rep: 'weekly', who: ALEX }, { t: A.t('Change the bed sheets'), due: d(5), rep: 'biweekly', who: SAM }, { t: A.t('Wipe the kitchen surfaces'), due: t, rep: 'daily', who: ALEX }, { t: A.t('Clean the fridge'), due: d(12), rep: 'monthly' }, { t: A.t('Wash the towels'), due: d(-1), rep: 'weekly', who: SAM }]);
    put('chores', [{ t: A.t('Take out the recycling'), due: d(1), rep: 'weekly', who: SAM }, { t: A.t('Cook dinner'), due: t, rep: 'days', every: 2, who: ALEX }, { t: A.t('Set the table'), due: t, rep: 'daily', who: MIA }, { t: A.t('Feed the cat in the evening'), due: t, rep: 'daily', who: MIA }, { t: A.t('Do the weekly shop'), due: d(3), rep: 'weekly', who: ALEX }, { t: A.t('Empty the dishwasher'), due: t, rep: 'daily' }]);
    put('declutter', [{ t: A.t('The cutlery drawer'), sec: 0, done: true, at: d(-3) }, { t: A.t('Spices past their date'), sec: 0 }, { t: A.t('The bedside table'), sec: 1 }, { t: A.t('The medicine cabinet'), sec: 2 }, { t: A.t('The shelf under the TV'), sec: 3 }, { t: A.t('One box in the storage room'), sec: 4 }]);
    put('inventory', [{ t: A.t('Laptop'), f: { where: A.t('Desk'), amt: 1100, until: d(400), note: '' } }, { t: A.t('Washing machine'), f: { where: A.t('Bathroom'), amt: 480, until: d(-90), note: A.t('Manual is in the kitchen drawer.') } }, { t: A.t('Passports'), f: { where: A.t('Top drawer of the dresser'), amt: '', until: '', note: '' } }]);
    put('emergency', [{ t: A.t('Family doctor'), f: { phone: '555 0142', note: A.t('Open weekdays, mornings.') } }, { t: A.t('Plumber'), f: { phone: '555 0177', note: '' } }, { t: A.t('Allergies'), f: { phone: '', note: A.t('Mia: penicillin.') } }]);

    /* ---------- Learn ---------- */
    put('books', [{ t: A.t('The Hobbit'), st: 2, f: { by: 'J. R. R. Tolkien', rate: 5, note: '' } }, { t: A.t('Atomic Habits'), st: 2, f: { by: 'James Clear', rate: 4, note: A.t('Make it easy to start.') } }, { t: A.t('The Midnight Library'), st: 1, f: { by: 'Matt Haig', rate: '', note: '' } }, { t: A.t('Dune'), st: 0, f: { by: 'Frank Herbert', rate: '', note: '' } }, { t: A.t('Project Hail Mary'), st: 0, f: { by: 'Andy Weir', rate: '', note: '' } }], SAM);
    put('courses', [{ t: A.t('Spanish for beginners'), steps: steps([A.t('Lesson 1: greetings'), A.t('Lesson 2: numbers'), A.t('Lesson 3: food'), A.t('Lesson 4: directions'), A.t('Lesson 5: past tense')], 2) }], SAM);
    put('ideas', [{ d: d(-2), body: A.t('A weekly dinner where everyone cooks one thing.') }, { d: d(-8), body: A.t('Sell the old bike and put the money in the trip fund.') }, { d: d(-15), body: A.t('A photo of the same tree every month.') }], SAM);
    put('skills', [{ t: A.t('Learn to bake bread'), steps: steps([A.t('A simple no-knead loaf'), A.t('Keep a starter alive for two weeks'), A.t('First sourdough'), A.t('A loaf worth giving away')], 1) }], SAM);
    put('timetable', [{ t: A.t('Maths'), st: 0, f: { time: '08:30', where: '12' } }, { t: A.t('English'), st: 0, f: { time: '10:15', where: '7' } }, { t: A.t('Science'), st: 1, f: { time: '08:30', where: A.t('Lab') } }, { t: A.t('Art'), st: 3, f: { time: '13:00', where: '3' } }, { t: A.t('Sport'), st: 4, f: { time: '11:00', where: A.t('Hall') } }], MIA);
    put('exams', [{ t: A.t('Maths test: fractions'), due: d(6), steps: steps([A.t('Redo the worksheet'), A.t('Ten practice questions')], 0) }, { t: A.t('Hand in the science poster'), due: d(11) }], MIA);
    put('grades', [{ t: A.t('Maths'), f: { grade: 5, note: '' } }, { t: A.t('English'), f: { grade: 6, note: '' } }, { t: A.t('Science'), f: { grade: 5, note: '' } }], MIA);
    put('timetable', [{ t: A.t('Spanish class'), st: 2, f: { time: '18:30', where: A.t('Community centre') } }], SAM);

    /* ---------- Explore ---------- */
    put('places', [{ t: A.t('Lisbon'), st: 0, f: { when: '', note: A.t('Trams, tiles and custard tarts.') } }, { t: A.t('The Lake District'), st: 1, f: { when: '2023', note: '' } }, { t: A.t('Rome'), st: 1, f: { when: '2019', note: '' } }, { t: A.t('Iceland'), st: 0, f: { when: '', note: '' } }], SAM);
    put('trips', [{ t: A.t('Trip to Portugal'), due: d(47), steps: steps([A.t('Book the flights'), A.t('Book the first two nights'), A.t('Check the passports'), A.t('Travel insurance'), A.t('Ask the neighbour to feed the cat')], 2) }]);
    put('packing', [{ t: A.t('T-shirts'), sec: 0 }, { t: A.t('Swimwear'), sec: 0 }, { t: A.t('A warm layer'), sec: 0 }, { t: A.t('Toothbrush'), sec: 1 }, { t: A.t('Sun cream'), sec: 1 }, { t: A.t('Phone charger'), sec: 2 }, { t: A.t('Headphones'), sec: 2 }, { t: A.t('Passports'), sec: 3 }, { t: A.t('Tickets'), sec: 3 }]);
    put('bucket', [{ t: A.t('See the northern lights') }, { t: A.t('Sleep under the stars') }, { t: A.t('Learn to swim properly'), done: true, at: d(-300) }, { t: A.t('Take the kids camping') }], SAM);
    put('memories', [{ d: d(-60), body: A.t('First camping trip. It rained, we played cards in the tent and nobody minded.') }, { d: d(-200), body: A.t('The day Mia rode her bike without help.') }], SAM);

    /* ---------- Career ---------- */
    put('side', [{ t: A.t('Sell prints of my photos'), steps: steps([A.t('Pick ten photos'), A.t('Order test prints'), A.t('Open the shop page'), A.t('Tell five people')], 1) }], SAM);
    put('income', [{ t: A.t('Salary'), f: { amt: 4200, note: '' } }, { t: A.t('Photo prints'), f: { amt: 60, note: '' } }, { t: A.t('Tutoring'), f: { amt: 180, note: A.t('Two evenings a month.') } }], SAM);
    put('cv', [{ d: d(-20), body: A.t('Led the move to the new invoicing system: three teams, on time.') }, { d: d(-70), body: A.t('Trained two new colleagues.') }], SAM);
    put('network', [{ t: A.t('Dana, former manager'), f: { role: A.t('Now at a design studio'), every: 90, last: d(-100), note: '' } }, { t: A.t('Sam K., meetup'), f: { role: A.t('Runs a small print shop'), every: 60, last: d(-20), note: '' } }], SAM);

    pl.fl[SAM] = {}; [[1, 50], [2, 25], [4, 75], [5, 25], [8, 50]].forEach(x => { pl.fl[SAM][d(-x[0])] = x[1]; });
    return pl;
  };
})(window.App);
