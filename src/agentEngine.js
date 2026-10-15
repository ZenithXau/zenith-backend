const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/state.json');

let state = {
  cryptoAgents: [],
  forexAgents: [],
  promotedAgents: [],
  journalEntries: [],
  liveTrades: [],
  openTrades: [],
  todayTrades: [],
  lastResetDate: null,
  totalTradeCount: 0,
  recentMemes: [],
  goodWallets: [
    { address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", winRate: 72, name: "SmartTrader1" },
    { address: "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1", winRate: 68, name: "AlphaCaller" },
    { address: "H8sMJSCQxfKiFTCfDR3DUMLPwcRbM61LGFJ8N4dK3WjS", winRate: 65, name: "PumpHunter" }
  ]
};

function loadState() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      state = { ...state, ...data };
    }
  } catch (e) {}
  ensureAgents();
}

function saveState() {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
  } catch (e) {}
}

function getTodayKey() {
  const d = new Date();
  return d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate();
}

function getDateKey(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate();
}

function checkDailyReset() {
  const today = getTodayKey();
  if (state.lastResetDate !== today) {
    state.todayTrades = [];
    state.lastResetDate = today;
  }
}

function cleanupOldTrades() {
  const cutoff = getDateKey(3);
  state.liveTrades = state.liveTrades.filter(t => {
    if (!t.dateKey) return true;
    return t.dateKey >= cutoff;
  });
  if (state.liveTrades.length > 10000) {
    state.liveTrades = state.liveTrades.slice(0, 10000);
  }
}

function ensureAgents() {
  if (!state.cryptoAgents || !state.cryptoAgents.length) {
    state.cryptoAgents = Array.from({length:5}, (_,i) => ({
      id: "C"+(i+1), role: "Trainee", progress: 15 + Math.random()*20, mistakes: 0, wins: 0
    }));
  }
  if (!state.forexAgents || !state.forexAgents.length) {
    state.forexAgents = Array.from({length:10}, (_,i) => ({
      id: "F"+(i+1), role: "Trainee", progress: 10 + Math.random()*18, mistakes: 0, wins: 0
    }));
  }
  if (!state.promotedAgents) state.promotedAgents = [];
  if (!state.journalEntries) state.journalEntries = [];
  if (!state.liveTrades) state.liveTrades = [];
  if (!state.openTrades) state.openTrades = [];
  if (!state.todayTrades) state.todayTrades = [];
  if (!state.totalTradeCount) state.totalTradeCount = state.liveTrades.length || 0;
  if (!state.recentMemes) state.recentMemes = [];
  if (!state.goodWallets) state.goodWallets = [];
}

const cryptoRoles = ["Pattern Learner", "News Scout", "MEME Scanner", "Volume Analyst"];
const forexRoles = ["XAU Learner", "XAG Specialist", "US30 Analyst", "NASDAQ Trader", "Daily Setup", "Risk Student"];
const cryptoTopics = ["Volume-Analyse SOL", "News-Impact ETH", "Liquidity Sweep BTC", "Orderblock ETH", "MEME-Momentum Scanner"];
const forexTopics = ["Riskmanagement auf XAUUSD", "Session-Struktur XAU", "US30 Session Bias", "NASDAQ Momentum", "Silver Correlation mit Gold"];

function addLog(text) {
  const entry = `[${new Date().toLocaleTimeString()}] ${text}`;
  state.journalEntries.unshift(entry);
  if (state.journalEntries.length > 120) state.journalEntries.pop();
}

async function fetchPumpFunTokens() {
  try {
    const res = await fetch('https://frontend-api.pump.fun/coins?offset=0&limit=30&sort=created_timestamp&order=DESC&includeNsfw=false');
    const data = await res.json();
    if (Array.isArray(data)) {
      state.recentMemes = data.slice(0, 15).map(t => ({
        name: t.name || t.symbol || 'Unknown',
        symbol: t.symbol || 'MEME',
        ca: t.mint || 'unknown',
        hype: Math.floor(Math.random() * 100),
        walletCopies: Math.floor(Math.random() * 8)
      }));
    }
  } catch (e) {}
}

function getBestMeme() {
  if (!state.recentMemes.length) return null;
  const scored = state.recentMemes.map(m => ({
    ...m,
    score: (m.hype || 0) + (m.walletCopies || 0) * 8
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0];
}

function tick() {
  checkDailyReset();
  ensureAgents();
  cleanupOldTrades();

  if (Math.random() > 0.65) fetchPumpFunTokens();

  state.cryptoAgents.forEach(a => {
    a.progress = Math.min(100, a.progress + Math.random() * 0.3);
    if (a.progress > 93 && a.role === "Trainee") {
      a.role = cryptoRoles[Math.floor(Math.random() * cryptoRoles.length)];
      const topic = cryptoTopics[Math.floor(Math.random() * cryptoTopics.length)];
      addLog(`${a.id} spezialisiert → ${a.role} (${topic})`);
    }
    if (a.progress >= 98 && Math.random() > 0.95) {
      addLog(`${a.id} ist bereit und fragt nach Trader-Status`);
    }
  });

  state.forexAgents.forEach(a => {
    const weekend = [0,6].includes(new Date().getDay());
    a.progress = Math.min(100, a.progress + (weekend ? 0.06 : 0.18) + Math.random()*0.12);
    if (a.progress > 94 && a.role === "Trainee") {
      a.role = forexRoles[Math.floor(Math.random() * forexRoles.length)];
      const topic = forexTopics[Math.floor(Math.random() * forexTopics.length)];
      addLog(`${a.id} spezialisiert → ${a.role} (${topic})`);
    }
    if (a.progress >= 98 && Math.random() > 0.95) {
      addLog(`${a.id} ist bereit und fragt nach Trader-Status`);
    }
  });

  if (Math.random() > 0.5) {
    const mainIds = ["Risk","MEME","BTC","ALT","Position","FOREX", ...state.promotedAgents.map(a => a.id)];
    const agent = mainIds[Math.floor(Math.random() * mainIds.length)];
    let coin = "BTC";
    let meme = null;
    let ca = null;
    let reason = "";

    if (agent.startsWith("F") || agent === "FOREX") {
      coin = ["XAU","XAG","US30","NASDAQ"][Math.floor(Math.random()*4)];
    } else if (agent === "BTC") coin = "BTC";
    else if (agent === "ALT") coin = Math.random() > 0.5 ? "SOL" : "ETH";
    else if (agent === "MEME") {
      coin = "MEME";
      const best = getBestMeme();
      if (best && best.score > 40) {
        meme = best.name;
        ca = best.ca;
        reason = best.walletCopies > 3 ? "Wallet-Copy" : "High Hype";
      } else {
        const m = state.recentMemes[Math.floor(Math.random() * Math.max(1, state.recentMemes.length))] || { name: "BONK", ca: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" };
        meme = m.name;
        ca = m.ca;
        reason = "Random";
      }
    } else if (agent.startsWith("C")) {
      coin = ["BTC","SOL","ETH"][Math.floor(Math.random()*3)];
    } else if (agent === "Risk") {
      coin = ["BTC","SOL","ETH","XAU"][Math.floor(Math.random()*4)];
    } else coin = "BTC";

    const entry = (Math.random() * 100 + 50).toFixed(2);
    const pnl = (Math.random()*2.2 - 0.7).toFixed(2);
    const isLong = Math.random() > 0.5;
    const trade = {
      time: new Date().toLocaleTimeString(),
      dateKey: getTodayKey(),
      coin, side: isLong ? "LONG" : "SHORT", agent,
      entry, tp: (parseFloat(entry)*1.01).toFixed(2), sl: (parseFloat(entry)*0.99).toFixed(2),
      exit: (parseFloat(entry)*(1+parseFloat(pnl)/100)).toFixed(2),
      pnl: parseFloat(pnl),
      meme, ca
    };

    if (Math.random() > 0.5) {
      state.openTrades.unshift({...trade, exit: null});
      if (state.openTrades.length > 15) state.openTrades.pop();
    } else {
      state.liveTrades.unshift(trade);
      state.todayTrades.unshift(trade);
      state.totalTradeCount++;
      if (state.todayTrades.length > 2000) state.todayTrades.pop();
    }

    const memeInfo = meme ? ` (${meme}${reason ? " · " + reason : ""})` : '';
    addLog(`${agent} Trade ${coin}${memeInfo} ${trade.side} @ ${trade.entry} · PnL ${pnl}%`);
  }

  saveState();
}

function startEngine() {
  loadState();
  setInterval(tick, 8000);
  fetchPumpFunTokens();
  console.log("Agent Engine gestartet");
}

function getState() { return state; }

function promoteAgent(id) {
  let ag = state.cryptoAgents.find(a => a.id === id) || state.forexAgents.find(a => a.id === id);
  if (!ag) return false;
  state.cryptoAgents = state.cryptoAgents.filter(a => a.id !== id);
  state.forexAgents = state.forexAgents.filter(a => a.id !== id);
  if (!state.promotedAgents.find(a => a.id === id)) state.promotedAgents.push(ag);
  addLog(`${id} als Trader übernommen`);
  saveState();
  return true;
}

function demoteAgent(id) {
  const ag = state.promotedAgents.find(a => a.id === id);
  if (!ag) return false;
  ag.progress = 85;
  ag.role = "Trainee";
  state.promotedAgents = state.promotedAgents.filter(a => a.id !== id);
  state.cryptoAgents = state.cryptoAgents.filter(a => a.id !== id);
  state.forexAgents = state.forexAgents.filter(a => a.id !== id);
  if (id.startsWith("C")) state.cryptoAgents.push(ag);
  else state.forexAgents.push(ag);
  addLog(`${id} zurück in Academy`);
  saveState();
  return true;
}

module.exports = { startEngine, getState, promoteAgent, demoteAgent };
