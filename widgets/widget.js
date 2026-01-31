// Simple embeddable widget: finds all <div class="qso-widget" data-src="URL"></div>
// and fetches JSON from the URL, then renders a tiny table of stats.
(function(){
  function createTable(stats){
    var table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.fontFamily = 'Arial, sans-serif';
    table.style.fontSize = '13px';
    var addRow = function(k,v){
      var tr = document.createElement('tr');
      var th = document.createElement('th');
      th.textContent = k;
      th.style.textAlign = 'left';
      th.style.padding = '6px 8px';
      th.style.border = '1px solid #ddd';
      var td = document.createElement('td');
      td.textContent = v;
      td.style.padding = '6px 8px';
      td.style.border = '1px solid #ddd';
      tr.appendChild(th);
      tr.appendChild(td);
      table.appendChild(tr);
    };
    addRow('Total QSOs', stats.total);
    if(stats.unique_calls!==undefined) addRow('Unique Calls', stats.unique_calls);
    if(stats.longest_miles!==undefined) addRow('Longest (mi)', stats.longest_miles);
    if(stats.longest_call) addRow('Longest Call', stats.longest_call);
    if(stats.first_qso) addRow('First QSO', stats.first_qso);
    if(stats.last_qso) addRow('Last QSO', stats.last_qso);
    return table;
  }

  function summarizeArray(arr){
    var total = arr.length;
    var calls = new Set();
    var dates = [];
    var longest = {mi:0, call: null};
    var home = null;
    // try to find home from global json (widget caller will pass full json sometimes)
    // fallback: expect container consumer to set relative paths; we'll use home when available
    arr.forEach(function(it){
      if(it.call) calls.add(it.call);
      if(it.time || it.date) dates.push(it.time||it.date);
      if(it._home) home = it._home; // unused here
    });
    dates = dates.filter(Boolean).sort();
    return {
      total: total,
      unique_calls: calls.size,
      first_qso: dates.length? dates[0] : undefined,
      last_qso: dates.length? dates[dates.length-1] : undefined,
      longest_miles: undefined,
      longest_call: undefined
    };
  }

  // haversine distance in miles
  function haversineMi(lat1, lon1, lat2, lon2){
    var toRad = Math.PI/180;
    var R = 3958.8; // miles
    var dLat = (lat2-lat1)*toRad;
    var dLon = (lon2-lon1)*toRad;
    var a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*toRad)*Math.cos(lat2*toRad)*Math.sin(dLon/2)*Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  function renderError(container, msg){
    container.textContent = msg;
    container.style.color = '#900';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.fontSize = '13px';
  }

  async function loadWidget(container){
    var src = container.getAttribute('data-src');
    if(!src){ renderError(container, 'No data-src provided'); return; }
    container.innerHTML = '';
    var spinner = document.createElement('div');
    spinner.textContent = 'Loading…';
    spinner.style.fontFamily = 'Arial, sans-serif';
    spinner.style.fontSize = '13px';
    container.appendChild(spinner);
    try{
      var res = await fetch(src, {cache: 'no-store'});
      if(!res.ok) throw new Error('HTTP '+res.status);
      var json = await res.json();
      var stats;
      var contacts = null;
      if(Array.isArray(json)) contacts = json;
      else if(json && json.contacts && Array.isArray(json.contacts)) contacts = json.contacts;
      else if(json && json.qsos && Array.isArray(json.qsos)) contacts = json.qsos;

      if(contacts){
        // compute totals and longest distance from json.home if present
        var total = contacts.length;
        var calls = new Set();
        var dates = [];
        var longest_mi = 0;
        var longest_call = null;
        var home = (json && json.home) ? json.home : null;
        contacts.forEach(function(it){
          if(it.call) calls.add(it.call);
          if(it.qso_date || it.time || it.date) dates.push(it.qso_date || it.time || it.date);
          if(home && typeof it.lat === 'number' && typeof it.lon === 'number'){
            var mi = haversineMi(home.lat, home.lon, it.lat, it.lon);
            if(mi>longest_mi){ longest_mi = mi; longest_call = it.call; }
          }
        });
        stats = {
          total: total,
          unique_calls: calls.size,
          first_qso: dates.length? dates.sort()[0] : undefined,
          last_qso: dates.length? dates.sort()[dates.length-1] : undefined,
          longest_miles: longest_mi? Math.round(longest_mi): undefined,
          longest_call: longest_call
        };
      } else if(json && typeof json === 'object'){
        stats = {
          total: json.total || json.count || 0,
          unique_calls: json.unique_calls || json.unique || undefined,
          first_qso: json.first_qso || undefined,
          last_qso: json.last_qso || undefined,
          longest_miles: json.longest_miles || undefined,
          longest_call: json.longest_call || undefined
        };
      } else throw new Error('Unexpected JSON format');

      container.innerHTML = '';
      var layout = container.getAttribute('data-layout') || 'table';
      if(layout === 'horizontal'){
        // render a horizontal stat bar
        var bar = document.createElement('div');
        bar.style.display = 'flex';
        bar.style.gap = '12px';
        bar.style.alignItems = 'center';
        bar.style.fontFamily = 'Arial, sans-serif';
        bar.style.fontSize = '14px';
        bar.style.padding = '6px 8px';
        bar.style.background = 'rgba(255,255,255,0.95)';
        bar.style.border = '1px solid #ddd';
        bar.style.borderRadius = '4px';
        bar.style.width = '100%';
        var item = function(label, val){
          var d = document.createElement('div');
          var l = document.createElement('div'); l.textContent = label; l.style.fontWeight='600'; l.style.color='#444';
          var v = document.createElement('div'); v.textContent = val; v.style.color='#111';
          d.appendChild(l); d.appendChild(v);
          return d;
        };
        bar.appendChild(item('QSOs', stats.total));
        bar.appendChild(item('Longest (mi)', stats.longest_miles || '—'));
        bar.appendChild(item('Longest Call', stats.longest_call || '—'));
        container.appendChild(bar);
      } else {
        var table = createTable(stats);
        container.appendChild(table);
      }
    }catch(err){
      renderError(container, 'Widget load error: '+err.message);
    }
  }

  function init(){
    var nodes = document.querySelectorAll('.qso-widget');
    nodes.forEach(function(n){ loadWidget(n); });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
