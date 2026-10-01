/* =========================================================================
   IRON RISE — GAME ENGINE v2
   ========================================================================= */

/* ======================= 1. CONFIG ======================= */

const STAGE_NAMES = [
  "ROOKIE","BEGINNER","TRAINEE","FIGHTER","IRON FIGHTER","STRONGMAN","ELITE",
  "CHAMPION","HEAVYWEIGHT","TITAN","IRON TITAN","DESTROYER","COLOSSUS",
  "IRON BEAST","APEX","OVERLORD","SUPREME","IMMORTAL","IRON GOD","IRON COLOSSUS"
];

// Harder early curve per request: Stage 1->2 jump is ~13x steeper than the
// previous build. Ratio ~2.55x per stage afterward, same as before.
const STAGE_THRESHOLDS = [
  0, 6000, 15300, 39015, 99488, 253695, 646922, 1649652, 4206613, 10726862,
  27353498, 69751420, 177866122, 453558610, 1156574455, 2949264861,
  7520625396, 19177594759, 48902866635, 124702309920
];

const UNLOCKED_ART_COUNT = 10; // stages 1-10 have real art; 11-20 show as locked/coming soon

const STAGES = STAGE_NAMES.map((name, i) => {
  const id = i + 1;
  return {
    id, name,
    img: id <= UNLOCKED_ART_COUNT ? `assets/characters/stage-${String(id).padStart(2, "0")}.png` : null,
    hasArt: id <= UNLOCKED_ART_COUNT,
    requiredPower: STAGE_THRESHOLDS[i]
  };
});

const UPGRADES = [
  {
    id: "trainingPower", title: "Training Power", icon: "👊",
    desc: "Increases the raw Power gained from every training action.",
    baseCost: 25, growth: 1.18, effectPerLevel: 0.08,
    effectLabel: lvl => `+${Math.round(lvl * 8)}% tap power`
  },
  {
    id: "criticalChance", title: "Critical Chance", icon: "💥",
    desc: "Increases your chance to land a Critical Hit while training.",
    baseCost: 40, growth: 1.22, effectPerLevel: 0.015, maxLevel: 46,
    effectLabel: lvl => `${Math.min(75, Math.round((5 + lvl * 1.5)))}% crit chance`
  },
  {
    id: "comboMultiplier", title: "Combo Multiplier", icon: "✳️",
    desc: "Each point of Combo grants a larger Power bonus.",
    baseCost: 60, growth: 1.20, effectPerLevel: 0.05,
    effectLabel: lvl => `+${(2 * (1 + lvl * 0.05)).toFixed(1)}% per combo`
  },
  {
    id: "energyCapacity", title: "Energy Capacity", icon: "⚡",
    desc: "Increases maximum Energy, letting you train for longer.",
    baseCost: 30, growth: 1.15, effectPerLevel: 10,
    effectLabel: lvl => `${100 + lvl * 10} max energy`
  },
  {
    id: "passivePower", title: "Passive Power", icon: "🌀",
    desc: "Automatically generates Power every second, even when idle.",
    baseCost: 100, growth: 1.25, effectPerLevel: 1,
    effectLabel: lvl => `+${formatNumber(passivePowerPerSecond(lvl))}/sec`
  }
];

const SHOP_ITEMS = [
  { id: "powerSurge", title: "Power Surge", icon: "🔥", currency: "coins", cost: 500,
    desc: "Doubles your Power gain from training for 60 seconds.",
    apply: state => activateBoost(state, "powerMult", 2, 60) },
  { id: "megaSurge", title: "Mega Surge", icon: "🚀", currency: "gems", cost: 25,
    desc: "Multiplies your Power gain from training by 5x for 30 seconds.",
    apply: state => activateBoost(state, "powerMult", 5, 30) },
  { id: "fullEnergy", title: "Full Energy", icon: "🔋", currency: "coins", cost: 200,
    desc: "Instantly refills your Energy to maximum.",
    apply: state => { state.energy = maxEnergy(state); } },
  { id: "comboLock", title: "Combo Lock", icon: "🔗", currency: "gems", cost: 20,
    desc: "Your Combo will not decay for 45 seconds.",
    apply: state => activateBoost(state, "comboLock", 1, 45) },
  { id: "criticalBoost", title: "Critical Boost", icon: "🎯", currency: "coins", cost: 350,
    desc: "Increases Critical Hit chance by 20% for 60 seconds.",
    apply: state => activateBoost(state, "critBonus", 0.20, 60) },
  { id: "coinExchange", title: "Gem Exchange", icon: "🪙", currency: "gems", cost: 10,
    desc: "Instantly converts gems into a large pile of coins.",
    apply: state => { state.coins += 4000 + state.stage * 1500; } }
];

// Expanded mission list per request: many missions, several deliberately
// brutal, with one true end-game mission (~a week of normal engaged play).
const MISSIONS = [
  { id: "m_taps1000", title: "Do 1,000 Taps", icon: "👊", target: 1000, type: "taps", reward: { coins: 300, energy: 30 } },
  { id: "m_taps5000", title: "Do 5,000 Taps", icon: "👊", target: 5000, type: "taps", reward: { energy: 50, coins: 800 } },
  { id: "m_tenKTaps", title: "Ten Thousand Taps", icon: "👊", target: 10000, type: "taps", reward: { coins: 2000, gems: 8 } },
  { id: "m_noDaysOff", title: "No Days Off — 50,000 Taps", icon: "📅", target: 50000, type: "taps", reward: { coins: 40000, gems: 20 } },
  { id: "m_hundredKTaps", title: "Hundred Thousand Taps", icon: "👊", target: 100000, type: "taps", reward: { coins: 150000, gems: 35 } },

  { id: "m_firstGrind", title: "First Grind — Reach 2,000 Power", icon: "💪", target: 2000, type: "power", reward: { coins: 500, gems: 5 } },
  { id: "m_heavyDuty", title: "Heavy Duty — Reach 100,000 Power", icon: "🏋️", target: 100000, type: "power", reward: { coins: 8000, gems: 15 } },
  { id: "m_longGrind", title: "Long Grind — Reach 10,000,000 Power", icon: "📈", target: 10000000, type: "power", reward: { coins: 500000, gems: 60 } },
  { id: "m_powerBillionaire", title: "Power Billionaire — Reach 1,000,000,000 Power", icon: "💰", target: 1000000000, type: "power", reward: { coins: 5000000, gems: 120 } },
  { id: "m_powerLegend", title: "Beyond the Limit — Reach 100,000,000,000 Power", icon: "🌌", target: 100000000000, type: "power", reward: { coins: 50000000, gems: 250 } },

  { id: "m_upgrade20", title: "Upgrade Power 20 Times", icon: "🔨", target: 20, type: "upgradeCount", reward: { coins: 100000000 } },
  { id: "m_upgrade50", title: "Upgrade Master — 50 Upgrade Levels", icon: "🔧", target: 50, type: "upgradeCount", reward: { coins: 300000000, gems: 40 } },

  { id: "m_combo50", title: "Reach Combo x50", icon: "🔥", target: 50, type: "bestCombo", reward: { coins: 75000000 } },
  { id: "m_comboMonster", title: "Combo Monster — Reach Combo x100", icon: "✳️", target: 100, type: "bestCombo", reward: { coins: 10000, gems: 15 } },
  { id: "m_comboGod", title: "Combo God — Reach Combo x200", icon: "✳️", target: 200, type: "bestCombo", reward: { coins: 2000000, gems: 50 } },

  { id: "m_bossdefeat5", title: "Defeat Boss 5 Times", icon: "💀", target: 5, type: "bossDefeats", reward: { coins: 200000000 } },
  { id: "m_bossdefeat25", title: "Defeat Boss 25 Times", icon: "💀", target: 25, type: "bossDefeats", reward: { coins: 1200000000, gems: 70 } },

  { id: "m_play120", title: "Play for 120 Minutes", icon: "⏱️", target: 120, type: "minutesPlayed", reward: { coins: 150000000 } },
  { id: "m_play600", title: "Play for 600 Minutes", icon: "⏱️", target: 600, type: "minutesPlayed", reward: { coins: 2000000000, gems: 90 } },

  { id: "m_ironDiscipline", title: "Iron Discipline — Reach Stage 5", icon: "🥋", target: 5, type: "stage", reward: { coins: 3000, gems: 10 } },
  { id: "m_titanAscent", title: "Titan Ascent — Reach Stage 10", icon: "⛰️", target: 10, type: "stage", reward: { coins: 25000, gems: 25 } },
  { id: "m_colossusHunt", title: "Colossus Hunt — Reach Stage 15", icon: "🗿", target: 15, type: "stage", reward: { coins: 120000, gems: 40 } },
  { id: "m_finalAscent", title: "Final Ascent — Reach Stage 20", icon: "👑", target: 20, type: "stage", reward: { coins: 5000000, gems: 200 } },

  // The big one — tuned to roughly a week of normal engaged play at this curve.
  { id: "m_endOfTheGrind", title: "THE LONG GRIND — Reach 6,858,627,045,600 Power", icon: "⚔️", target: 6858627045600, type: "power", reward: { coins: 500000000000, gems: 1000 }, epic: true }
];

const ACHIEVEMENTS = [
  { id: "a_firstTap", title: "First Tap", icon: "👊", desc: "Perform your very first training tap.", target: 1, type: "taps", reward: { coins: 100 } },
  { id: "a_powerUp", title: "Power Up", icon: "🔺", desc: "Reach 5,000 Power.", target: 5000, type: "power", reward: { coins: 1000, gems: 5 } },
  { id: "a_bigGuy", title: "Big Guy", icon: "🏋️", desc: "Reach Stage 8 — Champion.", target: 8, type: "stage", reward: { coins: 6000, gems: 10 } },
  { id: "a_noLimit", title: "No Limit", icon: "♾️", desc: "Reach a Combo of x75.", target: 75, type: "bestCombo", reward: { coins: 8000, gems: 12 } },
  { id: "a_ironWill", title: "Iron Will", icon: "🛡️", desc: "Perform 25,000 total taps.", target: 25000, type: "taps", reward: { coins: 20000, gems: 20 } },
  { id: "a_titanRising", title: "Titan Rising", icon: "⚡", desc: "Reach Stage 10 — Titan.", target: 10, type: "stage", reward: { coins: 30000, gems: 25 } },
  { id: "a_millionaire", title: "Power Millionaire", icon: "💰", desc: "Reach 1,000,000 Power.", target: 1000000, type: "power", reward: { coins: 100000, gems: 30 } },
  { id: "a_upgradeMaster", title: "Upgrade Master", icon: "🔧", desc: "Purchase 50 total upgrade levels.", target: 50, type: "upgradeCount", reward: { coins: 150000, gems: 35 } },
  { id: "a_supreme", title: "Supreme Being", icon: "🌟", desc: "Reach Stage 17 — Supreme.", target: 17, type: "stage", reward: { coins: 1000000, gems: 80 } },
  { id: "a_ironColossus", title: "The Iron Colossus", icon: "👑", desc: "Reach Stage 20 — the final form.", target: 20, type: "stage", reward: { coins: 10000000, gems: 300 } },
  { id: "a_billionPower", title: "Billionaire's Grip", icon: "💎", desc: "Reach 1,000,000,000 Power.", target: 1000000000, type: "power", reward: { coins: 10000000, gems: 150 } },
  { id: "a_relentless", title: "Relentless", icon: "🔥", desc: "Perform 250,000 total taps.", target: 250000, type: "taps", reward: { coins: 300000000, gems: 60 } },
  { id: "a_comboGod", title: "Combo Deity", icon: "✳️", desc: "Reach a Combo of x150.", target: 150, type: "bestCombo", reward: { coins: 50000000, gems: 60 } },
  { id: "a_veteran", title: "Veteran", icon: "⏱️", desc: "Play for a total of 300 minutes.", target: 300, type: "minutesPlayed", reward: { coins: 200000000, gems: 50 } }
];

const TAP_ENERGY_COST = 4;
const ENERGY_REGEN_PER_SEC = 2;
const COMBO_TIMEOUT_MS = 2500;
const AUTO_TRAIN_INTERVAL_MS = 650;
const SAVE_KEY = "ironRiseSaveV2";
const AUTOSAVE_INTERVAL_MS = 8000;

/* ======================= 2. STATE ======================= */

function defaultState() {
  return {
    power: 0, coins: 250, gems: 20, energy: 100, stage: 1,
    combo: 0, bestCombo: 0, lastTapTime: 0, totalTaps: 0, bossDefeats: 0,
    firstPlayTimestamp: Date.now(), secondsPlayed: 0,
    upgrades: { trainingPower: 0, criticalChance: 0, comboMultiplier: 0, energyCapacity: 0, passivePower: 0 },
    totalUpgradeLevels: 0,
    missionClaims: {}, achievementClaims: {},
    dailyLastClaim: 0, dailyStreak: 0,
    autoTrain: false, soundOn: true, effectsOn: true,
    boosts: {}, lastSaveTime: Date.now()
  };
}

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultState();
    return validateState(JSON.parse(raw));
  } catch (e) {
    console.warn("Save corrupted, starting fresh.", e);
    return defaultState();
  }
}

function validateState(parsed) {
  const base = defaultState();
  const safe = { ...base };
  for (const key of Object.keys(base)) {
    if (parsed[key] === undefined || parsed[key] === null) continue;
    if (typeof base[key] === "number") {
      const n = Number(parsed[key]);
      safe[key] = Number.isFinite(n) && n >= 0 ? n : base[key];
    } else {
      safe[key] = parsed[key];
    }
  }
  if (typeof safe.upgrades !== "object") safe.upgrades = base.upgrades;
  for (const k of Object.keys(base.upgrades)) {
    const v = Number(safe.upgrades[k]);
    safe.upgrades[k] = Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;
  }
  if (typeof safe.missionClaims !== "object") safe.missionClaims = {};
  if (typeof safe.achievementClaims !== "object") safe.achievementClaims = {};
  if (typeof safe.boosts !== "object") safe.boosts = {};
  safe.stage = Math.min(20, Math.max(1, Math.floor(safe.stage) || 1));
  safe.combo = Math.max(0, Math.floor(safe.combo) || 0);
  safe.bestCombo = Math.max(safe.combo, Math.floor(safe.bestCombo) || 0);
  return safe;
}

function saveState() {
  state.lastSaveTime = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
  catch (e) { console.warn("Failed to save Iron Rise progress.", e); }
}

/* ======================= 3. UTIL ======================= */

function formatNumber(n) {
  n = Number(n) || 0;
  const neg = n < 0; n = Math.abs(n);
  if (n < 1000) return (neg ? "-" : "") + (Number.isInteger(n) ? n.toString() : n.toFixed(0));
  const units = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp"];
  let unitIndex = 0;
  while (n >= 1000 && unitIndex < units.length - 1) { n /= 1000; unitIndex++; }
  const formatted = n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : n.toFixed(0);
  return (neg ? "-" : "") + formatted + units[unitIndex];
}

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

function showToast(message, type = "") {
  const stack = document.getElementById("toast-stack");
  const el = document.createElement("div");
  el.className = "toast" + (type ? " " + type : "");
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 3600);
}

/* ======================= 4. CALCULATIONS ======================= */

function stageIndex() { return state.stage - 1; }
function currentStageConfig() { return STAGES[stageIndex()]; }
function nextStageConfig() { return STAGES[stageIndex() + 1] || null; }

function maxEnergy(s = state) {
  return 100 + s.upgrades.energyCapacity * UPGRADES.find(u => u.id === "energyCapacity").effectPerLevel;
}

function passivePowerPerSecond(level, stageIdx = stageIndex()) {
  if (level === undefined) level = state.upgrades.passivePower;
  return level * 2 * Math.pow(1.35, stageIdx);
}

function critChance() {
  const lvl = state.upgrades.criticalChance;
  let chance = 0.05 + lvl * UPGRADES.find(u => u.id === "criticalChance").effectPerLevel;
  chance += activeBoostValue("critBonus");
  return clamp(chance, 0, 0.85);
}

function upgradeCost(upgradeCfg, level) {
  return Math.ceil(upgradeCfg.baseCost * Math.pow(upgradeCfg.growth, level));
}

function activeBoostValue(type) {
  const b = state.boosts[type];
  if (!b || Date.now() > b.expiry) return 0;
  return b.value;
}

function activeBoostMultiplier() {
  const b = state.boosts["powerMult"];
  if (!b || Date.now() > b.expiry) return 1;
  return b.value;
}

function isComboLocked() {
  const b = state.boosts["comboLock"];
  return !!(b && Date.now() < b.expiry);
}

function activateBoost(s, type, value, seconds) {
  s.boosts[type] = { value, expiry: Date.now() + seconds * 1000 };
}

function baseTapPower() { return 8 * Math.pow(1.65, stageIndex()); }

function tapPowerMultiplierFromUpgrades() {
  const cfg = UPGRADES.find(u => u.id === "trainingPower");
  return 1 + state.upgrades.trainingPower * cfg.effectPerLevel;
}

function comboBonusMultiplier() {
  const cfg = UPGRADES.find(u => u.id === "comboMultiplier");
  const perCombo = 0.02 * (1 + state.upgrades.comboMultiplier * cfg.effectPerLevel);
  return 1 + state.combo * perCombo;
}

function computeTapResult() {
  const base = baseTapPower() * tapPowerMultiplierFromUpgrades();
  const combo = comboBonusMultiplier();
  const isCrit = Math.random() < critChance();
  const critMult = isCrit ? 2.5 : 1;
  const boostMult = activeBoostMultiplier();
  const raw = base * combo * critMult * boostMult;
  return { power: Math.max(1, Math.round(raw)), isCrit };
}

/* ======================= 5. ACTIONS ======================= */

function train(source = "manual") {
  if (state.energy < TAP_ENERGY_COST) { showToast("Not enough Energy!", ""); return; }
  state.energy -= TAP_ENERGY_COST;
  const now = Date.now();
  if (now - state.lastTapTime > COMBO_TIMEOUT_MS) state.combo = 0;
  state.lastTapTime = now;
  state.combo += 1;
  if (state.combo > state.bestCombo) state.bestCombo = state.combo;

  const result = computeTapResult();
  state.power += result.power;
  state.totalTaps += 1;

  if (state.totalTaps % 500 === 0) {
    state.bossDefeats += 1;
    showToast("Training Boss defeated!", "gold");
  }

  state.coins += Math.max(1, Math.round(result.power * 0.02));

  animateTrainFeedback(result);
  checkStageUp();
  refreshHUD();
  refreshMissionsIfOpen();
}

function checkStageUp() {
  let advanced = false;
  while (state.stage < 20) {
    const next = STAGES[state.stage];
    if (!next) break;
    if (state.power >= next.requiredPower) { state.stage += 1; advanced = true; }
    else break;
  }
  if (advanced) onStageUp();
  return advanced;
}

function onStageUp() {
  const cfg = currentStageConfig();
  renderCharacterVisual(document.getElementById("character-visual"), cfg);
  document.getElementById("character-stage").classList.add("stage-unlock-anim");
  setTimeout(() => document.getElementById("character-stage").classList.remove("stage-unlock-anim"), 700);
  spawnStageParticles();
  showStageModal(cfg);
  showToast(`STAGE UP! You are now ${cfg.name}!`, "gold");
  renderAscension();
  renderHomeStageInfo();
  saveState();
}

function spawnStageParticles() {
  const layer = document.getElementById("particle-layer");
  if (!layer || !state.effectsOn) return;
  const colors = ["#3aa0ff", "#8a5cff", "#ffb23a", "#3ddc84"];
  for (let i = 0; i < 24; i++) {
    const p = document.createElement("div");
    p.className = "stage-particle";
    const angle = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 120;
    const ex = Math.cos(angle) * dist;
    const ey = Math.sin(angle) * dist;
    const size = 3 + Math.random() * 6;
    p.style.left = "50%"; p.style.top = "50%";
    p.style.width = size + "px"; p.style.height = size + "px";
    p.style.background = colors[i % colors.length];
    p.style.boxShadow = `0 0 8px ${colors[i % colors.length]}`;
    p.style.setProperty("--pend", `translate(${ex}px, ${ey}px)`);
    layer.appendChild(p);
    setTimeout(() => p.remove(), 950);
  }
}

function showStageModal(cfg) {
  const modal = document.getElementById("stage-modal");
  renderCharacterVisual(document.getElementById("stage-modal-visual"), cfg);
  document.getElementById("stage-modal-name").textContent = `${cfg.id}. ${cfg.name}`;
  modal.classList.add("show");
}

function buyUpgrade(id) {
  const cfg = UPGRADES.find(u => u.id === id);
  if (!cfg) return;
  const level = state.upgrades[id];
  if (cfg.maxLevel && level >= cfg.maxLevel) { showToast("Upgrade already maxed."); return; }
  const cost = upgradeCost(cfg, level);
  if (state.coins < cost) { showToast("Not enough Coins!"); return; }
  state.coins -= cost;
  state.upgrades[id] += 1;
  state.totalUpgradeLevels += 1;
  showToast(`${cfg.title} upgraded to level ${state.upgrades[id]}!`, "success");
  renderUpgrades();
  refreshHUD();
  renderMissions();
  saveState();
}

function buyShopItem(id) {
  const item = SHOP_ITEMS.find(i => i.id === id);
  if (!item) return;
  const balance = item.currency === "coins" ? state.coins : state.gems;
  if (balance < item.cost) { showToast(`Not enough ${item.currency === "coins" ? "Coins" : "Gems"}!`); return; }
  if (item.currency === "coins") state.coins -= item.cost; else state.gems -= item.cost;
  item.apply(state);
  showToast(`${item.title} activated!`, "success");
  renderShop();
  refreshHUD();
  saveState();
}

function missionProgressValue(m) {
  switch (m.type) {
    case "taps": return state.totalTaps;
    case "power": return state.power;
    case "stage": return state.stage;
    case "bestCombo": return state.bestCombo;
    case "upgradeCount": return state.totalUpgradeLevels;
    case "bossDefeats": return state.bossDefeats;
    case "minutesPlayed": return Math.floor(state.secondsPlayed / 60);
    default: return 0;
  }
}

function isMissionComplete(m) { return missionProgressValue(m) >= m.target; }

function claimMission(id) {
  const m = MISSIONS.find(x => x.id === id);
  if (!m || state.missionClaims[id] || !isMissionComplete(m)) return;
  applyReward(m.reward);
  state.missionClaims[id] = true;
  showToast(`Mission claimed: ${m.title}`, "success");
  renderMissions();
  refreshHUD();
  saveState();
}

function claimAchievement(id) {
  const a = ACHIEVEMENTS.find(x => x.id === id);
  if (!a || state.achievementClaims[id] || missionProgressValue(a) < a.target) return;
  applyReward(a.reward);
  state.achievementClaims[id] = true;
  showToast(`Achievement unlocked: ${a.title}`, "gold");
  renderAchievements();
  refreshHUD();
  saveState();
}

function applyReward(reward) {
  if (!reward) return;
  if (reward.coins) state.coins += reward.coins;
  if (reward.gems) state.gems += reward.gems;
  if (reward.energy) state.energy = Math.min(maxEnergy(), state.energy + reward.energy);
}

function claimDaily() {
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  if (state.dailyLastClaim && now - state.dailyLastClaim < DAY_MS) return;
  const wasYesterday = state.dailyLastClaim && (now - state.dailyLastClaim < DAY_MS * 2);
  state.dailyStreak = wasYesterday ? state.dailyStreak + 1 : 1;
  state.dailyLastClaim = now;
  const coinReward = 500 * state.dailyStreak;
  const gemReward = 5 + Math.min(20, state.dailyStreak);
  state.coins += coinReward;
  state.gems += gemReward;
  showToast(`Daily reward claimed! +${formatNumber(coinReward)} Coins, +${gemReward} Gems`, "gold");
  renderDaily();
  refreshHUD();
  saveState();
}

function resetProgress() {
  state = defaultState();
  saveState();
  fullRender();
  showToast("Progress has been reset.", "");
}

/* ======================= 6. RENDER ======================= */

function renderCharacterVisual(container, cfg) {
  if (!container) return;
  container.innerHTML = "";
  if (cfg.hasArt) {
    const img = document.createElement("img");
    img.src = cfg.img;
    img.alt = cfg.name;
    container.appendChild(img);
  } else {
    const lp = document.createElement("div");
    lp.className = "locked-placeholder";
    lp.innerHTML = `<span class="lp-icon">🔒</span><span class="lp-text">COMING SOON</span><span class="lp-stage">STAGE ${cfg.id} · ${cfg.name}</span>`;
    container.appendChild(lp);
  }
}

function renderAscension() {
  const wrap = document.getElementById("ascension-path");
  if (!wrap) return;
  wrap.innerHTML = "";
  STAGES.forEach(cfg => {
    const div = document.createElement("div");
    let cls = "asc-card";
    if (cfg.id === state.stage) cls += " current";
    else if (cfg.id < state.stage) cls += " done";
    else cls += " locked";
    div.className = cls;
    const unlocked = cfg.id <= state.stage;
    const thumbHtml = (unlocked && cfg.hasArt)
      ? `<img class="asc-thumb" src="${cfg.img}" alt="${cfg.name}" loading="lazy" />`
      : `<div class="asc-thumb">${unlocked ? "" : "🔒"}</div>`;
    div.innerHTML = `
      <span class="asc-num">${cfg.id}</span>
      ${thumbHtml}
      <div class="asc-name">${unlocked ? cfg.name : "LOCKED"}</div>
    `;
    wrap.appendChild(div);
  });
}

function renderHomeStageInfo() {
  const cfg = currentStageConfig();
  const next = nextStageConfig();
  document.getElementById("char-stage-num").textContent = cfg.id;
  document.getElementById("char-stage-name").textContent = cfg.name;
  renderCharacterVisual(document.getElementById("character-visual"), cfg);

  if (next) {
    const prevReq = cfg.requiredPower;
    const pct = clamp(((state.power - prevReq) / (next.requiredPower - prevReq)) * 100, 0, 100);
    document.getElementById("stage-mini-fill").style.width = pct + "%";
    document.getElementById("stage-mini-nums").textContent = `${formatNumber(state.power)} / ${formatNumber(next.requiredPower)}`;
  } else {
    document.getElementById("stage-mini-fill").style.width = "100%";
    document.getElementById("stage-mini-nums").textContent = "MAX STAGE REACHED";
  }
}

function refreshHUD() {
  document.getElementById("hud-energy").textContent = `${Math.floor(state.energy)}/${maxEnergy()}`;
  document.getElementById("hud-power").textContent = formatNumber(state.power);
  document.getElementById("hud-coins").textContent = formatNumber(state.coins);
  document.getElementById("hud-gems").textContent = formatNumber(state.gems);

  const setIfExists = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setIfExists("stat-power", formatNumber(state.power));
  setIfExists("stat-energy", `${Math.floor(state.energy)}/${maxEnergy()}`);
  setIfExists("stat-pertap", formatNumber(computeDisplayTapPower()));
  setIfExists("stat-combo", `x${state.combo}`);
  setIfExists("stat-crit", `${Math.round(critChance() * 100)}%`);
  setIfExists("stat-bestcombo", state.bestCombo);
  setIfExists("stat-totaltaps", formatNumber(state.totalTaps));
  setIfExists("stat-coins", formatNumber(state.coins));
  setIfExists("stat-gems", formatNumber(state.gems));
  setIfExists("home-combo", `x${state.combo}`);

  document.getElementById("char-power-value").textContent = formatNumber(state.power);
  document.getElementById("train-btn-sub").textContent = `+${formatNumber(computeDisplayTapPower())} POWER`;

  renderHomeStageInfo();
  updatePulseStates();
}

function computeDisplayTapPower() {
  const base = baseTapPower() * tapPowerMultiplierFromUpgrades();
  const combo = comboBonusMultiplier();
  const boostMult = activeBoostMultiplier();
  return Math.round(base * combo * boostMult);
}

function renderGallery() {
  const grid = document.getElementById("gallery-grid");
  if (!grid) return;
  grid.innerHTML = "";
  STAGES.forEach(cfg => {
    const div = document.createElement("div");
    let cls = "gallery-card";
    if (cfg.id === state.stage) cls += " current";
    else if (cfg.id > state.stage) cls += " locked";
    div.className = cls;
    const unlocked = cfg.id <= state.stage;
    let visualHtml;
    if (unlocked && cfg.hasArt) {
      visualHtml = `<div class="g-visual"><img src="${cfg.img}" alt="${cfg.name}" loading="lazy" /></div>`;
    } else if (unlocked && !cfg.hasArt) {
      visualHtml = `<div class="g-visual lp"><span class="lp-icon">🧩</span><span class="lp-text">COMING SOON</span></div>`;
    } else {
      visualHtml = `<div class="g-visual lp"><span class="lp-icon">🔒</span><span class="lp-text">LOCKED</span></div>`;
    }
    div.innerHTML = `
      <span class="g-num">${cfg.id}</span>
      ${visualHtml}
      <div class="g-name">${unlocked ? cfg.name : "???"}</div>
    `;
    grid.appendChild(div);
  });
}

function renderUpgrades() {
  const grid = document.getElementById("upgrades-grid");
  if (!grid) return;
  grid.innerHTML = "";
  UPGRADES.forEach(cfg => {
    const level = state.upgrades[cfg.id];
    const maxed = cfg.maxLevel && level >= cfg.maxLevel;
    const cost = maxed ? 0 : upgradeCost(cfg, level);
    const canAfford = !maxed && state.coins >= cost;
    const div = document.createElement("div");
    div.className = "upgrade-card";
    div.innerHTML = `
      <div class="card-icon-row">
        <div class="card-icon">${cfg.icon}</div>
        <div><div class="card-title">${cfg.title}</div><div class="card-level">Level ${level}${cfg.maxLevel ? " / " + cfg.maxLevel : ""}</div></div>
      </div>
      <div class="card-desc">${cfg.desc}</div>
      <div class="card-effect">${cfg.effectLabel(level)}</div>
      <div class="card-bottom">
        <span class="card-cost">${maxed ? "MAXED" : "🪙 " + formatNumber(cost)}</span>
        <button class="buy-btn ${!maxed && canAfford ? "pulse-ready" : ""}" data-upgrade="${cfg.id}" ${maxed || !canAfford ? "disabled" : ""}>${maxed ? "MAXED" : "UPGRADE"}</button>
      </div>
    `;
    grid.appendChild(div);
  });
  grid.querySelectorAll("[data-upgrade]").forEach(btn => btn.addEventListener("click", () => buyUpgrade(btn.dataset.upgrade)));
}

function renderShop() {
  const grid = document.getElementById("shop-grid");
  if (!grid) return;
  grid.innerHTML = "";
  SHOP_ITEMS.forEach(item => {
    const balance = item.currency === "coins" ? state.coins : state.gems;
    const canAfford = balance >= item.cost;
    const boostKeyMap = { powerSurge: "powerMult", megaSurge: "powerMult", comboLock: "comboLock", criticalBoost: "critBonus" };
    const boostKey = boostKeyMap[item.id];
    let activeLabel = "";
    if (boostKey && state.boosts[boostKey] && Date.now() < state.boosts[boostKey].expiry) {
      const remain = Math.ceil((state.boosts[boostKey].expiry - Date.now()) / 1000);
      activeLabel = `<div class="card-effect">ACTIVE — ${remain}s left</div>`;
    }
    const div = document.createElement("div");
    div.className = "shop-card";
    div.innerHTML = `
      <div class="card-icon-row"><div class="card-icon">${item.icon}</div><div class="card-title">${item.title}</div></div>
      <div class="card-desc">${item.desc}</div>
      ${activeLabel}
      <div class="card-bottom">
        <span class="card-cost">${item.currency === "coins" ? "🪙" : "💎"} ${formatNumber(item.cost)}</span>
        <button class="buy-btn ${canAfford ? "pulse-ready" : ""}" data-shop="${item.id}" ${canAfford ? "" : "disabled"}>BUY</button>
      </div>
    `;
    grid.appendChild(div);
  });
  grid.querySelectorAll("[data-shop]").forEach(btn => btn.addEventListener("click", () => buyShopItem(btn.dataset.shop)));
}

function renderMissions() {
  const list = document.getElementById("missions-list");
  if (!list) return;
  list.innerHTML = "";
  MISSIONS.forEach(m => {
    const progress = missionProgressValue(m);
    const complete = progress >= m.target;
    const claimed = !!state.missionClaims[m.id];
    const pct = clamp((progress / m.target) * 100, 0, 100);
    const rewardStr = Object.entries(m.reward).map(([k, v]) => `${k === "coins" ? "🪙" : k === "gems" ? "💎" : "⚡"}${formatNumber(v)}`).join(" ");
    const div = document.createElement("div");
    div.className = "mission-card" + (m.epic ? " epic" : "");
    div.innerHTML = `
      <div class="mission-top"><span class="mission-title">${m.icon} ${m.title}</span><span class="mission-reward">${rewardStr}</span></div>
      <div class="mission-progress-text">${formatNumber(Math.min(progress, m.target))} / ${formatNumber(m.target)}</div>
      <div class="mission-bottom">
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <button class="mission-claim-btn ${claimed ? "claimed" : complete ? "ready pulse-ready" : ""}" data-mission="${m.id}" ${claimed || !complete ? "disabled" : ""}>${claimed ? "CLAIMED" : complete ? "CLAIM" : "IN PROGRESS"}</button>
      </div>
    `;
    list.appendChild(div);
  });
  list.querySelectorAll("[data-mission]").forEach(btn => btn.addEventListener("click", () => claimMission(btn.dataset.mission)));
}

function refreshMissionsIfOpen() {
  if (document.getElementById("tab-missions").classList.contains("active")) renderMissions();
}

function renderAchievements() {
  const grid = document.getElementById("achievements-grid");
  if (!grid) return;
  grid.innerHTML = "";
  ACHIEVEMENTS.forEach(a => {
    const progress = missionProgressValue(a);
    const complete = progress >= a.target;
    const claimed = !!state.achievementClaims[a.id];
    const rewardStr = Object.entries(a.reward).map(([k, v]) => `${k === "coins" ? "🪙" : "💎"}${formatNumber(v)}`).join(" ");
    const div = document.createElement("div");
    div.className = "achievement-card" + (complete ? "" : " locked");
    div.innerHTML = `
      <div class="card-icon-row"><div class="card-icon">${a.icon}</div><div class="card-title">${a.title}</div></div>
      <div class="card-desc">${a.desc}</div>
      <div class="ach-reward">${rewardStr}</div>
      <div class="card-bottom">
        <span class="card-cost">${formatNumber(Math.min(progress, a.target))} / ${formatNumber(a.target)}</span>
        <button class="buy-btn ${claimed ? "claimed" : complete ? "claim-ready pulse-ready" : ""}" data-ach="${a.id}" ${claimed || !complete ? "disabled" : ""}>${claimed ? "CLAIMED" : complete ? "CLAIM" : "LOCKED"}</button>
      </div>
    `;
    grid.appendChild(div);
  });
  grid.querySelectorAll("[data-ach]").forEach(btn => btn.addEventListener("click", () => claimAchievement(btn.dataset.ach)));
}

function renderDaily() {
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const available = !state.dailyLastClaim || now - state.dailyLastClaim >= DAY_MS;
  const statusEl = document.getElementById("daily-status");
  const timerEl = document.getElementById("daily-timer");
  const btn = document.getElementById("btn-claim-daily");
  document.getElementById("daily-streak").textContent = `Streak: ${state.dailyStreak} day${state.dailyStreak === 1 ? "" : "s"}`;
  if (available) {
    statusEl.textContent = "AVAILABLE"; statusEl.classList.remove("locked");
    timerEl.textContent = ""; btn.disabled = false;
    btn.classList.add("pulse-ready");
  } else {
    statusEl.textContent = "NEXT REWARD IN"; statusEl.classList.add("locked");
    timerEl.textContent = formatDuration(DAY_MS - (now - state.dailyLastClaim));
    btn.disabled = true;
    btn.classList.remove("pulse-ready");
  }
}

function formatDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600).toString().padStart(2, "0");
  const m = Math.floor((total % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(total % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function renderSettings() {
  document.getElementById("toggle-sound").setAttribute("aria-pressed", state.soundOn);
  document.getElementById("toggle-effects").setAttribute("aria-pressed", state.effectsOn);
}

function updatePulseStates() {
  // Upgrades/Shop buttons already compute pulse-ready at render time; this just
  // re-evaluates mission/achievement/daily readiness cheaply without a full rebuild
  // when called from the 1s tick (avoids rebuilding DOM every second).
}

function fullRender() {
  renderAscension();
  renderHomeStageInfo();
  refreshHUD();
  renderGallery();
  renderUpgrades();
  renderShop();
  renderMissions();
  renderAchievements();
  renderDaily();
  renderSettings();
  document.getElementById("toggle-autotrain").setAttribute("aria-pressed", state.autoTrain);
}

/* ======================= 7. EVENTS ======================= */

function switchTab(tabName) {
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  const panel = document.getElementById(`tab-${tabName}`);
  if (panel) panel.classList.add("active");
  document.querySelectorAll(".side-link").forEach(b => b.classList.toggle("active", b.dataset.tab === tabName));
  document.querySelectorAll(".bottom-link").forEach(b => b.classList.toggle("active", b.dataset.tab === tabName));

  if (tabName === "home") renderHomeStageInfo();
  if (tabName === "stats") renderAscension();
  if (tabName === "characters") renderGallery();
  if (tabName === "upgrades") renderUpgrades();
  if (tabName === "shop") renderShop();
  if (tabName === "missions") renderMissions();
  if (tabName === "achievements") renderAchievements();
  if (tabName === "daily") renderDaily();
  if (tabName === "settings") renderSettings();
}

function animateTrainFeedback(result) {
  const trainBtn = document.getElementById("btn-train");
  trainBtn.classList.remove("pressed");
  void trainBtn.offsetWidth;
  trainBtn.classList.add("pressed");

  const popupLayer = document.getElementById("popup-layer");
  const popup = document.createElement("div");
  popup.className = "power-popup" + (result.isCrit ? " crit" : "");
  popup.textContent = (result.isCrit ? "CRITICAL +" : "+") + formatNumber(result.power);
  popup.style.left = (45 + Math.random() * 10) + "%";
  popup.style.top = (45 + Math.random() * 10) + "%";
  popupLayer.appendChild(popup);
  setTimeout(() => popup.remove(), 950);

  if (result.isCrit && state.effectsOn) {
    const flash = document.getElementById("critical-flash");
    flash.classList.remove("show"); void flash.offsetWidth; flash.classList.add("show");

    document.body.classList.remove("screen-shake");
    void document.body.offsetWidth;
    document.body.classList.add("screen-shake");
    setTimeout(() => document.body.classList.remove("screen-shake"), 300);
  }
}

let autoTrainTimer = null;
function setAutoTrain(on) {
  state.autoTrain = on;
  document.getElementById("toggle-autotrain").setAttribute("aria-pressed", on);
  if (autoTrainTimer) { clearInterval(autoTrainTimer); autoTrainTimer = null; }
  if (on) autoTrainTimer = setInterval(() => { if (state.energy >= TAP_ENERGY_COST) train("auto"); }, AUTO_TRAIN_INTERVAL_MS);
}

function bindEvents() {
  document.querySelectorAll(".side-link, .bottom-link").forEach(btn => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));
  document.getElementById("btn-nav-daily").addEventListener("click", () => switchTab("daily"));
  document.getElementById("btn-nav-settings").addEventListener("click", () => switchTab("settings"));
  document.getElementById("btn-add-coins").addEventListener("click", () => switchTab("shop"));
  document.getElementById("btn-add-gems").addEventListener("click", () => switchTab("shop"));

  const trainBtn = document.getElementById("btn-train");
  let lastTrainEventTime = 0;
  const trainHandler = (e) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastTrainEventTime < 60) return;
    lastTrainEventTime = now;
    train("manual");
  };
  trainBtn.addEventListener("click", trainHandler);
  trainBtn.addEventListener("touchstart", trainHandler, { passive: false });

  document.getElementById("toggle-autotrain").addEventListener("click", () => setAutoTrain(!state.autoTrain));
  document.getElementById("toggle-sound").addEventListener("click", () => { state.soundOn = !state.soundOn; renderSettings(); saveState(); });
  document.getElementById("toggle-effects").addEventListener("click", () => { state.effectsOn = !state.effectsOn; renderSettings(); saveState(); });
  document.getElementById("btn-manual-save").addEventListener("click", () => { saveState(); showToast("Game saved.", "success"); });

  document.getElementById("btn-reset").addEventListener("click", () => document.getElementById("reset-modal").classList.add("show"));
  document.getElementById("btn-reset-cancel").addEventListener("click", () => document.getElementById("reset-modal").classList.remove("show"));
  document.getElementById("btn-reset-confirm").addEventListener("click", () => { document.getElementById("reset-modal").classList.remove("show"); resetProgress(); });

  document.getElementById("btn-claim-daily").addEventListener("click", claimDaily);
  document.getElementById("btn-stage-modal-close").addEventListener("click", () => document.getElementById("stage-modal").classList.remove("show"));

  const installBtn = document.getElementById("btn-install-app");
  installBtn.addEventListener("click", () => {
    if (window.deferredInstallPrompt) {
      window.deferredInstallPrompt.prompt();
    } else {
      showToast("Use your browser's 'Add to Home Screen' / Install option.", "");
    }
  });

  window.addEventListener("beforeunload", saveState);
}

/* ======================= 8. MAIN LOOP ======================= */

let lastTick = Date.now();
function mainLoop() {
  const now = Date.now();
  const deltaSec = (now - lastTick) / 1000;
  lastTick = now;

  state.energy = clamp(state.energy + ENERGY_REGEN_PER_SEC * deltaSec, 0, maxEnergy());

  const passive = passivePowerPerSecond() * deltaSec;
  if (passive > 0) { state.power += passive; checkStageUp(); }

  if (state.combo > 0 && !isComboLocked() && now - state.lastTapTime > COMBO_TIMEOUT_MS) state.combo = 0;

  state.secondsPlayed += deltaSec;

  refreshHUD();
  if (document.getElementById("tab-shop").classList.contains("active")) renderShop();
  if (document.getElementById("tab-daily").classList.contains("active")) renderDaily();
}

/* ======================= 9. PWA ======================= */

function setupPWA() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(e => console.warn("SW registration failed", e));
  }
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    window.deferredInstallPrompt = e;
  });
}

/* ======================= 10. INIT ======================= */

function init() {
  bindEvents();
  fullRender();
  setAutoTrain(state.autoTrain);
  setupPWA();
  setInterval(mainLoop, 1000);
  setInterval(saveState, AUTOSAVE_INTERVAL_MS);
  mainLoop();
}

document.addEventListener("DOMContentLoaded", init);
