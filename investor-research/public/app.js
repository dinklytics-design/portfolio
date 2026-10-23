// Don't Waste Your Money — Client-side only.
// No live prices, no account connection, no auto-trading. Educational research only.
(function(){
  'use strict';

  // ---------- Fallback 9-pick Aggressive base — used ONLY if investment data fails to load ----------
  var FALLBACK_PICKS = [
    { id:'nvda', ticker:'NVDA', name:'NVIDIA', type:'stock', bucket:'core', bucketLabel:'Core', basePct:20,
      thesis:'Leading AI accelerators plus software and networking that customers build around.',
      risk:'Expectations already very high; any slowdown hits hard.',
      watch:'Data-center revenue, Blackwell / Rubin mix, margins.',
      earnings:'Nov 17, 2026', earningsStatus:'confirmed', expenseRatio:null, search:'nvda nvidia core ai accelerator gpu cuda',
      bull:['Leading share of AI accelerators.','CUDA + networking raise switching costs.','Hyperscaler AI spending still expanding.'],
      bear:['Valuation leaves little room for a miss.','Customers building their own custom chips.','Export controls and geopolitics can disrupt demand.'],
      keyMetric:'Data-center revenue growth + gross margin trajectory',
      whatWouldChangeMind:'Two consecutive quarters of data-center deceleration, major hyperscaler capex cuts, or loss of share to custom ASICs at scale.' },
    { id:'avgo', ticker:'AVGO', name:'Broadcom', type:'stock', bucket:'core', bucketLabel:'Core', basePct:15,
      thesis:'Custom AI chips for hyperscalers plus networking — diversified beyond one product.',
      risk:'Customer concentration; hyperscaler spending cycles.',
      watch:'AI chip revenue, FY27 AI outlook, custom-chip wins.',
      earnings:'Dec 9, 2026', earningsStatus:'estimated', expenseRatio:null, search:'avgo broadcom core custom chips asic networking',
      bull:['Custom-chip partnerships with large hyperscalers.','Networking demand rises with larger AI clusters.','Diversified revenue beyond a single AI product.'],
      bear:['Concentration in a few large customers.','Custom-chip cycles can be lumpy.','Integration and valuation risk if AI spend slows.'],
      keyMetric:'AI semiconductor revenue and FY27 AI outlook on earnings',
      whatWouldChangeMind:'Loss of a major custom-chip program, or AI revenue guide cut with no offsetting networking strength.' },
    { id:'tsm', ticker:'TSM', name:'Taiwan Semiconductor', type:'stock', bucket:'core', bucketLabel:'Core', basePct:10,
      thesis:'The foundry that builds AI chips for NVDA, AMD, and others — picks-and-shovels.',
      risk:'Geopolitical / Taiwan concentration; capex cycles.',
      watch:'N2 ramp, CoWoS capacity, 2027 capex.',
      earnings:'Reported Oct 15, 2026 · Next est. Jan 14, 2027', earningsStatus:'estimated', expenseRatio:null, search:'tsm taiwan semiconductor foundry core',
      bull:['Dominant leading-edge foundry scale and yield.','HPC now the majority of wafer revenue.','Long visibility from customer roadmaps and CoWoS capacity.'],
      bear:['Geopolitical risk around Taiwan.','Very large capex to stay at the leading edge.','Customer inventory corrections can hit utilization.'],
      keyMetric:'HPC revenue share, N2 ramp, and 2027 capex guidance',
      whatWouldChangeMind:'Sustained utilization drop, major customer shifting volume away, or a sharp geopolitical escalation.' },
    { id:'msft', ticker:'MSFT or GOOGL', name:'Microsoft or Alphabet (choose one)', type:'stock', bucket:'core', bucketLabel:'Core', basePct:5, chooseOne:true,
      thesis:'Choose one cloud + AI monetizer: Azure + Copilot, or Gemini + Cloud + TPUs.',
      risk:'Heavy capex may not convert to profit fast enough.',
      watch:'Cloud growth, AI revenue, capex discipline.',
      earnings:'Oct 28, 2026', earningsStatus:'estimated', expenseRatio:null, search:'msft microsoft googl google alphabet cloud azure gemini core',
      bull:['Cloud scale converts AI demand into recurring revenue.','Distribution: existing enterprise / consumer reach.','Balance sheets can fund large AI capex.'],
      bear:['Capex is massive and payoff timing is uncertain.','Search disruption (GOOGL) / Copilot monetization (MSFT).','Regulatory and antitrust overhang.'],
      keyMetric:'Cloud revenue growth (Azure / Google Cloud) plus AI contribution disclosure',
      whatWouldChangeMind:'Cloud growth stalls while capex keeps rising, or AI monetization clearly fails after several quarters.' },
    { id:'mu', ticker:'MU', name:'Micron', type:'stock', bucket:'enabler', bucketLabel:'Enabler', basePct:10,
      thesis:'High-bandwidth memory is essential for AI training — demand has outrun supply.',
      risk:'Memory is cyclical; pricing can turn fast.',
      watch:'HBM pricing / bookings, DRAM/NAND pricing, margins.',
      earnings:'Dec 23, 2026', earningsStatus:'estimated', expenseRatio:null, search:'mu micron memory hbm enabler',
      bull:['HBM demand tied to AI accelerator shipments.','Tight supply has supported pricing.','Memory content per AI system is rising.'],
      bear:['Memory is famously cyclical — pricing can reverse.','Customers can over-order, then pause.','Large capex to add HBM capacity.'],
      keyMetric:'HBM revenue, bookings, and DRAM/NAND pricing commentary',
      whatWouldChangeMind:'HBM price collapse, inventory build, or a sharp guide-down on memory demand.' },
    { id:'asml', ticker:'ASML', name:'ASML', type:'stock', bucket:'enabler', bucketLabel:'Enabler', basePct:10,
      thesis:'EUV lithography machines print advanced chips — no ASML, no leading GPUs.',
      risk:'Expensive valuation; export controls and order swings.',
      watch:'Bookings for EUV / High-NA, 2026 outlook, backlog.',
      earnings:'Reported Oct 14, 2026 · Next Jan 27, 2027', earningsStatus:'confirmed', expenseRatio:null, search:'asml lithography euv enabler',
      bull:['Monopoly-like position in EUV.','Multi-year demand visibility from foundry customers.','High-NA EUV extends the lead for next nodes.'],
      bear:['High valuation multiple leaves downside if growth stalls.','Export restrictions can limit shipments.','Order timing is lumpy and can swing quarters.'],
      keyMetric:'New bookings (especially EUV / High-NA) and backlog',
      whatWouldChangeMind:'Sustained booking declines, major export restriction expansion, or foundry customers delaying EUV orders.' },
    { id:'vrt', ticker:'VRT or APH', name:'Vertiv or Amphenol (choose one)', type:'stock', bucket:'enabler', bucketLabel:'Enabler', basePct:10, chooseOne:true,
      thesis:'Choose one data-center enabler: power/cooling (VRT) or interconnects (APH).',
      risk:'Order / backlog volatility; tied to data-center build pace.',
      watch:'Orders, backlog, margins, hyperscaler demand.',
      earnings:'Verify per stock symbol — Q3 season', earningsStatus:'verify', expenseRatio:null, search:'vrt vertiv aph amphenol data center power cooling interconnect enabler',
      bull:['Direct leverage to data-center buildout.','Backlog / orders have been strong in the AI cycle.','Less single-chip risk than a pure accelerator bet.'],
      bear:['Order and backlog volatility can hit the stock fast.','Competition and pricing pressure as more suppliers enter.','High expectations after strong runs.'],
      keyMetric:'Organic orders, backlog, and margin trend',
      whatWouldChangeMind:'Backlog collapse, order cancellations, or data-center capex pausing broadly.' },
    { id:'pltr', ticker:'PLTR', name:'Palantir', type:'stock', bucket:'satellite', bucketLabel:'Satellite', basePct:10,
      thesis:'AI software for enterprise + government with real, growing revenue.',
      risk:'Very high valuation; volatile on any guidance miss.',
      watch:'Revenue growth, commercial vs government, margins.',
      earnings:'Nov 2, 2026', earningsStatus:'confirmed', expenseRatio:null, search:'pltr palantir satellite software ai',
      bull:['Growing commercial + government AI deployments.','High gross margins typical of software.','Strong cash position for a software company.'],
      bear:['Very high valuation multiple.','Government revenue concentration and budget risk.','Competition from hyperscalers and other AI platforms.'],
      keyMetric:'Revenue growth + net retention / customer growth, plus margin trend',
      whatWouldChangeMind:'Growth decelerates sharply while valuation stays elevated, or large contract losses.' },
    { id:'quantum', ticker:'Quantum Basket', name:'Quantum Basket (IONQ / RGTI / QBTS)', type:'stock', bucket:'satellite', bucketLabel:'Satellite', basePct:10,
      thesis:'Small basket (IONQ / RGTI / QBTS) for quantum optionality — lottery-ticket sizing only.',
      risk:'Pre-profit, cash-burning, dilution risk; commercialization years away.',
      watch:'Real revenue, cash burn, qubit fidelity, insider activity.',
      earnings:'Varies by holding', earningsStatus:'verify', expenseRatio:null, search:'quantum basket ionq rgti qbts speculative satellite',
      bull:['Large long-term theoretical market if quantum advantage arrives.','Government and enterprise interest in quantum research.','Optionality: a small win could be meaningful.'],
      bear:['All three are pre-profit with minimal revenue vs. valuation.','Ongoing cash burn and dilution via secondary offerings.','No proven fault-tolerant, error-corrected system at scale yet.'],
      keyMetric:'Real revenue, cash burn, and progress on qubit fidelity / error correction',
      whatWouldChangeMind:'Evidence of durable commercial revenue (upgrade), or continued dilution with no revenue progress (exit review).' }
  ];
  var SLEEVE_LABELS = {broad:'Broad Market',style:'Style Tilts',international:'International','bonds-cash':'Bonds + Cash','real-assets':'Real Assets',sectors:'Sectors',thematic:'Thematic',stocks:'Individual Stocks'};

  // ---------- Phase 2: widget + Holdings Explorer pure builders (no DOM, Node-testable) ----------
  var STATUS_LABELS = { holds:'On track', watch:'To watch', break:'Changed our mind' };
  var STATUS_ORDER = { holds:0, watch:1, break:2 };
  function excerptText(s, n){
    s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
    if (s.length <= n) return s;
    var cut = s.slice(0, n);
    var sp = cut.lastIndexOf(' ');
    if (sp > n * 0.6) cut = cut.slice(0, sp);
    return cut + '…';
  }
  function statusLabel(st){ return STATUS_LABELS[st] || 'On track'; }
  function statusPill(st){
    var cls = st === 'watch' ? 'verify' : st === 'break' ? 'break' : 'confirmed';
    return '<span class="pill ' + cls + '">' + esc(statusLabel(st)) + '</span>';
  }
  // Scorecard widget body: counts by research standing, from data/scorecard.json shape.
  function buildScorecardHTML(sc){
    if (!sc || typeof sc.total !== 'number') return '';
    var h = '<div class="widget-stats">'
      + '<div class="widget-stat"><strong>' + sc.holds + '</strong><span>on track</span></div>'
      + '<div class="widget-stat"><strong>' + sc.watch + '</strong><span>to watch</span></div>'
      + '<div class="widget-stat"><strong>' + sc['break'] + '</strong><span>changed our mind</span></div></div>'
      + '<p class="widget-note">' + sc.total + ' holdings checked in the latest research.'
      + (sc.statusLine ? ' ' + esc(sc.statusLine) + '.' : '') + '</p>';
    return h;
  }
  // What Changed widget body: the newest dated research log entries that actually exist.
  function buildWhatChangedHTML(changelog, limit){
    if (!Array.isArray(changelog) || !changelog.length) return '';
    var items = changelog.slice(0, limit || 3).map(function(c){
      return '<li><strong>' + esc(c.date || '') + (c.version ? ' — ' + esc(c.version) : '') + '</strong><span>' + esc(excerptText(c.note || '', 300)) + '</span></li>';
    }).join('');
    return '<ul class="widget-list">' + items + '</ul>';
  }
  var MONTHS = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
  // Parse an earnings string ("Nov 17, 2026", "Reported Oct 15, 2026 · Next est. Jan 14, 2027")
  // into {label, time} — when a "Next" date exists it wins, otherwise the first date found.
  function parseEarningsDate(str){
    if (!str) return null;
    var re = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),\s+(\d{4})/g;
    var found = [], m;
    while ((m = re.exec(str)) !== null) {
      found.push({ label: m[0], time: Date.UTC(parseInt(m[3], 10), MONTHS[m[1]], parseInt(m[2], 10)) });
    }
    if (!found.length) return null;
    if (/next/i.test(str) && found.length > 1) return found[found.length - 1];
    return found[0];
  }
  // Upcoming earnings events from holdings that carry an earnings string.
  // asOfISO ("2026-10-21") is the research as-of date; events before it are skipped.
  function deriveEarningsEvents(holdings, asOfISO, limit){
    if (!Array.isArray(holdings)) return [];
    var asOf = asOfISO ? Date.parse(asOfISO + 'T00:00:00Z') : NaN;
    var events = [];
    holdings.forEach(function(s){
      var p = parseEarningsDate(s.earnings || '');
      if (!p) return;
      if (!isNaN(asOf) && p.time < asOf) return;
      events.push({ ticker:s.ticker || '', name:s.name || '', dateLabel:p.label, time:p.time, status:s.earningsStatus || 'verify' });
    });
    events.sort(function(a, b){ return a.time - b.time || String(a.ticker).localeCompare(String(b.ticker)); });
    return events.slice(0, limit || 8);
  }
  function buildEarningsHTML(events){
    if (!Array.isArray(events) || !events.length) return '';
    var items = events.map(function(e){
      var pill = e.status === 'confirmed' ? 'Confirmed' : e.status === 'estimated' ? 'Estimated' : 'Verify';
      var cls = e.status === 'confirmed' ? 'confirmed' : e.status === 'estimated' ? 'estimated' : 'verify';
      return '<li><strong>' + esc(e.ticker) + ' — ' + esc(e.dateLabel) + '</strong> <span class="pill ' + cls + '">' + pill + '</span><span>' + esc(e.name) + '</span></li>';
    }).join('');
    return '<ul class="widget-list">' + items + '</ul><p class="widget-note">Confirmed = company-announced. Estimated = based on prior pattern, may change. Verify = check the company calendar before acting.</p>';
  }
  // Week's Focus widget body: the headline + focus points that exist in research.json.
  function buildWeekFocusHTML(research){
    if (!research || (!research.headline && !(Array.isArray(research.focus) && research.focus.length))) return '';
    var h = '';
    if (research.headline) h += '<p class="widget-focus-lead">' + esc(excerptText(research.headline, 420)) + '</p>';
    if (Array.isArray(research.focus) && research.focus.length) {
      h += '<ul class="widget-list">' + research.focus.slice(0, 3).map(function(f){
        return '<li><span>' + esc(excerptText(f, 300)) + '</span></li>';
      }).join('') + '</ul>';
    }
    return h;
  }
  // Latest deep-dive entries: find the newest research-log entry about a deep-dive
  // rotation, take the tickers it names (after "cycle:"), pair each with its current note.
  // checks: optional [{ticker, note, status}] (holding topics); defaults to
  // research.thesisChecks (the monolith shape) when not given.
  function deepDiveTickersFromNote(note){
    var cyc = String(note || '').match(/cycle:\s*([^.]+)\./i);
    if (!cyc) return [];
    return cyc[1].split(',').map(function(t){ return t.trim(); }).filter(Boolean);
  }
  function deriveDeepDiveEntries(research, checks){
    if (!research || !Array.isArray(research.changelog)) return null;
    var entry = null;
    for (var i = 0; i < research.changelog.length; i++) {
      var v = String(research.changelog[i].version || '');
      if (/deep/i.test(v)) { entry = research.changelog[i]; break; }
    }
    if (!entry) return null;
    var tickers = deepDiveTickersFromNote(entry.note);
    if (!tickers.length) return { date: entry.date || '', version: entry.version || '', items: [] };
    var src = Array.isArray(checks) ? checks : (Array.isArray(research.thesisChecks) ? research.thesisChecks : []);
    var byTicker = {};
    src.forEach(function(c){ byTicker[String(c.ticker || '').toLowerCase()] = c; });
    var items = tickers.map(function(t){
      var c = byTicker[t.toLowerCase()];
      return { ticker: t, note: c ? (c.note || '') : '', status: c ? (c.status || 'holds') : 'holds' };
    });
    return { date: entry.date || '', version: entry.version || '', items: items };
  }
  // Every deep-dive rotation the changelog honestly carries, newest first.
  function deriveDeepDiveHistory(changelog){
    if (!Array.isArray(changelog)) return [];
    var out = [];
    changelog.forEach(function(c){
      if (!/deep/i.test(String(c.version || ''))) return;
      out.push({ date: c.date || '', version: c.version || '', tickers: deepDiveTickersFromNote(c.note), note: c.note || '' });
    });
    return out;
  }
  function buildDeepDiveHistoryHTML(history){
    if (!Array.isArray(history) || !history.length) return '';
    var items = history.map(function(h){
      var body = h.tickers && h.tickers.length
        ? '<span>' + esc(h.tickers.join(', ')) + '</span>'
        : '<span>' + esc(excerptText(h.note || '', 240)) + '</span>';
      return '<li><strong>' + esc(h.date || '') + (h.version ? ' — ' + esc(h.version) : '') + '</strong>' + body + '</li>';
    }).join('');
    return '<ul class="widget-list">' + items + '</ul>';
  }
  function buildDeepDiveHTML(dd){
    if (!dd || !dd.items || !dd.items.length) return '';
    var items = dd.items.map(function(it){
      return '<li><strong>' + esc(it.ticker) + '</strong> ' + statusPill(it.status) + '<span>' + esc(excerptText(it.note || '', 220)) + '</span></li>';
    }).join('');
    return '<p class="widget-note">Most recent deep-dive round' + (dd.date ? ' — ' + esc(dd.date) : '') + (dd.version ? ' (' + esc(dd.version) + ')' : '') + ':</p><ul class="widget-list">' + items + '</ul>';
  }
  // Holdings Explorer: normalize a holding (topic file shape or monolith-merged shape) into a row.
  function explorerRow(s, note, status){
    var groupKey = s.sleeve || s.group || 'stocks';
    return {
      id: s.id || '', ticker: s.ticker || '', name: s.name || '',
      type: s.type === 'etf' ? 'etf' : 'stock',
      groupKey: groupKey, groupLabel: SLEEVE_LABELS[groupKey] || s.groupLabel || 'Individual Stocks',
      status: status || s.status || 'holds',
      note: note != null ? note : (s.note || ''),
      thesis: s.thesis || '', keyMetric: s.keyMetric || '', whatWouldChangeMind: s.whatWouldChangeMind || '',
      risk: s.risk || '', earnings: s.earnings || '', earningsStatus: s.earningsStatus || 'verify',
      bucket: s.bucket || '', bucketLabel: s.bucketLabel || '',
      expenseRatio: (s.expenseRatio === undefined ? null : s.expenseRatio), sleeve: groupKey,
      bull: Array.isArray(s.bull) ? s.bull : [], bear: Array.isArray(s.bear) ? s.bear : [],
      search: ((s.ticker || '') + ' ' + (s.name || '') + ' ' + (s.search || '')).toLowerCase()
    };
  }
  function filterHoldings(rows, f){
    var out = (rows || []).filter(function(r){
      if (f.group && f.group !== 'all' && r.groupKey !== f.group) return false;
      if (f.status && f.status !== 'all' && r.status !== f.status) return false;
      if (f.type && f.type !== 'all' && r.type !== f.type) return false;
      if (f.q && r.search.indexOf(f.q) === -1 && r.note.toLowerCase().indexOf(f.q) === -1) return false;
      return true;
    });
    var sort = f.sort || 'name';
    out.sort(function(a, b){
      if (sort === 'ticker') return String(a.ticker).localeCompare(String(b.ticker));
      if (sort === 'status') {
        var d = (STATUS_ORDER[a.status] || 0) - (STATUS_ORDER[b.status] || 0);
        return d !== 0 ? d : String(a.name).localeCompare(String(b.name));
      }
      return String(a.name).localeCompare(String(b.name));
    });
    return out;
  }
  function buildExplorerRowHTML(r){
    return '<tr class="row-clickable" tabindex="0" data-exp-ticker="' + esc(r.ticker) + '" title="Click to open the full note for ' + esc(r.ticker) + '">'
      + '<td><strong>' + esc(r.ticker) + '</strong></td><td>' + esc(r.name) + '</td>'
      + '<td>' + (r.type === 'etf' ? 'ETF' : 'Stock') + '</td><td>' + esc(r.groupLabel) + '</td>'
      + '<td>' + statusPill(r.status) + '</td><td>' + esc(excerptText(r.note, 140)) + '</td></tr>';
  }
  function buildExplorerDetailHTML(r){
    if (!r) return '';
    var bull = r.bull.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('');
    var bear = r.bear.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('');
    var h = '<div class="sheet-head"><h3>' + esc(r.ticker) + ' — ' + esc(r.name) + '</h3>' + statusPill(r.status) + '</div>'
      + '<p class="detail-thesis"><strong>Why we like it:</strong> ' + esc(r.thesis || '') + '</p>'
      + '<p><strong>Latest research note:</strong> ' + esc(r.note || '') + '</p>'
      + '<p><strong>Kind:</strong> ' + (r.type === 'etf' ? 'ETF' : 'Stock') + ' · <strong>Group:</strong> ' + esc(r.groupLabel) + '</p>';
    if (bull || bear) h += '<div class="bull-bear"><div><h4>What could go right</h4><ul>' + bull + '</ul></div><div><h4>What could go wrong</h4><ul>' + bear + '</ul></div></div>';
    if (r.keyMetric) h += '<p><strong>What to watch:</strong> ' + esc(r.keyMetric) + '</p>';
    if (r.whatWouldChangeMind) h += '<p><strong>What would change our mind:</strong> ' + esc(r.whatWouldChangeMind) + '</p>';
    if (r.earnings) h += '<p><strong>Next earnings:</strong> ' + esc(r.earnings) + '</p>';
    h += '<p class="calc-disclaimer"><strong>Illustrative research — not a recommendation for you. Consult a qualified advisor.</strong></p>';
    return h;
  }
  // ---------- Phase 3/4 pure builders: stamps, groups, earnings view, palette ----------
  var STAMP_MONTHS = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
  // Parse a manifest stamp like "Oct 21, 2026 — 5:30 PM ET" into epoch ms.
  // The wall time is US Eastern: EDT (UTC-4) from the second Sunday of March to
  // the first Sunday of November, EST (UTC-5) otherwise — close enough for a
  // 26-hour / 8-day staleness check.
  function parseStampET(str){
    if (!str) return NaN;
    var m = String(str).match(/([A-Z][a-z]{2})[a-z]*\s+(\d{1,2}),\s+(\d{4})(?:\s+—\s+(\d{1,2}):(\d{2})\s*(AM|PM))?/);
    if (!m || !(m[1] in STAMP_MONTHS)) return NaN;
    var mo = STAMP_MONTHS[m[1]], d = parseInt(m[2], 10), y = parseInt(m[3], 10);
    var hh = 0, mm = 0;
    if (m[4]) { hh = (parseInt(m[4], 10) % 12) + (m[6] === 'PM' ? 12 : 0); mm = parseInt(m[5], 10); }
    var dst = (mo > 2 && mo < 10) || (mo === 2 && d >= 8) || (mo === 10 && d <= 1);
    return Date.UTC(y, mo, d, hh + (dst ? 4 : 5), mm);
  }
  var STALE_MS = { daily: 26 * 3600 * 1000, deepdive: 8 * 24 * 3600 * 1000 };
  function stampInfo(updatedET, kind, nowMs){
    if (!updatedET) return null;
    var t = parseStampET(updatedET);
    var limit = STALE_MS[kind] || 0;
    var stale = !!(limit && !isNaN(t) && typeof nowMs === 'number' && (nowMs - t) > limit);
    return { text: 'Updated ' + updatedET, stale: stale };
  }
  // Groups in the site's canonical order (the SLEEVE_LABELS key order).
  function sortGroups(groups){
    var order = Object.keys(SLEEVE_LABELS);
    return (groups || []).slice().sort(function(a, b){
      var ia = order.indexOf(a.id), ib = order.indexOf(b.id);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }
  // Groups view cards: name, holding count, standing counts, group note.
  function buildGroupsHTML(groups, rows){
    if (!Array.isArray(groups) || !groups.length) return '';
    var byGroup = {};
    (rows || []).forEach(function(r){
      var b = byGroup[r.groupKey] || (byGroup[r.groupKey] = { holds:0, watch:0, 'break':0 });
      if (b[r.status] != null) b[r.status]++;
    });
    return groups.map(function(g){
      var c = byGroup[g.id] || { holds:0, watch:0, 'break':0 };
      var total = (g.holdings || []).length;
      var counts = '<div class="widget-stats">'
        + '<div class="widget-stat"><strong>' + total + '</strong><span>holdings</span></div>'
        + '<div class="widget-stat"><strong>' + c.holds + '</strong><span>on track</span></div>'
        + '<div class="widget-stat"><strong>' + c.watch + '</strong><span>to watch</span></div>'
        + '<div class="widget-stat"><strong>' + c['break'] + '</strong><span>changed our mind</span></div></div>';
      return '<article class="card widget-card group-card" data-group-open="' + esc(g.id) + '" tabindex="0" role="button" aria-label="Open ' + esc(g.label || g.id) + ' in the Holdings Explorer">'
        + '<h3>' + esc(g.label || g.id) + '</h3>' + counts
        + (g.description ? '<p class="widget-note">' + esc(g.description) + '</p>' : '')
        + '<p class="widget-note group-open-hint">Open in the Holdings Explorer →</p></article>';
    }).join('');
  }
  // Earnings view: the full dated list + a plain count of what is not listed.
  function buildEarningsFullHTML(events, missing, total){
    var list = buildEarningsHTML(events);
    if (!list) return '';
    return list + '<p class="table-note">' + missing + ' of the ' + total
      + ' holdings have no upcoming earnings date we can date-check yet, so they are not listed — we would rather leave a date out than guess one.</p>';
  }
  // Command palette: one entry list for pages, groups, and holdings.
  var PALETTE_VIEWS = [
    { label:'Home', route:'#top', keywords:'home start top main page' },
    { label:'Your Plan', route:'#/plan', keywords:'plan calculator build my plan your plan' },
    { label:'Holdings Explorer', route:'#/holdings', keywords:'holdings explorer browse all stocks funds' },
    { label:'Groups', route:'#/groups', keywords:'groups categories broad market bonds cash international sectors themes style tilts real assets' },
    { label:'Earnings', route:'#/earnings', keywords:'earnings calendar dates reports upcoming' },
    { label:'Deep Dives', route:'#/deepdives', keywords:'deep dives deepdives research rounds' }
  ];
  function buildPaletteEntries(rows, groups){
    var entries = PALETTE_VIEWS.map(function(v){
      return { kind:'view', label:v.label, sub:'Page', route:v.route, keywords:v.keywords };
    });
    (groups || []).forEach(function(g){
      entries.push({ kind:'group', label:g.label || g.id, sub:'Group · ' + ((g.holdings || []).length) + ' holdings',
        route:'#/groups', groupKey:g.id, keywords:('group ' + (g.label || g.id)).toLowerCase() });
    });
    (rows || []).forEach(function(r){
      entries.push({ kind:'holding', label:r.ticker + ' — ' + r.name, sub:statusLabel(r.status) + ' · ' + r.groupLabel,
        route:'#/holdings', ticker:r.ticker, keywords:(r.ticker + ' ' + r.name + ' ' + (r.search || '')).toLowerCase() });
    });
    return entries;
  }
  function filterPalette(entries, q){
    q = String(q || '').trim().toLowerCase();
    var all = entries || [];
    if (!q) return all.filter(function(e){ return e.kind !== 'holding'; }).slice(0, 14);
    var toks = q.split(/\s+/);
    return all.filter(function(e){
      var hay = (e.label + ' ' + (e.sub || '') + ' ' + (e.keywords || '')).toLowerCase();
      return toks.every(function(t){ return hay.indexOf(t) !== -1; });
    }).slice(0, 12);
  }
  function paletteActionFor(entry){
    if (!entry) return null;
    if (entry.kind === 'holding') return { route:'#/holdings', preset:{ ticker:entry.ticker } };
    if (entry.kind === 'group') return { route:'#/groups' };
    return { route:entry.route || '#top' };
  }
  function buildPaletteResultsHTML(list, activeIdx){
    if (!list || !list.length) return '<li class="palette-empty">No matches — try a stock symbol, a name, or a page.</li>';
    return list.map(function(e, i){
      return '<li class="palette-item' + (i === activeIdx ? ' active' : '') + '" role="option" aria-selected="' + (i === activeIdx ? 'true' : 'false')
        + '" data-palette-idx="' + i + '"><span class="palette-item-label">' + esc(e.label)
        + '</span><span class="palette-item-sub">' + esc(e.sub || '') + '</span></li>';
    }).join('');
  }
  // Holding rows -> the plan engine's id-keyed map (topics carry every field
  // the engine reads: bucket, group, thesis, earnings, fee, search text).
  function holdingsToUniverse(rows){
    var u = {};
    (rows || []).forEach(function(r){ if (r.id) u[r.id] = r; });
    return u;
  }

  // ---------- Shared helpers ----------
  function fmtMoney(n){
    return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  function fmtPct(x){ return (Math.round(x * 10) / 10).toString() + '%'; }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function normRisk(k){ if (k === 'very-aggressive') return 'veryaggressive'; return k || 'aggressive'; }
  function normHorizon(h){ if (h === 'under-1yr') return 'under-1'; return h || '3-5'; }

  // ---------- Primary engine (JSON-driven) ----------
  var UNIVERSE = null; // id -> investment
  var MODELS = null;   // plan rules
  var DATA_OK = false;

  function computeModel(amount, riskKey, horizonKey){
    amount = Math.max(500, Math.min(500000, Math.round(Number(amount) || 500)));
    riskKey = normRisk(riskKey);
    horizonKey = normHorizon(horizonKey);
    if (DATA_OK && MODELS && UNIVERSE) {
      var key = riskKey + '|' + horizonKey;
      var alloc = MODELS.allocations[key];
      if (!alloc) { alloc = MODELS.allocations['aggressive|3-5']; riskKey = 'aggressive'; horizonKey = '3-5'; key = 'aggressive|3-5'; }
      var prof = MODELS.riskProfiles[riskKey] || MODELS.riskProfiles.aggressive;
      var items = [];
      alloc.rows.forEach(function(r){
        var sec = UNIVERSE[r.id];
        if (!sec) return;
        var exact = amount * r.pct / 100;
        items.push({ sec:sec, targetPct:r.pct, exact:exact, dollars:Math.floor(exact) });
      });
      var sumFloors = 0;
      items.forEach(function(it){ sumFloors += it.dollars; });
      var remainder = amount - sumFloors;
      var sorted = items.slice().sort(function(a,b){ return b.exact - a.exact; });
      if (remainder > 0 && sorted.length) { sorted[0].dollars += remainder; }
      var buckets = { core:{dollars:0}, enabler:{dollars:0}, satellite:{dollars:0}, defensive:{dollars:0}, cash:{dollars:0} };
      items.forEach(function(it){ var b = buckets[it.sec.bucket]; if (b) b.dollars += it.dollars; });
      Object.keys(buckets).forEach(function(k){ buckets[k].pct = amount ? (buckets[k].dollars / amount * 100) : 0; });
      var rows = items.map(function(it){
        return { sec:it.sec, targetPct:it.targetPct, dollars:it.dollars, actualPct: amount ? (it.dollars / amount * 100) : 0 };
      });
      // Changed vs Aggressive 3-5 base
      var base = MODELS.allocations[MODELS.baseKey || 'aggressive|3-5'];
      var changed = [];
      if (base && key !== (MODELS.baseKey || 'aggressive|3-5')) {
        var baseIds = {}; base.rows.forEach(function(r){ baseIds[r.id] = true; });
        var thisIds = {}; rows.forEach(function(r){ thisIds[r.sec.id] = true; });
        var added = rows.filter(function(r){ return !baseIds[r.sec.id]; }).map(function(r){ return r.sec.ticker; });
        var removed = base.rows.filter(function(r){ return !thisIds[r.id]; }).map(function(r){ var s = UNIVERSE[r.id]; return s ? s.ticker : r.id; });
        if (added.length) changed.push('Added vs base: ' + added.join(', '));
        if (removed.length) changed.push('Removed vs base: ' + removed.join(', '));
        ['core','enabler','satellite','defensive'].forEach(function(bk){
          var basePct = 0; base.rows.forEach(function(r){ var s = UNIVERSE[r.id]; if (s && s.bucket === bk) basePct += r.pct; });
          var thisPct = buckets[bk].pct;
          var d = Math.round((thisPct - basePct) * 10) / 10;
          if (Math.abs(d) >= 0.5) {
            var nm = bk === 'core' ? 'Core' : bk === 'enabler' ? 'Enablers' : bk === 'satellite' ? 'Satellite' : 'Defensive';
            changed.push(nm + ' ' + (d > 0 ? '+' : '') + d + ' points');
          }
        });
      }
      // Sleeve mix: Broad / Style / International / Bonds+Cash / Real Assets / Sectors / Thematic / Stocks
      var sleeves = { broad:{dollars:0}, style:{dollars:0}, international:{dollars:0}, 'bonds-cash':{dollars:0}, 'real-assets':{dollars:0}, sectors:{dollars:0}, thematic:{dollars:0}, stocks:{dollars:0} };
      rows.forEach(function(r){ var sv = sleeves[r.sec.sleeve || 'stocks']; if (sv) sv.dollars += r.dollars; });
      Object.keys(sleeves).forEach(function(k){ sleeves[k].pct = amount ? (sleeves[k].dollars / amount * 100) : 0; });
      return { amount:amount, riskKey:riskKey, horizonKey:horizonKey, profile:prof, maxSingleStock:(alloc.maxSingleStock == null ? null : alloc.maxSingleStock),
        rows:rows, buckets:buckets, sleeves:sleeves, changed:changed, why:alloc.why || '', fallback:false };
    }
    // ---------- Fallback: Aggressive 9-pick, proportional scaling ----------
    var prof = { label:'Aggressive', maxSingleStock:25, drawdown:'30–50%',
      feels:'Large swings are normal — a bad year could cut this by a third to a half.',
      note:'Original 9-pick Aggressive base.' };
    var items2 = [];
    FALLBACK_PICKS.forEach(function(p){
      // V2 Aggressive buckets == base buckets, so targetPct == basePct.
      var targetPct = p.basePct;
      var exact = amount * targetPct / 100;
      items2.push({ sec:p, targetPct:targetPct, exact:exact, dollars:Math.floor(exact) });
    });
    var sum2 = 0; items2.forEach(function(it){ sum2 += it.dollars; });
    var rem2 = amount - sum2;
    var srt2 = items2.slice().sort(function(a,b){ return b.exact - a.exact; });
    if (rem2 > 0 && srt2.length) { srt2[0].dollars += rem2; }
    var buckets2 = { core:{dollars:0}, enabler:{dollars:0}, satellite:{dollars:0}, defensive:{dollars:0}, cash:{dollars:0} };
    items2.forEach(function(it){ buckets2[it.sec.bucket].dollars += it.dollars; });
    Object.keys(buckets2).forEach(function(k){ buckets2[k].pct = amount ? (buckets2[k].dollars / amount * 100) : 0; });
    var rows2 = items2.map(function(it){ return { sec:it.sec, targetPct:it.targetPct, dollars:it.dollars, actualPct: amount ? (it.dollars / amount * 100) : 0 }; });
    // Fallback picks are all individual stocks.
    var sleeves2 = { broad:{dollars:0, pct:0}, style:{dollars:0, pct:0}, international:{dollars:0, pct:0}, 'bonds-cash':{dollars:0, pct:0}, 'real-assets':{dollars:0, pct:0}, sectors:{dollars:0, pct:0}, thematic:{dollars:0, pct:0}, stocks:{dollars:amount, pct:100} };
    return { amount:amount, riskKey:'aggressive', horizonKey:'3-5', profile:prof, maxSingleStock:25,
      rows:rows2, buckets:buckets2, sleeves:sleeves2, changed:['Full investment list unavailable. Showing original 9-pick Aggressive base.'],
      why:'Investment data could not load, so this shows the original 9-pick Aggressive base. Check connection and reload.', fallback:true };
  }

  // Export for Node tests + browser debugging
  var api = { computeModel:computeModel, fmtMoney:fmtMoney, fmtPct:fmtPct, FALLBACK_PICKS:FALLBACK_PICKS,
    researchLineText:researchLineText, buildScorecardHTML:buildScorecardHTML, buildWhatChangedHTML:buildWhatChangedHTML,
    parseEarningsDate:parseEarningsDate, deriveEarningsEvents:deriveEarningsEvents, buildEarningsHTML:buildEarningsHTML,
    buildWeekFocusHTML:buildWeekFocusHTML, deriveDeepDiveEntries:deriveDeepDiveEntries, buildDeepDiveHTML:buildDeepDiveHTML,
    explorerRow:explorerRow, filterHoldings:filterHoldings, buildExplorerRowHTML:buildExplorerRowHTML,
    buildExplorerDetailHTML:buildExplorerDetailHTML, STATUS_LABELS:STATUS_LABELS, SLEEVE_LABELS:SLEEVE_LABELS,
    parseStampET:parseStampET, stampInfo:stampInfo, sortGroups:sortGroups, buildGroupsHTML:buildGroupsHTML,
    buildEarningsFullHTML:buildEarningsFullHTML, deriveDeepDiveHistory:deriveDeepDiveHistory,
    buildDeepDiveHistoryHTML:buildDeepDiveHistoryHTML, buildPaletteEntries:buildPaletteEntries,
    filterPalette:filterPalette, paletteActionFor:paletteActionFor, buildPaletteResultsHTML:buildPaletteResultsHTML,
    holdingsToUniverse:holdingsToUniverse,
    _setData:function(u, m){ UNIVERSE = u; MODELS = m; DATA_OK = !!(u && m); } };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  if (typeof window !== 'undefined') { window.ETR = api; }

  if (typeof document === 'undefined') return;

  // ---------- Browser UI ----------
  var state = { amount:500, risk:'aggressive', horizon:'3-5', account:'taxable' };
  var LS_KEY = 'etr-model-v2';
  var activeFilter = 'all';       // bucket filter for plan table
  var searchQ = '';
  var activated = false;          // true once user clicks Build / Rebuild
  var activeModel = null;         // snapshot of the activated plan (inputs may change after)
  var inputsChanged = false;      // true when inputs change after activation

  function readInitial(){
    // Pre-fill inputs from URL params or saved inputs. NEVER auto-build.
    var params = {};
    try {
      var sp = new URLSearchParams(window.location.search);
      ['amount','risk','horizon','account'].forEach(function(k){ if (sp.get(k)) params[k] = sp.get(k); });
    } catch(e) {}
    var saved = null;
    try { saved = JSON.parse(window.localStorage.getItem(LS_KEY) || 'null'); } catch(e) {}
    function pick(key, valid, fallback){
      var v = params[key] || (saved && saved[key]);
      if (key === 'amount') {
        var n = parseInt(v, 10);
        if (!isNaN(n)) return Math.max(500, Math.min(500000, n));
        return fallback;
      }
      if (valid && valid.indexOf(String(v)) !== -1) return String(v);
      return fallback;
    }
    state.amount = pick('amount', null, 500);
    state.risk = normRisk(pick('risk', ['conservative','moderate','aggressive','veryaggressive','very-aggressive'], 'aggressive'));
    state.horizon = normHorizon(pick('horizon', ['under-1','under-1yr','1-3','3-5','5-plus'], '3-5'));
    state.account = pick('account', ['taxable','roth','traditional'], 'taxable');
  }

  function syncUrlAndStorage(){
    try {
      var sp = new URLSearchParams();
      sp.set('amount', String(state.amount));
      sp.set('risk', state.risk);
      sp.set('horizon', state.horizon);
      sp.set('account', state.account);
      window.history.replaceState(null, '', window.location.pathname + '?' + sp.toString() + window.location.hash);
    } catch(e) {}
    try { window.localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch(e) {}
  }

  function pillFor(status, text){
    if (status === 'na') return esc(text);
    var cls = status === 'confirmed' ? 'confirmed' : status === 'estimated' ? 'estimated' : 'verify';
    return esc(text) + ' <span class="pill ' + cls + '">' + (status === 'confirmed' ? 'Confirmed' : status === 'estimated' ? 'Estimated' : 'Verify') + '</span>';
  }

  function applyFilterSearch(){
    var rows = document.querySelectorAll('#portfolioBody tr');
    var visible = 0;
    rows.forEach(function(r){
      var bucket = r.getAttribute('data-bucket') || '';
      var hay = ((r.getAttribute('data-search') || '') + ' ' + r.textContent.toLowerCase());
      var okB = (activeFilter === 'all' || bucket === activeFilter);
      var okS = (!searchQ || hay.indexOf(searchQ) !== -1);
      var show = okB && okS;
      r.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    var noResults = document.getElementById('noResults');
    if (noResults) noResults.hidden = visible !== 0;
  }

  // Sync input controls + risk text + short-timeline warning. Does NOT build the plan.
  function renderInputs(){
    var amountInput = document.getElementById('amountInput');
    var amountSlider = document.getElementById('amountSlider');
    if (amountInput && document.activeElement !== amountInput) amountInput.value = String(state.amount);
    if (amountSlider) amountSlider.value = String(state.amount);
    var amountDisplay = document.getElementById('amountDisplay');
    if (amountDisplay) amountDisplay.textContent = fmtMoney(state.amount);

    document.querySelectorAll('[data-risk-btn]').forEach(function(b){
      var on = b.getAttribute('data-risk-btn') === state.risk;
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.classList.toggle('selected', on);
    });
    document.querySelectorAll('[data-timeline-btn]').forEach(function(b){
      var on = b.getAttribute('data-timeline-btn') === state.horizon;
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.classList.toggle('selected', on);
    });
    document.querySelectorAll('[data-account-btn]').forEach(function(b){
      var on = b.getAttribute('data-account-btn') === state.account;
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.classList.toggle('selected', on);
    });
    var riskDesc = document.getElementById('riskDesc');
    if (riskDesc) {
      var prof = (MODELS && MODELS.riskProfiles && MODELS.riskProfiles[state.risk]) || null;
      riskDesc.textContent = prof ? (prof.desc + ' How far it could drop: ' + prof.drawdown + '.') : 'Risk = how far your plan could drop.';
    }
    var hw = document.getElementById('timelineWarning');
    var isShort = state.horizon === 'under-1';
    if (hw) hw.hidden = !isShort;
    // NOTE: the plan section's dimmed state is set in renderPlan() from the
    // ACTIVATED plan's horizon — not here. Toggling it from live inputs made
    // an already-built plan grey out (or un-grey) before Rebuild was clicked.
  }

  // Render the ACTIVATED plan snapshot into the plan section.
  function renderPlan(model){
    // Dimming follows the plan actually shown (the activated snapshot), not
    // the live inputs — so a built 3–5 yr plan never greys out just because
    // the timeline control was tapped to <1 yr, and vice versa.
    var planSection = document.getElementById('plan');
    if (planSection) planSection.classList.toggle('dimmed', model.horizonKey === 'under-1');
    var prof = model.profile;
    var ph = document.getElementById('portfolioHeading');
    if (ph) ph.textContent = fmtMoney(model.amount) + ' ' + prof.label.toLowerCase() + ' investment plan';
    var whyEl = document.getElementById('whyLine');
    if (whyEl) whyEl.textContent = model.why || '';

    var tbody = document.getElementById('portfolioBody');
    if (tbody) {
      var html = '';
      model.rows.forEach(function(r){
        var s = r.sec;
        var exp = s.type === 'etf' ? (s.expenseRatio || '—') : '—';
        html += '<tr data-bucket="' + esc(s.bucket) + '" data-utype="' + esc(s.type) + '" data-sec-id="' + esc(s.id) + '" data-search="' + esc(s.search || '') + '" class="row-clickable" tabindex="0" title="Click to open full note for ' + esc(s.ticker) + '">'
          + '<td><strong>' + esc(s.ticker) + '</strong><span class="bucket ' + esc(s.bucket) + '">' + esc(s.bucketLabel || s.bucket) + '</span></td>'
          + '<td>' + (s.type === 'etf' ? 'ETF' : 'Stock') + '</td>'
          + '<td>' + fmtMoney(r.dollars) + '</td><td>' + fmtPct(r.actualPct) + '</td>'
          + '<td>' + esc(exp) + '</td>'
          + '<td>' + esc(s.thesis) + '</td><td>' + esc(s.risk) + '</td><td>' + esc(s.watch) + '</td>'
          + '<td>' + pillFor(s.earningsStatus || 'verify', s.earnings || '') + '</td></tr>';
      });
      tbody.innerHTML = html;
    }
    var tn = document.getElementById('tableNote');
    if (tn) tn.textContent = 'Your plan adds up to ' + fmtMoney(model.amount) + ' / 100%. Earnings: Confirmed = company-announced. Estimated = based on prior pattern, may change. Verify = check the company investor-relations calendar. Verify before acting.';

    document.querySelectorAll('.filter-btn[data-filter]').forEach(function(btn){
      var f = btn.getAttribute('data-filter');
      if (f === 'all') btn.textContent = 'All — ' + fmtMoney(model.amount);
      if (f === 'core') btn.textContent = 'Core — ' + fmtMoney(model.buckets.core.dollars);
      if (f === 'enabler') btn.textContent = 'Enablers — ' + fmtMoney(model.buckets.enabler.dollars);
      if (f === 'satellite') btn.textContent = 'Satellite — ' + fmtMoney(model.buckets.satellite.dollars);
      if (f === 'defensive') btn.textContent = 'Defensive — ' + fmtMoney(model.buckets.defensive.dollars);
      if (f === 'cash') btn.textContent = 'Cash — ' + fmtMoney(model.buckets.cash.dollars);
    });
    var cashBtn = document.querySelector('.filter-btn[data-filter="cash"]');
    if (cashBtn) cashBtn.style.display = model.buckets.cash.dollars > 0 ? '' : 'none';

    var bars = document.getElementById('bucketBars');
    if (bars) {
      var order = [['core','Core'],['enabler','Enablers'],['satellite','Satellite'],['defensive','Defensive'],['cash','Cash Reserve']];
      var bh = '';
      order.forEach(function(pair){
        var k = pair[0], label = pair[1];
        var b = model.buckets[k];
        if (!b || b.dollars <= 0) return;
        bh += '<div class="bucket-row"><span class="bucket-name">' + label + '</span>'
          + '<div class="bucket-track"><div class="bucket-fill ' + k + '" style="width:' + b.pct.toFixed(1) + '%"></div></div>'
          + '<span class="bucket-val">' + fmtMoney(b.dollars) + ' · ' + fmtPct(b.pct) + '</span></div>';
      });
      bars.innerHTML = bh;
    }
    var sb = document.getElementById('groupBars');
    if (sb) {
      var sleeveOrder = [['broad','Broad Market'],['style','Style Tilts'],['international','International'],['bonds-cash','Bonds + Cash'],['real-assets','Real Assets'],['sectors','Sectors'],['thematic','Thematic'],['stocks','Individual Stocks']];
      var sh = '';
      sleeveOrder.forEach(function(pair){
        var k = pair[0], label = pair[1];
        var sv = (model.sleeves && model.sleeves[k]) || { dollars:0, pct:0 };
        if (sv.dollars <= 0) return;
        sh += '<div class="bucket-row"><span class="bucket-name">' + label + '</span>'
          + '<div class="bucket-track"><div class="bucket-fill sleeve-' + k + '" style="width:' + sv.pct.toFixed(1) + '%"></div></div>'
          + '<span class="bucket-val">' + fmtMoney(sv.dollars) + ' · ' + fmtPct(sv.pct) + '</span></div>';
      });
      sb.innerHTML = sh;
    }
    var rs = document.getElementById('riskSummary');
    if (rs) {
      var satPct = model.buckets.satellite.pct;
      var msTxt = model.maxSingleStock == null ? 'No single stocks' : ('Max single stock ' + model.maxSingleStock + '%');
      rs.innerHTML = '<div class="risk-summary-head"><strong>' + esc(prof.label) + '</strong><span>' + msTxt + ' · Satellite ' + fmtPct(satPct) + '</span></div>'
        + '<p><strong>How far it could drop:</strong> ' + esc(prof.drawdown) + '</p>'
        + '<p>' + esc(prof.feels) + '</p>'
        + '<p class="risk-summary-note">' + esc(prof.note) + '</p>';
    }
    var tax = document.getElementById('taxNote');
    if (tax) {
      var notes = (MODELS && MODELS.accountNotes) || { taxable:'Taxable: hold >1 year when possible for long-term capital gains. Avoid frequent trading. No margin.', roth:'Roth IRA: qualified withdrawals may be tax-free. Verify eligibility.', traditional:'Traditional IRA: withdrawals generally taxed as income in retirement. Verify rules.' };
      tax.textContent = notes[state.account] || notes.taxable;
    }
    applyFilterSearch();
  }

  // Explicit activation: build the plan from current inputs. Only runs on button click.
  function buildPlan(){
    var loadError = document.getElementById('loadError');
    if (!DATA_OK) {
      if (loadError) loadError.hidden = false;
      return;
    }
    if (loadError) loadError.hidden = true;
    var model = computeModel(state.amount, state.risk, state.horizon);
    activeModel = model;
    activated = true;
    inputsChanged = false;
    var placeholder = document.getElementById('planPlaceholder');
    if (placeholder) placeholder.hidden = true;
    var notice = document.getElementById('rebuildNotice');
    if (notice) notice.hidden = true;
    var content = document.getElementById('planContent');
    if (content) content.hidden = false;
    renderPlan(model);
    syncUrlAndStorage();
    var planEl = document.getElementById('plan');
    if (planEl) planEl.scrollIntoView({ behavior:'smooth', block:'start' });
    var ph = document.getElementById('portfolioHeading');
    if (ph) { ph.setAttribute('tabindex', '-1'); try { ph.focus({ preventScroll:true }); } catch(e) {} }
  }

  // Inputs changed after activation: flag it, do NOT rebuild the plan.
  function markInputsChanged(){
    renderInputs();
    syncUrlAndStorage();
    if (activated) {
      inputsChanged = true;
      var notice = document.getElementById('rebuildNotice');
      if (notice) notice.hidden = false;
    }
  }

  function setAmount(n){
    var v = parseInt(n, 10);
    if (isNaN(v)) return;
    state.amount = Math.max(500, Math.min(500000, v));
    markInputsChanged();
  }

  // Phase 4: the plan engine reads ONLY topic files — the models topic for the
  // plan rules and the holding topics for the securities (via loadAllHoldings).
  function loadData(){
    function fail(){
      DATA_OK = false;
      renderInputs();
    }
    try {
      Promise.all([
        loadTopic('models').then(function(t){ return t.data; }),
        loadAllHoldings()
      ]).then(function(res){
        var m = res[0], rows = res[1];
        if (!m || !m.allocations || !rows || !rows.length) { fail(); return; }
        UNIVERSE = holdingsToUniverse(rows);
        MODELS = m;
        DATA_OK = true;
        renderInputs();
      }).catch(function(){ fail(); });
    } catch(e) { fail(); }
  }

  // One visible research line under Your Plan (the ONLY user-visible research output).
  // Phase 4: topics only — the scorecard topic through the manifest. If the
  // topic cannot be loaded or fails its structural check, the line is left
  // EMPTY rather than showing a stale or wrong line.
  function researchLineText(holds, total, watch, brk, date){
    var msg = "What changed in this week's research: " + holds + " of " + total + " still on track";
    if (watch > 0) msg += ", " + watch + " to watch";
    if (brk > 0) msg += ", " + brk + " changed our mind";
    msg += ". Research updated " + date + ".";
    return msg;
  }
  function loadResearchLine(){
    var el = document.getElementById('researchLine');
    if (!el) return;
    loadTopic('scorecard').then(function(t){
      var sc = t.data;
      if (!sc || typeof sc.total !== 'number' || typeof sc.holds !== 'number' ||
          typeof sc.watch !== 'number' || typeof sc['break'] !== 'number' || !sc.updatedDate) {
        el.textContent = '';
        return;
      }
      el.textContent = researchLineText(sc.holds, sc.total, sc.watch, sc['break'], sc.updatedDate);
    }).catch(function(){ el.textContent = ''; });
  }

  // ---------- Phase 2/3/4: widget registry, views, palette (browser) ----------
  // Each widget loads its own topics, renders into its own card, and fails
  // alone: topics only (Phase 4), hide on failure, own freshness stamp.
  var _jsonCache = {};
  function fetchJSON(url){
    if (!_jsonCache[url]) {
      _jsonCache[url] = fetch(url, { cache:'no-store' }).then(function(r){ if (!r.ok) throw new Error(url); return r.json(); });
      _jsonCache[url].catch(function(){ delete _jsonCache[url]; });
    }
    return _jsonCache[url];
  }
  function loadManifestTopics(){
    return fetchJSON('data/manifest.json').then(function(m){
      if (!m || !m.topics) throw new Error('manifest shape');
      return m;
    });
  }
  function loadTopic(name){
    return loadManifestTopics().then(function(m){
      var t = m.topics[name];
      if (!t || !t.path) throw new Error('no topic ' + name);
      return fetchJSON(t.path).then(function(data){ return { data:data, updatedET:t.updatedET || m.updatedET || '' }; });
    });
  }
  var _holdingsPromise = null;
  // All 100 holdings from the holding topics through the manifest.
  // Phase 4: topics only — no monolith fallback. A failure rejects, and each
  // consumer degrades on its own (widget hides, view shows its message).
  function loadAllHoldings(){
    if (_holdingsPromise) return _holdingsPromise;
    _holdingsPromise = loadManifestTopics().then(function(m){
      var keys = Object.keys(m.topics).filter(function(k){ return k.indexOf('holding:') === 0; });
      if (!keys.length) throw new Error('no holding topics');
      return Promise.all(keys.map(function(k){ return fetchJSON(m.topics[k].path); })).then(function(list){
        return list.map(function(s){ return explorerRow(s); });
      });
    });
    _holdingsPromise.catch(function(){ _holdingsPromise = null; });
    return _holdingsPromise;
  }
  // The 8 group topics through the manifest: [{entry, data}] in manifest order.
  function loadGroupTopics(){
    return loadManifestTopics().then(function(m){
      var keys = Object.keys(m.topics).filter(function(k){ return k.indexOf('group:') === 0; });
      if (!keys.length) throw new Error('no group topics');
      return Promise.all(keys.map(function(k){
        return fetchJSON(m.topics[k].path).then(function(data){ return { entry:m.topics[k], data:data }; });
      }));
    });
  }
  function loadResearchTopic(){
    return loadTopic('research').then(function(t){
      if (!t.data || !Array.isArray(t.data.changelog)) throw new Error('research topic shape');
      return t;
    });
  }
  // Freshness stamps (Phase 4): every widget and view header shows its own
  // "Updated <date>" from the manifest's per-topic stamp, plus the plain stale
  // note when a daily topic is more than 26 hours old (deep dives: 8 days).
  function stampHTML(updatedET, kind){
    var info = stampInfo(updatedET, kind, Date.now());
    if (!info) return '';
    return esc(info.text) + (info.stale ? ' <span class="stamp-stale">— a newer update may be on its way</span>' : '');
  }
  function renderViewStamp(elId, updatedET, kind){
    var el = document.getElementById(elId);
    if (!el) return;
    el.innerHTML = stampHTML(updatedET, kind);
  }

  var WIDGETS = [
    { id:'scorecard', title:'How the research stands',
      load:function(){
        return loadTopic('scorecard').then(function(t){
          var sc = t.data;
          if (!sc || typeof sc.total !== 'number' || typeof sc.holds !== 'number') throw new Error('scorecard shape');
          var html = buildScorecardHTML(sc);
          if (!html) throw new Error('scorecard empty');
          return { html:html, stampET:t.updatedET, stampKind:'daily' };
        });
      } },
    { id:'what-changed', title:'What changed',
      load:function(){
        return loadResearchTopic().then(function(t){
          var html = buildWhatChangedHTML(t.data.changelog, 3);
          if (!html) throw new Error('no changelog');
          return { html:html, stampET:t.updatedET, stampKind:'daily' };
        });
      } },
    { id:'earnings-ahead', title:'Earnings ahead',
      load:function(){
        return Promise.all([loadTopic('scorecard'), loadAllHoldings(), loadTopic('earnings')]).then(function(res){
          var asOf = res[0].data.lastResearched;
          var src = res[1].map(function(r){ return { ticker:r.ticker, name:r.name, earnings:r.earnings, earningsStatus:r.earningsStatus }; });
          var html = buildEarningsHTML(deriveEarningsEvents(src, asOf, 8));
          if (!html) throw new Error('no upcoming earnings');
          return { html:html, stampET:res[2].updatedET, stampKind:'daily' };
        });
      } },
    { id:'week-focus', title:"This week's focus",
      load:function(){
        return loadResearchTopic().then(function(t){
          var html = buildWeekFocusHTML(t.data);
          if (!html) throw new Error('no focus');
          return { html:html, stampET:t.updatedET, stampKind:'daily' };
        });
      } },
    { id:'deep-dive', title:'Latest deep dives',
      load:function(){
        return Promise.all([loadResearchTopic(), loadAllHoldings()]).then(function(res){
          var html = buildDeepDiveHTML(deriveDeepDiveEntries(res[0].data, res[1]));
          if (!html) throw new Error('no deep dive');
          return { html:html, stampET:res[0].updatedET, stampKind:'deepdive' };
        });
      } }
  ];
  var widgetsStarted = false;
  function initWidgets(){
    if (widgetsStarted) return;
    var grid = document.getElementById('widgetGrid');
    if (!grid) return;
    widgetsStarted = true;
    WIDGETS.forEach(function(w){
      var card = document.createElement('article');
      card.className = 'card widget-card';
      card.id = 'widget-' + w.id;
      card.innerHTML = '<h3>' + esc(w.title) + '</h3><div class="widget-body"><p class="widget-note">Loading…</p></div>';
      grid.appendChild(card);
      w.load().then(function(res){
        if (!res || !res.html) { card.remove(); return; }
        var stamp = stampHTML(res.stampET, res.stampKind);
        card.querySelector('.widget-body').innerHTML = res.html + (stamp ? '<p class="widget-stamp">' + stamp + '</p>' : '');
      }).catch(function(){ card.remove(); });
    });
  }

  // ---------- Holdings Explorer ----------
  var explorerRows = null;
  var explorerStarted = false;
  var explorerPreset = null;
  // Jump to the Explorer, optionally pre-filtered to a group or with one
  // holding's detail open (Groups view cards and palette results use this).
  function goExplorer(preset){
    explorerPreset = preset || null;
    if (window.location.hash === '#/holdings') { applyExplorerPreset(); }
    else window.location.hash = '#/holdings';
  }
  function applyExplorerPreset(){
    if (!explorerPreset || !explorerRows) return;
    var p = explorerPreset;
    explorerPreset = null;
    if (p.group) {
      var gs = document.getElementById('expGroup');
      if (gs) gs.value = p.group;
    }
    renderExplorer();
    if (p.ticker) openExplorerDetail(p.ticker);
  }
  function explorerFilters(){
    return {
      group:(document.getElementById('expGroup') || {}).value || 'all',
      status:(document.getElementById('expStatus') || {}).value || 'all',
      type:(document.getElementById('expType') || {}).value || 'all',
      sort:(document.getElementById('expSort') || {}).value || 'name',
      q:((document.getElementById('expSearch') || {}).value || '').trim().toLowerCase()
    };
  }
  function renderExplorer(){
    if (!explorerRows) return;
    var f = explorerFilters();
    var out = filterHoldings(explorerRows, f);
    var tbody = document.getElementById('explorerBody');
    if (tbody) tbody.innerHTML = out.map(buildExplorerRowHTML).join('');
    var count = document.getElementById('explorerCount');
    if (count) count.textContent = 'Showing ' + out.length + ' of ' + explorerRows.length + ' holdings.';
    var empty = document.getElementById('explorerEmpty');
    if (empty) empty.hidden = out.length !== 0;
  }
  function openExplorerDetail(ticker, trigger){
    var detail = document.getElementById('explorerDetail');
    if (!detail || !explorerRows) return;
    var row = null;
    for (var i = 0; i < explorerRows.length; i++) { if (explorerRows[i].ticker === ticker) { row = explorerRows[i]; break; } }
    if (!row) return;
    detail.innerHTML = buildExplorerDetailHTML(row);
    detail.hidden = false;
    detail.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }
  function initExplorer(){
    if (explorerStarted) return;
    explorerStarted = true;
    loadAllHoldings().then(function(rows){
      if (!rows || !rows.length) throw new Error('no holdings');
      explorerRows = rows;
      var groupSel = document.getElementById('expGroup');
      if (groupSel) {
        var seen = {};
        rows.forEach(function(r){ seen[r.groupKey] = r.groupLabel; });
        Object.keys(SLEEVE_LABELS).forEach(function(k){
          if (!seen[k]) return;
          var opt = document.createElement('option');
          opt.value = k; opt.textContent = SLEEVE_LABELS[k];
          groupSel.appendChild(opt);
        });
      }
      ['expGroup','expStatus','expType','expSort'].forEach(function(id){
        var el = document.getElementById(id);
        if (el) el.addEventListener('change', renderExplorer);
      });
      var search = document.getElementById('expSearch');
      if (search) search.addEventListener('input', renderExplorer);
      var tbody = document.getElementById('explorerBody');
      if (tbody) {
        tbody.addEventListener('click', function(e){
          var tr = e.target && e.target.closest ? e.target.closest('tr[data-exp-ticker]') : null;
          if (tr) openExplorerDetail(tr.getAttribute('data-exp-ticker'), tr);
        });
        tbody.addEventListener('keydown', function(e){
          if (e.key !== 'Enter' && e.key !== ' ') return;
          var tr = e.target && e.target.closest ? e.target.closest('tr[data-exp-ticker]') : null;
          if (tr) { e.preventDefault(); openExplorerDetail(tr.getAttribute('data-exp-ticker'), tr); }
        });
      }
      renderExplorer();
      applyExplorerPreset();
      loadManifestTopics().then(function(m){
        var key = Object.keys(m.topics).filter(function(k){ return k.indexOf('holding:') === 0; })[0];
        renderViewStamp('explorerStamp', key ? m.topics[key].updatedET : m.updatedET, 'daily');
      }).catch(function(){});
    }).catch(function(){
      var err = document.getElementById('explorerError');
      if (err) err.hidden = false;
    });
  }

  // ---------- Groups view (#/groups) ----------
  var groupsStarted = false;
  function initGroups(){
    if (groupsStarted) return;
    groupsStarted = true;
    Promise.all([loadGroupTopics(), loadAllHoldings()]).then(function(res){
      var groups = sortGroups(res[0].map(function(x){ return x.data; }));
      var html = buildGroupsHTML(groups, res[1]);
      var grid = document.getElementById('groupsGrid');
      if (!html || !grid) throw new Error('no groups');
      grid.innerHTML = html;
      grid.querySelectorAll('[data-group-open]').forEach(function(card){
        function open(){ goExplorer({ group: card.getAttribute('data-group-open') }); }
        card.addEventListener('click', open);
        card.addEventListener('keydown', function(e){
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
        });
      });
      renderViewStamp('groupsStamp', res[0][0] ? res[0][0].entry.updatedET : '', 'daily');
    }).catch(function(){
      var err = document.getElementById('groupsError');
      if (err) err.hidden = false;
    });
  }

  // ---------- Earnings view (#/earnings) ----------
  var earningsStarted = false;
  function initEarnings(){
    if (earningsStarted) return;
    earningsStarted = true;
    Promise.all([loadAllHoldings(), loadTopic('scorecard'), loadTopic('earnings')]).then(function(res){
      var rows = res[0];
      var asOf = res[1].data.lastResearched;
      var src = rows.map(function(r){ return { ticker:r.ticker, name:r.name, earnings:r.earnings, earningsStatus:r.earningsStatus }; });
      // Same honest rule as the widget — parseable dates on/after the research
      // as-of date only — plus: holdings whose date is still marked "Verify"
      // are not listed as dated events.
      var events = deriveEarningsEvents(src, asOf, 1000).filter(function(e){ return e.status !== 'verify'; });
      var html = buildEarningsFullHTML(events, rows.length - events.length, rows.length);
      var box = document.getElementById('earningsList');
      if (!html || !box) throw new Error('no earnings');
      box.innerHTML = html;
      renderViewStamp('earningsStamp', res[2].updatedET, 'daily');
    }).catch(function(){
      var err = document.getElementById('earningsError');
      if (err) err.hidden = false;
    });
  }

  // ---------- Deep Dives view (#/deepdives) ----------
  var deepdivesStarted = false;
  function initDeepDives(){
    if (deepdivesStarted) return;
    deepdivesStarted = true;
    Promise.all([loadResearchTopic(), loadAllHoldings()]).then(function(res){
      var d = res[0].data, rows = res[1];
      var box = document.getElementById('deepdivesContent');
      if (!box) throw new Error('no deep dives');
      var html = '';
      var latest = buildDeepDiveHTML(deriveDeepDiveEntries(d, rows));
      if (latest) html += '<h3>Latest round</h3><div class="card widget-card">' + latest + '</div>';
      var earlier = buildDeepDiveHistoryHTML(deriveDeepDiveHistory(d.changelog).slice(1));
      if (earlier) html += '<h3>Earlier rounds</h3><div class="card widget-card">' + earlier + '</div>';
      if (!html) throw new Error('no deep dives');
      box.innerHTML = html;
      renderViewStamp('deepdivesStamp', res[0].updatedET, 'deepdive');
    }).catch(function(){
      var err = document.getElementById('deepdivesError');
      if (err) err.hidden = false;
    });
  }

  // ---------- Command palette (⌘K / Ctrl+K, or the Search button) ----------
  var paletteState = { open:false, entries:null, list:[], active:0 };
  function ensurePaletteEntries(){
    if (paletteState.entries) return Promise.resolve(paletteState.entries);
    return Promise.all([loadAllHoldings(), loadGroupTopics()]).then(function(res){
      var groups = sortGroups(res[1].map(function(x){ return x.data; }));
      paletteState.entries = buildPaletteEntries(res[0], groups);
      return paletteState.entries;
    }).catch(function(){
      paletteState.entries = buildPaletteEntries([], []);
      return paletteState.entries;
    });
  }
  function renderPalette(){
    var ul = document.getElementById('paletteResults');
    if (!ul) return;
    ul.innerHTML = buildPaletteResultsHTML(paletteState.list, paletteState.active);
    ul.querySelectorAll('[data-palette-idx]').forEach(function(li){
      li.addEventListener('click', function(){ selectPaletteIndex(parseInt(li.getAttribute('data-palette-idx'), 10)); });
      li.addEventListener('mousemove', function(){
        var i = parseInt(li.getAttribute('data-palette-idx'), 10);
        if (paletteState.active !== i) { paletteState.active = i; renderPalette(); }
      });
    });
  }
  function refreshPaletteList(){
    var input = document.getElementById('paletteInput');
    paletteState.list = filterPalette(paletteState.entries || [], input ? input.value : '');
    paletteState.active = 0;
    renderPalette();
  }
  function openPalette(){
    var ov = document.getElementById('palette');
    var bd = document.getElementById('paletteBackdrop');
    if (!ov) return;
    paletteState.open = true;
    ov.hidden = false;
    if (bd) bd.hidden = false;
    var input = document.getElementById('paletteInput');
    if (input) input.value = '';
    refreshPaletteList();
    ensurePaletteEntries().then(function(){ if (paletteState.open) refreshPaletteList(); });
    if (input) { try { input.focus(); } catch(e) {} }
  }
  function closePalette(){
    var ov = document.getElementById('palette');
    var bd = document.getElementById('paletteBackdrop');
    paletteState.open = false;
    if (ov) ov.hidden = true;
    if (bd) bd.hidden = true;
  }
  function selectPaletteIndex(i){
    var entry = paletteState.list[i];
    if (!entry) return;
    var action = paletteActionFor(entry);
    closePalette();
    if (!action) return;
    if (action.preset) { goExplorer(action.preset); return; }
    if (window.location.hash === action.route) applyRoute();
    else window.location.hash = action.route;
  }

  // ---------- Hash routing: #/<view> routes are lazy views; every other
  // hash keeps the single-page behavior (anchor sections) exactly. ----------
  var HOME_SECTION_IDS = ['research-widgets', 'calculator', 'plan', 'how-we-research', 'how-it-works', 'disclaimer'];
  var VIEW_ROUTES = {
    '#/holdings': { sections:['holdingsView'], init:'holdings' },
    '#/groups': { sections:['groupsView'], init:'groups' },
    '#/earnings': { sections:['earningsView'], init:'earnings' },
    '#/deepdives': { sections:['deepdivesView'], init:'deepdives' },
    '#/plan': { sections:['calculator', 'plan'], init:null }
  };
  var ALL_VIEW_IDS = ['holdingsView', 'groupsView', 'earningsView', 'deepdivesView'];
  function applyRoute(){
    var hash = window.location.hash || '';
    var route = VIEW_ROUTES[hash] || null;
    var isView = !!route;
    var hero = document.querySelector('.hero');
    if (hero) hero.hidden = isView;
    HOME_SECTION_IDS.forEach(function(id){
      var el = document.getElementById(id);
      if (el) el.hidden = isView && route.sections.indexOf(id) === -1;
    });
    ALL_VIEW_IDS.forEach(function(id){
      var el = document.getElementById(id);
      if (el) el.hidden = !(isView && route.sections.indexOf(id) !== -1);
    });
    var planStamp = document.getElementById('planStamp');
    if (planStamp) planStamp.hidden = hash !== '#/plan';
    if (isView) {
      if (route.init === 'holdings') { initExplorer(); applyExplorerPreset(); }
      else if (route.init === 'groups') initGroups();
      else if (route.init === 'earnings') initEarnings();
      else if (route.init === 'deepdives') initDeepDives();
      if (hash === '#/plan') {
        loadManifestTopics().then(function(m){
          var t = m.topics.models;
          renderViewStamp('planStamp', t ? t.updatedET : m.updatedET, 'none');
        }).catch(function(){});
      }
      window.scrollTo(0, 0);
    } else {
      initWidgets();
      var target = hash && hash.charAt(1) !== '/' ? document.querySelector(hash) : null;
      if (target) target.scrollIntoView();
    }
    updateTabBar();
  }

  // ---------- Mobile tab bar: keep the active tab in step with the route.
  // The bar is markup in index.html; styles.css shows it ≤768px only.
  function tabKeyForHash(hash){
    if (hash === '#/holdings') return 'explore';
    if (hash === '#/groups') return 'groups';
    if (hash === '#plan' || hash === '#/plan') return 'plan';
    if (hash === '#calculator') return 'build';
    return '';
  }
  function setActiveTab(key){
    document.querySelectorAll('.tab-item[data-tab]').forEach(function(el){
      var on = el.getAttribute('data-tab') === key;
      el.classList.toggle('is-active', on);
      if (on) el.setAttribute('aria-current', 'page');
      else el.removeAttribute('aria-current');
    });
  }
  function updateTabBar(){
    setActiveTab(tabKeyForHash(window.location.hash || ''));
  }

  document.addEventListener('DOMContentLoaded', function(){
    readInitial();
    loadData();
    loadResearchLine();
    applyRoute();
    window.addEventListener('hashchange', applyRoute);

    // Hero carousel — 3 slides, auto-advance 5s, pause on hover/focus/touch, respects reduced motion.
    (function initCarousel(){
      var track = document.getElementById('carouselTrack');
      if (!track) return;
      var slides = track.querySelectorAll('.carousel-slide');
      var dots = document.querySelectorAll('[data-carousel-dot]');
      var prev = document.querySelector('.carousel-prev');
      var next = document.querySelector('.carousel-next');
      var carousel = track.closest('.carousel');
      var idx = 0, timer = null;
      var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      function go(n){
        idx = (n + slides.length) % slides.length;
        track.style.transform = 'translateX(-' + (idx * 100) + '%)';
        dots.forEach(function(d, i){
          d.setAttribute('aria-selected', i === idx ? 'true' : 'false');
          d.classList.toggle('active', i === idx);
        });
        slides.forEach(function(s, i){
          s.setAttribute('aria-hidden', i === idx ? 'false' : 'true');
        });
      }
      function start(){ if (!reduced && !timer) timer = setInterval(function(){ go(idx + 1); }, 5000); }
      function stop(){ if (timer) { clearInterval(timer); timer = null; } }
      if (prev) prev.addEventListener('click', function(){ go(idx - 1); stop(); start(); });
      if (next) next.addEventListener('click', function(){ go(idx + 1); stop(); start(); });
      dots.forEach(function(d){ d.addEventListener('click', function(){ go(parseInt(d.getAttribute('data-carousel-dot'), 10)); stop(); start(); }); });
      if (carousel) {
        carousel.addEventListener('mouseenter', stop);
        carousel.addEventListener('mouseleave', start);
        carousel.addEventListener('focusin', stop);
        carousel.addEventListener('focusout', start);
        carousel.addEventListener('touchstart', stop, {passive:true});
        carousel.addEventListener('touchend', start, {passive:true});
        carousel.addEventListener('keydown', function(e){
          if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1); }
          if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1); }
        });
      }
      go(0); start();
    })();

    // Ticker strip — fixed market list, symbols only, no prices.
    var track = document.getElementById('tickerTrack');
    if (track) {
      var marketTickers = ['DOW', 'NASDAQ', 'S&P 500', 'VOO', 'QQQ', 'NVDA', 'AAPL', 'MSFT', 'AMZN', 'META', 'GOOGL', 'TSM', 'AVGO', 'AMD', 'MU'];
      var items = marketTickers.map(function(t){
        return '<span>' + esc(t) + '</span>';
      }).join('');
      track.innerHTML = items + items;
    }

    var navToggle = document.getElementById('navToggle');
    var nav = document.getElementById('mainNav');
    if (navToggle && nav) {
      navToggle.addEventListener('click', function(){
        var open = nav.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }

    // Command palette wiring: Search button, backdrop click, input keys,
    // and the global ⌘K / Ctrl+K toggle.
    var paletteBtn = document.getElementById('paletteBtn');
    if (paletteBtn) paletteBtn.addEventListener('click', openPalette);
    var mobilePaletteBtn = document.getElementById('mobilePaletteBtn');
    if (mobilePaletteBtn) mobilePaletteBtn.addEventListener('click', openPalette);
    // Tab taps set the active state immediately (hashchange + applyRoute
    // re-sync it via updateTabBar for keyboard/programmatic navigation).
    document.querySelectorAll('.tab-item[data-tab]').forEach(function(el){
      el.addEventListener('click', function(){ setActiveTab(el.getAttribute('data-tab')); });
    });
    var paletteBackdropEl = document.getElementById('paletteBackdrop');
    if (paletteBackdropEl) paletteBackdropEl.addEventListener('click', closePalette);
    var paletteInputEl = document.getElementById('paletteInput');
    if (paletteInputEl) {
      paletteInputEl.addEventListener('input', refreshPaletteList);
      paletteInputEl.addEventListener('keydown', function(e){
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (paletteState.list.length) { paletteState.active = (paletteState.active + 1) % paletteState.list.length; renderPalette(); }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (paletteState.list.length) { paletteState.active = (paletteState.active - 1 + paletteState.list.length) % paletteState.list.length; renderPalette(); }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          selectPaletteIndex(paletteState.active);
        }
      });
    }
    document.addEventListener('keydown', function(e){
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (paletteState.open) closePalette(); else openPalette();
      } else if (e.key === 'Escape' && paletteState.open) {
        closePalette();
      }
    });

    var amountInput = document.getElementById('amountInput');
    var amountSlider = document.getElementById('amountSlider');
    if (amountInput) {
      amountInput.addEventListener('change', function(){ setAmount(amountInput.value); });
      amountInput.addEventListener('input', function(){
        var v = parseInt(amountInput.value, 10);
        if (!isNaN(v)) { state.amount = Math.max(500, Math.min(500000, v)); markInputsChanged(); }
      });
    }
    if (amountSlider) {
      amountSlider.addEventListener('input', function(){ setAmount(amountSlider.value); });
    }
    document.querySelectorAll('[data-preset]').forEach(function(b){
      b.addEventListener('click', function(){ setAmount(b.getAttribute('data-preset')); });
    });
    document.querySelectorAll('[data-risk-btn]').forEach(function(b){
      b.addEventListener('click', function(){ state.risk = normRisk(b.getAttribute('data-risk-btn')); markInputsChanged(); });
    });
    document.querySelectorAll('[data-timeline-btn]').forEach(function(b){
      b.addEventListener('click', function(){ state.horizon = normHorizon(b.getAttribute('data-timeline-btn')); markInputsChanged(); });
    });
    document.querySelectorAll('[data-account-btn]').forEach(function(b){
      b.addEventListener('click', function(){ state.account = b.getAttribute('data-account-btn'); markInputsChanged(); });
    });

    var buildBtn = document.getElementById('buildBtn');
    if (buildBtn) buildBtn.addEventListener('click', buildPlan);
    var rebuildBtn = document.getElementById('rebuildBtn');
    if (rebuildBtn) rebuildBtn.addEventListener('click', buildPlan);

    var copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function(){
        if (!activeModel) return;
        var model = activeModel;
        var lines = [];
        lines.push("Don't Waste Your Money — Illustrative plan (educational only, not a recommendation)");
        lines.push('Amount: ' + fmtMoney(model.amount) + ' | Risk: ' + model.profile.label + ' | Timeline: ' + ({ 'under-1':'<1 yr', '1-3':'1–3 yr', '3-5':'3–5 yr', '5-plus':'5+ yr' })[model.horizonKey] + ' | Account: ' + state.account);
        if (model.why) lines.push('Why these picks: ' + model.why);
        lines.push('');
        model.rows.forEach(function(r){ lines.push(r.sec.ticker + ' (' + (r.sec.bucketLabel || r.sec.bucket) + ', ' + (r.sec.type === 'etf' ? 'ETF' : 'Stock') + '): ' + fmtMoney(r.dollars) + ' — ' + fmtPct(r.actualPct) + (r.sec.type === 'etf' ? ' — Yearly fee ' + (r.sec.expenseRatio || '—') : '')); });
        lines.push('');
        lines.push('Roles: Core ' + fmtMoney(model.buckets.core.dollars) + ' / Enablers ' + fmtMoney(model.buckets.enabler.dollars) + ' / Satellite ' + fmtMoney(model.buckets.satellite.dollars) + ' / Defensive ' + fmtMoney(model.buckets.defensive.dollars) + ' / Cash ' + fmtMoney(model.buckets.cash.dollars));
        if (model.sleeves) { var sl = model.sleeves; lines.push('Groups: Broad ' + fmtMoney(sl.broad.dollars) + ' / Style ' + fmtMoney(sl.style.dollars) + ' / International ' + fmtMoney(sl.international.dollars) + ' / Bonds+Cash ' + fmtMoney(sl['bonds-cash'].dollars) + ' / Real Assets ' + fmtMoney(sl['real-assets'].dollars) + ' / Sectors ' + fmtMoney(sl.sectors.dollars) + ' / Thematic ' + fmtMoney(sl.thematic.dollars) + ' / Stocks ' + fmtMoney(sl.stocks.dollars)); }
        lines.push('How far it could drop: ' + model.profile.drawdown);
        lines.push('Illustrative model — not a recommendation for you. Consult a qualified advisor.');
        lines.push('Research updated Oct 17, 2026. No live prices.');
        var text = lines.join('\n');
        function done(msg){ copyBtn.textContent = msg; setTimeout(function(){ copyBtn.textContent = 'Copy plan'; }, 2000); }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function(){ done('Copied ✓'); }).catch(function(){ fallbackCopy(text, done); });
        } else { fallbackCopy(text, done); }
      });
    }
    function fallbackCopy(text, done){
      try {
        var ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta);
        done('Copied ✓');
      } catch(e) { done('Copy failed — select manually'); }
    }

    var printBtn = document.getElementById('printBtn');
    if (printBtn) printBtn.addEventListener('click', function(){ window.print(); });

    var resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function(){
        state = { amount:500, risk:'aggressive', horizon:'3-5', account:'taxable' };
        activated = false;
        activeModel = null;
        inputsChanged = false;
        var placeholder = document.getElementById('planPlaceholder');
        if (placeholder) placeholder.hidden = false;
        var content = document.getElementById('planContent');
        if (content) content.hidden = true;
        var notice = document.getElementById('rebuildNotice');
        if (notice) notice.hidden = true;
        var loadError = document.getElementById('loadError');
        if (loadError) loadError.hidden = true;
        var ph = document.getElementById('portfolioHeading');
        if (ph) ph.textContent = 'Your investment plan';
        renderInputs();
        syncUrlAndStorage();
      });
    }

    // Filter + search (plan table only)
    var filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
    var searchInput = document.getElementById('searchInput');
    filterBtns.forEach(function(btn){
      btn.addEventListener('click', function(){
        filterBtns.forEach(function(b){ b.classList.remove('active'); b.setAttribute('aria-pressed','false'); });
        btn.classList.add('active'); btn.setAttribute('aria-pressed','true');
        activeFilter = btn.getAttribute('data-filter') || 'all';
        applyFilterSearch();
      });
    });
    if (searchInput) {
      searchInput.addEventListener('input', function(){ searchQ = searchInput.value.trim().toLowerCase(); applyFilterSearch(); });
      searchInput.addEventListener('keydown', function(e){
        if (e.key !== 'Enter') return;
        e.preventDefault();
        var first = null;
        document.querySelectorAll('#portfolioBody tr').forEach(function(tr){
          if (!first && tr.style.display !== 'none') first = tr;
        });
        if (first) { openSecurity(first.getAttribute('data-sec-id'), searchInput); return; }
      });
    }
    var clearPlanBtn = document.getElementById('clearPlanFilters');
    if (clearPlanBtn) clearPlanBtn.addEventListener('click', function(){
      activeFilter = 'all'; searchQ = '';
      var si = document.getElementById('searchInput'); if (si) si.value = '';
      filterBtns.forEach(function(b){ var on = b.getAttribute('data-filter') === 'all'; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      applyFilterSearch();
    });

    // ---------- Security detail dialog (plan rows, search Enter) ----------
    var secDialog = document.getElementById('secDialog');
    var secBackdrop = document.getElementById('secBackdrop');
    var secBody = document.getElementById('secDialogBody');
    var secTitle = document.getElementById('secDialogTitle');
    var secClose = document.getElementById('secDialogClose');
    var secReturnFocus = null;
    function closeSecurity(){ if (secDialog) secDialog.hidden = true; if (secBackdrop) secBackdrop.hidden = true; var rf = secReturnFocus; secReturnFocus = null; if (rf && rf.focus) { try { rf.focus(); } catch(e) {} } }
    function findSecurity(idOrTicker){
      if (!idOrTicker) return null;
      var key = String(idOrTicker).toLowerCase();
      if (UNIVERSE && UNIVERSE[key]) return UNIVERSE[key];
      if (UNIVERSE) {
        var keys = Object.keys(UNIVERSE);
        for (var i = 0; i < keys.length; i++) {
          var s = UNIVERSE[keys[i]];
          if ((s.ticker || '').toLowerCase() === key || (s.id || '').toLowerCase() === key) return s;
        }
      }
      return null;
    }
    function openSecurity(idOrTicker, trigger){
      secReturnFocus = trigger || null;
      var s = findSecurity(idOrTicker);
      if (!s || !secDialog || !secBody || !activeModel) return;
      var row = null;
      for (var i = 0; i < activeModel.rows.length; i++) { if (activeModel.rows[i].sec.id === s.id) { row = activeModel.rows[i]; break; } }
      if (!row) return;
      var bull = (s.bull || []).map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('');
      var bear = (s.bear || []).map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('');
      var expLine = s.type === 'etf' ? ('<p><strong>Yearly fee:</strong> ' + esc(s.expenseRatio || '—') + ' (Verify before acting).</p>') : '';
      var inModel = '<p><strong>In your plan:</strong> ' + fmtMoney(row.dollars) + ' · ' + fmtPct(row.actualPct) + ' · ' + esc(s.bucketLabel || s.bucket) + '</p>';
      if (secTitle) secTitle.textContent = (s.ticker || s.id) + ' — ' + (s.name || '');
      secBody.innerHTML = '<p class="detail-thesis"><strong>Why we like it:</strong> ' + esc(s.thesis || '') + '</p>' + inModel
        + '<p><strong>Biggest risk:</strong> ' + esc(s.risk || '') + '</p>'
        + '<p><strong>Type:</strong> ' + (s.type === 'etf' ? 'ETF' : 'Stock') + ' · <strong>Role:</strong> ' + esc(s.bucketLabel || s.bucket || '') + ' · <strong>Group:</strong> ' + esc(SLEEVE_LABELS[s.sleeve] || s.sleeve || 'Individual Stocks') + '</p>'
        + '<div class="bull-bear"><div><h4>What could go right</h4><ul>' + bull + '</ul></div><div><h4>What could go wrong</h4><ul>' + bear + '</ul></div></div>'
        + '<p><strong>What to watch:</strong> ' + esc(s.keyMetric || '') + '</p>'
        + '<p><strong>What would change our mind:</strong> ' + esc(s.whatWouldChangeMind || '') + '</p>'
        + expLine
        + '<p><strong>Next earnings:</strong> ' + esc(s.earnings || '') + '</p>'
        + '<p class="calc-disclaimer"><strong>Illustrative research — not a recommendation for you. Consult a qualified advisor.</strong></p>';
      secDialog.hidden = false; if (secBackdrop) secBackdrop.hidden = false;
      var closeBtn = document.getElementById('secDialogClose');
      if (closeBtn) closeBtn.focus();
    }
    if (secClose) secClose.addEventListener('click', closeSecurity);
    if (secBackdrop) secBackdrop.addEventListener('click', closeSecurity);
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && secDialog && !secDialog.hidden) closeSecurity(); });
    var tbodyEl = document.getElementById('portfolioBody');
    if (tbodyEl) {
      tbodyEl.addEventListener('click', function(e){
        var tr = e.target && e.target.closest ? e.target.closest('tr[data-sec-id]') : null;
        if (tr) openSecurity(tr.getAttribute('data-sec-id'), tr);
      });
      tbodyEl.addEventListener('keydown', function(e){
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var tr = e.target && e.target.closest ? e.target.closest('tr[data-sec-id]') : null;
        if (tr) { e.preventDefault(); openSecurity(tr.getAttribute('data-sec-id'), tr); }
      });
    }

    renderInputs();
  });
})();
