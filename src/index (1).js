const express = require('express');
const cors = require('cors');
const { startEngine, getState, promoteAgent, demoteAgent } = require('./agentEngine');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

startEngine();

app.get('/api/state', (req, res) => {
  res.json(getState());
});

app.post('/api/promote', (req, res) => {
  const { id } = req.body;
  const ok = promoteAgent(id);
  res.json({ success: ok });
});

app.post('/api/demote', (req, res) => {
  const { id } = req.body;
  const ok = demoteAgent(id);
  res.json({ success: ok });
});

app.get('/api/status', (req, res) => {
  const s = getState();
  res.json({
    status: 'online',
    mode: 'backend',
    openPositions: s.openTrades.length,
    todayTrades: s.todayTrades.length,
    totalTrades: s.liveTrades.length
  });
});

app.listen(PORT, () => {
  console.log(`Zenith Backend läuft auf Port ${PORT}`);
});
