// Chaos Hub (Basic) — offline PWA
// Storage helpers
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
};

// Initial data
const data = {
  profile: store.get('profile', {xp:0, mischief:0, streak:0, lastQuestDate:null, jackpotOdds:0.06}),
  quests: store.get('quests', []),
  rewards: store.get('rewards', [
    {name:'Iced coffee', value:1},
    {name:'MTG common pack (budget)', value:2},
    {name:'Take a 30-min guilt-free break', value:1},
    {name:'Snack splurge', value:1},
    {name:'You get... a high-five from Donnie', value:0},
    {name:'Jackpot: $10 fun budget', value:5}
  ]),
  drops: store.get('drops', [])
};

const QUESTS = [
  { text: 'Send a ridiculous meme to someone you haven’t messaged in 3+ months', xp: 8, mischief: 2 },
  { text: 'Rearrange 3 tiny objects in Corey’s space. Observe silently.', xp: 10, mischief: 4 },
  { text: 'Do 10 push-ups or 30s dance break (your choice)', xp: 6, mischief: 0 },
  { text: 'Organize one chaotic corner (5 minutes max timer)', xp: 7, mischief: 1 },
  { text: 'Compliment a stranger or coworker (genuine)', xp: 6, mischief: 0 },
  { text: 'No-spend hour: dodge every purchase impulse', xp: 9, mischief: 0 },
  { text: 'Secret bonus: teach Donnie a new trick attempt', xp: 12, mischief: 2 }
];

const CAPTION_BITS = [
  '🔮 Portals open at inconvenient times.',
  '🪙 Chaotic neutral approved.',
  '👑 The Goblin King demands tribute.',
  '🦴 Donnie said post it, so we posted it.',
  '🌀 Found in a pocket dimension.',
  '✨ Artifact rarity: questionable.'
];

// UI elements
const el = (id) => document.getElementById(id);

function save() {
  store.set('profile', data.profile);
  store.set('quests', data.quests);
  store.set('rewards', data.rewards);
  store.set('drops', data.drops);
  render();
}

// Chaos Button
function todayISO() {
  return new Date().toISOString().slice(0,10);
}
function newQuest() {
  const q = QUESTS[Math.floor(Math.random()*QUESTS.length)];
  const date = new Date().toISOString();
  // streak logic
  const last = data.profile.lastQuestDate;
  const today = todayISO();
  if (last !== today) {
    if (last && (new Date(last) >= new Date(new Date().setDate(new Date().getDate()-1)).toISOString().slice(0,10))) {
      data.profile.streak += 1;
    } else {
      data.profile.streak = 1;
    }
    data.profile.lastQuestDate = today;
  }
  data.profile.xp += q.xp;
  data.profile.mischief += q.mischief;
  data.quests.unshift({date, text:q.text, xp:q.xp, mischief:q.mischief});
  save();
  el('questText').textContent = q.text;
  el('questGain').textContent = `+${q.xp} XP, +${q.mischief} ✦ mischief`;
}

// Temptation Test (double-or-weird)
function temptationTest() {
  const last = data.quests[0];
  if (!last) return alert('Do a quest first!');
  const roll = Math.random();
  if (roll < 0.5) {
    // double xp
    data.profile.xp += last.xp;
    save();
    alert(`Temptation resisted! Double XP awarded (+${last.xp}).`);
  } else {
    // weirder side quest
    const weird = 'Up the chaos: speak only in emoji for 10 minutes with a friend 👀';
    data.quests.unshift({date:new Date().toISOString(), text:weird, xp:5, mischief:3});
    data.profile.xp += 5; data.profile.mischief += 3;
    save();
    alert('You accepted the weird version. +5 XP, +3 mischief. 🌀');
  }
}

// Reward Roulette
function spinReward() {
  // jackpot odds
  const jackpot = Math.random() < data.profile.jackpotOdds;
  let pick;
  if (jackpot) {
    pick = {name:'JACKPOT: Surprise $15 treat budget', value:8};
  } else {
    pick = data.rewards[Math.floor(Math.random()*data.rewards.length)];
  }
  el('wheelText').textContent = pick.name;
  el('rewardResult').textContent = `Won: ${pick.name} (${pick.value}★ value)`;
  data.quests.unshift({date:new Date().toISOString(), text:`Reward won: ${pick.name}`, xp:pick.value, mischief:0});
  data.profile.xp += pick.value;
  save();
}

// Strange Drip Dropper
function addDesign() {
  const title = el('designTitle').value.trim();
  if (!title) return;
  data.drops.unshift({id: crypto.randomUUID(), title, createdAt: new Date().toISOString()});
  el('designTitle').value='';
  save();
}
function removeDesign(id) {
  data.drops = data.drops.filter(d => d.id !== id);
  save();
}
function randomCaption() {
  const pick = CAPTION_BITS[Math.floor(Math.random()*CAPTION_BITS.length)];
  const hash = '#StrangeDrip #goblincore #cryptid #weirdart #trippy';
  el('captionOut').value = `${pick} ${hash}`;
}

// Render
function render() {
  el('xpVal').textContent = data.profile.xp;
  el('mischiefVal').textContent = data.profile.mischief;
  el('streakVal').textContent = data.profile.streak;
  // history
  el('history').innerHTML = data.quests.slice(0,10).map(q => 
    `<div class="item"><div class="muted">${new Date(q.date).toLocaleString()}</div><div>${q.text}</div><div class="muted">+${q.xp} XP${q.mischief?`, +${q.mischief} mischief`:''}</div></div>`
  ).join('') || '<div class="muted">No entries yet.</div>';
  // drops
  el('dropList').innerHTML = data.drops.map(d => 
    `<div class="item"><div><strong>${d.title}</strong></div><div class="muted">${new Date(d.createdAt).toLocaleString()}</div><div class="row"><button onclick="removeDesign('${d.id}')">Remove</button></div></div>`
  ).join('') || '<div class="muted">No designs queued. Add one above.</div>';
}

// Register SW
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js');
  });
}

// Expose handlers
window.newQuest = newQuest;
window.spinReward = spinReward;
window.randomCaption = randomCaption;
window.addDesign = addDesign;
window.removeDesign = removeDesign;
window.temptationTest = temptationTest;

// Boot
render();
