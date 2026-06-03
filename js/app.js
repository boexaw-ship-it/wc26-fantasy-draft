/**
 * app.js — Bootstrap: load data, init state, wire up UI
 */

const App = (() => {
  const state = {
    activeMD: 1,
    squads: [],
    players: [],
    rounds: [],
    playersBySquad: {}, // squadId -> [playerObj, ...]
  };

  async function _loadJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    return res.json();
  }

  async function init() {
    try {
      // Load all data in parallel
      const [squads, players, rounds] = await Promise.all([
        _loadJSON('data/squads.json'),
        _loadJSON('data/players.json'),
        _loadJSON('data/rounds.json'),
      ]);

      state.squads = squads;
      state.players = players;
      state.rounds = rounds;

      // Index players by squadId for fast lookup
      for (const p of players) {
        if (!state.playersBySquad[p.squadId]) state.playersBySquad[p.squadId] = [];
        state.playersBySquad[p.squadId].push(p);
      }

      // Populate group filter dropdown
      const groups = [...new Set(squads.map(s => s.group.toUpperCase()))].sort();
      const groupSelect = document.getElementById('filter-group');
      for (const g of groups) {
        const opt = document.createElement('option');
        opt.value = g;
        opt.textContent = `Grp ${g}`;
        groupSelect.appendChild(opt);
      }

      // Load saved draft state
      Draft.load();

      // Init UI
      UI.init(state);
      UI.renderAll();

    } catch (err) {
      console.error('App init error:', err);
      document.getElementById('draft-tbody').innerHTML =
        `<tr><td colspan="7" style="padding:20px;color:#f85149;">Error loading data: ${err.message}</td></tr>`;
    }
  }

  return { init, state };
})();

document.addEventListener('DOMContentLoaded', App.init);
