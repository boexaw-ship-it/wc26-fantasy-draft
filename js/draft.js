/**
 * draft.js — Squad state, budget, slot management
 */

const SQUAD_LIMITS = { GK: 2, DEF: 5, MID: 5, FWD: 3 };
const TOTAL_SLOTS = Object.values(SQUAD_LIMITS).reduce((a, b) => a + b, 0); // 15

const Draft = (() => {
  // State: picks[md][squadId][position] = [{ playerId, playerObj }, ...]
  let picks = { 1: {}, 2: {}, 3: {} };
  let budget = { 1: 100, 2: 100, 3: 100 };

  function _ensureSquad(md, squadId) {
    if (!picks[md][squadId]) {
      picks[md][squadId] = { GK: [], DEF: [], MID: [], FWD: [] };
    }
  }

  // Get all picks with location info (squadId, pos, index) for remove-by-id
  function getAllPicksWithLocation(md) {
    const all = [];
    for (const squadId in picks[md]) {
      for (const pos in picks[md][squadId]) {
        picks[md][squadId][pos].forEach((p, index) => {
          all.push({ ...p, squadId: parseInt(squadId), pos, index });
        });
      }
    }
    return all;
  }

  // Get all picked players for an MD (flat list)
  function getAllPicks(md) {
    const all = [];
    for (const squadId in picks[md]) {
      for (const pos in picks[md][squadId]) {
        for (const p of picks[md][squadId][pos]) {
          all.push(p);
        }
      }
    }
    return all;
  }

  // Total spent for an MD
  function getSpent(md) {
    return getAllPicks(md).reduce((sum, p) => sum + p.price, 0);
  }

  // Count total picks for an MD
  function getTotalPicks(md) {
    return getAllPicks(md).length;
  }

  // Get picks for a specific squad+position
  function getSlots(md, squadId, pos) {
    _ensureSquad(md, squadId);
    return picks[md][squadId][pos];
  }

  // Check if player already picked in this MD
  function isAlreadyPicked(md, playerId) {
    return getAllPicks(md).some(p => p.id === playerId);
  }

  // Add a player to a slot
  // Returns { ok, error }
  function addPick(md, squadId, pos, playerObj) {
    _ensureSquad(md, squadId);
    const slots = picks[md][squadId][pos];
    const limit = SQUAD_LIMITS[pos];

    if (slots.length >= limit) {
      return { ok: false, error: `${pos} slot full (max ${limit})` };
    }
    if (isAlreadyPicked(md, playerObj.id)) {
      return { ok: false, error: 'Player already in squad' };
    }
    if (getTotalPicks(md) >= TOTAL_SLOTS) {
      return { ok: false, error: 'Squad full (15/15)' };
    }

    const newSpent = getSpent(md) + playerObj.price;
    if (newSpent > budget[md]) {
      return { ok: false, error: `Over budget (${newSpent.toFixed(1)} > ${budget[md]})` };
    }

    slots.push({ id: playerObj.id, name: playerObj.knownName || `${playerObj.firstName} ${playerObj.lastName}`, price: playerObj.price });
    return { ok: true };
  }

  // Remove a player by index
  function removePick(md, squadId, pos, index) {
    _ensureSquad(md, squadId);
    picks[md][squadId][pos].splice(index, 1);
  }

  // Clear all picks for an MD
  function clearMD(md) {
    picks[md] = {};
  }

  // Get/set budget
  function getBudget(md) { return budget[md]; }
  function setBudget(md, val) { budget[md] = val; }

  // Serialize/deserialize for localStorage
  function save() {
    try {
      localStorage.setItem('wc26_draft_picks', JSON.stringify(picks));
      localStorage.setItem('wc26_draft_budget', JSON.stringify(budget));
    } catch (e) {}
  }

  function load() {
    try {
      const p = localStorage.getItem('wc26_draft_picks');
      const b = localStorage.getItem('wc26_draft_budget');
      if (p) picks = JSON.parse(p);
      if (b) budget = JSON.parse(b);
    } catch (e) {}
  }

  // Build squad summary grouped by position
  function getSquadSummary(md) {
    const all = getAllPicks(md);
    const grouped = { GK: [], DEF: [], MID: [], FWD: [] };
    for (const squadId in picks[md]) {
      for (const pos in picks[md][squadId]) {
        for (const p of picks[md][squadId][pos]) {
          grouped[pos].push(p);
        }
      }
    }
    return grouped;
  }

  return {
    SQUAD_LIMITS,
    getAllPicksWithLocation,
    TOTAL_SLOTS,
    getSlots,
    getAllPicks,
    getSpent,
    getTotalPicks,
    isAlreadyPicked,
    addPick,
    removePick,
    clearMD,
    getBudget,
    setBudget,
    save,
    load,
    getSquadSummary,
  };
})();
