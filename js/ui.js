/**
 * ui.js — Render draft table, player picker, squad sidebar
 */

const UI = (() => {
  let _state = null; // set by app.js

  // Active picker context
  let pickerCtx = null; // { md, squadId, pos }

  function init(state) {
    _state = state;
    _bindTabs();
    _bindFilters();
    _bindBudget();
    _bindClearSquad();
    _bindPickerClose();
  }

  // ── Tabs ──────────────────────────────────────────────
  function _bindTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        _state.activeMD = parseInt(btn.dataset.md);
        renderAll();
      });
    });
  }

  function _updateTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.md) === _state.activeMD);
    });
  }

  // ── Filters ───────────────────────────────────────────
  function _bindFilters() {
    document.getElementById('filter-group').addEventListener('change', renderTable);
    document.getElementById('filter-position').addEventListener('change', renderTable);
    document.getElementById('filter-name').addEventListener('input', renderTable);
  }

  function _bindBudget() {
    document.getElementById('budget-input').addEventListener('change', e => {
      const val = parseFloat(e.target.value) || 100;
      Draft.setBudget(_state.activeMD, val);
      Draft.save();
      _updateBudgetBar();
    });
  }

  function _bindClearSquad() {
    document.getElementById('btn-clear-squad').addEventListener('click', () => {
      if (confirm(`MD${_state.activeMD} picks အားလုံး ဖျက်မလား?`)) {
        Draft.clearMD(_state.activeMD);
        Draft.save();
        renderAll();
      }
    });
  }

  // ── Budget Bar ────────────────────────────────────────
  function _updateBudgetBar() {
    const md = _state.activeMD;
    const spent = Draft.getSpent(md);
    const budget = Draft.getBudget(md);
    const total = Draft.getTotalPicks(md);

    document.getElementById('budget-input').value = budget;

    const spentEl = document.getElementById('budget-spent');
    spentEl.textContent = `${spent.toFixed(1)} / ${budget}`;
    spentEl.classList.toggle('over', spent > budget);

    document.getElementById('squad-count').textContent = `${total} / 15 players`;
  }

  // ── Table ─────────────────────────────────────────────
  function renderTable() {
    const md = _state.activeMD;
    const groupFilter = document.getElementById('filter-group').value;
    const posFilter = document.getElementById('filter-position').value;
    const nameFilter = document.getElementById('filter-name').value.toLowerCase().trim();

    const tbody = document.getElementById('draft-tbody');
    tbody.innerHTML = '';

    // Get match dates for this MD (squadId -> date string)
    const matchDates = _getMatchDates(md);

    let squads = [..._state.squads].sort((a, b) => {
      if (a.group < b.group) return -1;
      if (a.group > b.group) return 1;
      if (a.name < b.name) return -1;
      return 1;
    });

    if (groupFilter) {
      squads = squads.filter(s => s.group.toUpperCase() === groupFilter.toUpperCase());
    }

    let lastGroup = null;

    for (const squad of squads) {
      const players = _state.playersBySquad[squad.id] || [];

      // Position filter — check if squad has players in that position
      const positions = posFilter ? [posFilter] : ['GK', 'DEF', 'MID', 'FWD'];

      // Name filter — check any player in squad
      if (nameFilter) {
        const hasMatch = players.some(p => {
          const full = (p.knownName || `${p.firstName} ${p.lastName}`).toLowerCase();
          return full.includes(nameFilter);
        });
        if (!hasMatch) continue;
      }

      // Group header separator row
      if (squad.group !== lastGroup) {
        lastGroup = squad.group;
        const headerRow = document.createElement('tr');
        headerRow.className = 'group-header-row';
        const headerTd = document.createElement('td');
        headerTd.colSpan = 7;
        headerTd.textContent = `GROUP ${squad.group.toUpperCase()}`;
        headerRow.appendChild(headerTd);
        tbody.appendChild(headerRow);
      }

      const tr = document.createElement('tr');
      tr.dataset.group = squad.group.toLowerCase();

      // GROUP
      const tdGroup = document.createElement('td');
      tdGroup.className = 'group-badge';
      tdGroup.textContent = squad.group.toUpperCase();
      tr.appendChild(tdGroup);

      // TEAM (with flag)
      const tdTeam = document.createElement('td');
      tdTeam.className = 'team-name';
      const teamCell = document.createElement('div');
      teamCell.className = 'team-cell';
      const flagUrl = getFlagUrl(squad.id);
      if (flagUrl) {
        const img = document.createElement('img');
        img.className = 'team-flag';
        img.src = flagUrl;
        img.alt = squad.abbr;
        img.loading = 'lazy';
        img.onerror = () => { img.style.display = 'none'; };
        teamCell.appendChild(img);
      }
      const nameSpan = document.createElement('span');
      nameSpan.textContent = squad.name;
      teamCell.appendChild(nameSpan);
      tdTeam.appendChild(teamCell);
      tr.appendChild(tdTeam);

      // MD Date
      const tdDate = document.createElement('td');
      tdDate.className = 'md-date';
      const matchDate = matchDates[squad.id];
      tdDate.textContent = matchDate ? _fmtDate(matchDate) : '—';
      tr.appendChild(tdDate);

      // Position columns
      for (const pos of ['GK', 'DEF', 'MID', 'FWD']) {
        const tdPos = document.createElement('td');
        if (!posFilter || posFilter === pos) {
          tdPos.className = 'pos-cell';
          const slots = Draft.getSlots(md, squad.id, pos);
          const limit = Draft.SQUAD_LIMITS[pos];
          const posPlayers = players.filter(p => p.position === pos);

          // Render filled slots
          const cell = document.createElement('div');
          cell.className = 'pos-cell';

          for (let i = 0; i < limit; i++) {
            const slot = document.createElement('div');
            slot.className = 'player-slot' + (slots[i] ? ' filled' : '');

            const num = document.createElement('span');
            num.className = 'slot-num';
            num.textContent = i + 1;

            const name = document.createElement('span');
            name.className = 'slot-name';

            const price = document.createElement('span');
            price.className = 'slot-price';

            if (slots[i]) {
              name.textContent = _shortName(slots[i].name);
              price.textContent = `${slots[i].price.toFixed(1)}`;

              const rm = document.createElement('span');
              rm.className = 'slot-remove';
              rm.textContent = '✕';
              rm.title = 'Remove';
              rm.dataset.md = md;
              rm.dataset.squad = squad.id;
              rm.dataset.pos = pos;
              rm.dataset.idx = i;
              rm.addEventListener('click', e => {
                e.stopPropagation();
                Draft.removePick(md, squad.id, pos, parseInt(rm.dataset.idx));
                Draft.save();
                renderAll();
              });

              slot.appendChild(num);
              slot.appendChild(name);
              slot.appendChild(price);
              slot.appendChild(rm);
            } else {
              name.textContent = `+ Add ${pos}`;
              slot.appendChild(num);
              slot.appendChild(name);

              // Only clickable if there are players in this position for this squad
              if (posPlayers.length > 0) {
                slot.addEventListener('click', () => {
                  openPicker(md, squad, pos, nameFilter);
                });
              } else {
                slot.style.opacity = '0.3';
                slot.style.cursor = 'default';
              }
            }

            cell.appendChild(slot);
          }
          tdPos.appendChild(cell);
        }
        tr.appendChild(tdPos);
      }

      tbody.appendChild(tr);
    }
  }

  function _getMatchDates(md) {
    const round = _state.rounds[md - 1];
    const dates = {};
    if (!round) return dates;
    for (const t of round.tournaments) {
      // Use earliest match date per squad
      if (!dates[t.homeSquadId] || t.date < dates[t.homeSquadId]) dates[t.homeSquadId] = t.date;
      if (!dates[t.awaySquadId] || t.date < dates[t.awaySquadId]) dates[t.awaySquadId] = t.date;
    }
    return dates;
  }

  function _fmtDate(iso) {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }

  function _shortName(name) {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length <= 1) return name;
    return parts[0][0] + '. ' + parts.slice(1).join(' ');
  }

  // ── Player Picker ─────────────────────────────────────
  function openPicker(md, squad, pos, nameHint) {
    pickerCtx = { md, squadId: squad.id, pos };

    document.getElementById('picker-title').textContent = `${squad.name} — ${pos}`;
    document.getElementById('picker-search').value = nameHint || '';
    document.getElementById('picker-panel').classList.add('open');

    _renderPickerList('');
    document.getElementById('picker-search').focus();
  }

  function _bindPickerClose() {
    document.getElementById('picker-close').addEventListener('click', closePicker);
    document.getElementById('picker-search').addEventListener('input', e => {
      _renderPickerList(e.target.value.toLowerCase());
    });
  }

  function closePicker() {
    document.getElementById('picker-panel').classList.remove('open');
    pickerCtx = null;
  }

  function _renderPickerList(search) {
    if (!pickerCtx) return;
    const { md, squadId, pos } = pickerCtx;
    const list = document.getElementById('picker-list');
    list.innerHTML = '';

    let players = (_state.playersBySquad[squadId] || []).filter(p => p.position === pos && p.status === 'playing');

    if (search) {
      players = players.filter(p => {
        const full = (p.knownName || `${p.firstName} ${p.lastName}`).toLowerCase();
        return full.includes(search);
      });
    }

    // Sort by price desc
    players.sort((a, b) => b.price - a.price);

    if (players.length === 0) {
      list.innerHTML = '<div style="padding:14px;color:#484f58;font-size:0.8rem;">No players found</div>';
      return;
    }

    for (const p of players) {
      const alreadyPicked = Draft.isAlreadyPicked(md, p.id);
      const div = document.createElement('div');
      div.className = 'picker-player' + (alreadyPicked ? ' already-picked' : '');

      const name = document.createElement('span');
      name.className = 'pp-name';
      name.textContent = p.knownName || `${p.firstName} ${p.lastName}`;

      const price = document.createElement('span');
      price.className = 'pp-price';
      price.textContent = `${p.price.toFixed(1)}`;

      const pct = document.createElement('span');
      pct.className = 'pp-pct';
      pct.textContent = `${p.percentSelected}%`;

      div.appendChild(name);
      div.appendChild(pct);
      div.appendChild(price);

      if (!alreadyPicked) {
        div.addEventListener('click', () => {
          const result = Draft.addPick(md, squadId, pos, p);
          if (result.ok) {
            Draft.save();
            closePicker();
            renderAll();
          } else {
            alert(result.error);
          }
        });
      }

      list.appendChild(div);
    }
  }

  // ── Squad Sidebar ─────────────────────────────────────
  function renderSidebar() {
    const md = _state.activeMD;
    const summary = Draft.getSquadSummary(md);
    const sidebar = document.getElementById('squad-sidebar-content');
    sidebar.innerHTML = '';

    for (const pos of ['GK', 'DEF', 'MID', 'FWD']) {
      const section = document.createElement('div');
      section.className = 'sq-section';

      const title = document.createElement('div');
      title.className = 'sq-section-title';
      title.textContent = `${pos} (${summary[pos].length}/${Draft.SQUAD_LIMITS[pos]})`;
      section.appendChild(title);

      if (summary[pos].length === 0) {
        const empty = document.createElement('div');
        empty.className = 'sq-empty';
        empty.textContent = 'Empty';
        section.appendChild(empty);
      } else {
        for (const p of summary[pos]) {
          const row = document.createElement('div');
          row.className = 'sq-player';

          const n = document.createElement('span');
          n.className = 'sq-player-name';
          n.textContent = p.name;
          n.title = p.name;

          const pr = document.createElement('span');
          pr.className = 'sq-player-price';
          pr.textContent = p.price.toFixed(1);

          const rm = document.createElement('button');
          rm.className = 'sq-player-remove';
          rm.textContent = '✕';
          rm.title = 'Remove';
          rm.addEventListener('click', () => {
            const picksData = Draft.getAllPicksWithLocation(md);
            const found = picksData.find(x => x.id === p.id && x.pos === pos);
            if (found) {
              Draft.removePick(md, found.squadId, found.pos, found.index);
              Draft.save();
              renderAll();
            }
          });

          row.appendChild(n);
          row.appendChild(pr);
          row.appendChild(rm);
          section.appendChild(row);
        }
      }

      sidebar.appendChild(section);
    }
  }

  // ── Render All ────────────────────────────────────────
  function renderAll() {
    _updateTabs();
    _updateBudgetBar();
    renderTable();
    renderSidebar();
  }

  return { init, renderAll, renderTable, openPicker };
})();
