const state = { prime: {}, subs: [] }; // sub: {id,name,cage,contact,email,subcontract,cui:'yes'|'no'|'unknown',sprs,assessDate,noticeSent,ackReceived,irPoc}
const LS_KEY = 'flowdown-v1';
const $ = (id) => document.getElementById(id);
let uid = 1;

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {} }
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
    if (d) { Object.assign(state.prime, d.prime || {}); state.subs = d.subs || []; }
  } catch (e) {}
  uid = state.subs.reduce((m, s) => Math.max(m, s.id || 0), 0) + 1;
}

function flowdownFor(sub) {
  if (sub.cui === 'yes') {
    return {
      needed: true,
      clauses: ['252.204-7012 (mandatory: safeguard CUI, 72-hour incident reporting, flow down further)',
        '252.204-7019 / 7020 (current NIST 800-171 assessment in SPRS)',
        '252.204-7021 (if the prime contract specifies a CMMC level)'],
      owes: ['Current SPRS assessment score and assessment date',
        'Incident response point of contact',
        'Written acknowledgment of these requirements',
        'Incident notification to the prime within 24 hours of discovery'],
    };
  }
  if (sub.cui === 'unknown') return { needed: null, clauses: [], owes: [] };
  return { needed: false, clauses: [], owes: [] };
}

function updateStats() {
  const cui = state.subs.filter(s => s.cui === 'yes');
  const sent = cui.filter(s => s.noticeSent);
  const acked = cui.filter(s => s.ackReceived);
  const noSprs = cui.filter(s => !String(s.sprs || '').trim());
  $('stats').innerHTML =
    stat(state.subs.length, 'subcontractors tracked') +
    stat(cui.length, 'handle CUI') +
    stat(sent.length + '/' + cui.length, 'notices sent') +
    stat(acked.length + '/' + cui.length, 'acknowledged') +
    stat(noSprs.length, 'CUI subs with no SPRS score');
}
function stat(n, label) {
  return '<div class="stat"><div class="stat-n">' + n + '</div><div class="stat-l">' + label + '</div></div>';
}

function renderSubs() {
  $('subs').innerHTML = state.subs.length ? state.subs.map(s => {
    const fd = flowdownFor(s);
    const badge = fd.needed === true ? '<span class="badge need">FLOW-DOWN REQUIRED</span>'
      : fd.needed === false ? '<span class="badge ok">no flow-down</span>'
      : '<span class="badge warnb">determine CUI status</span>';
    return '<div class="sub" data-sub="' + s.id + '">' +
      '<div class="sub-head"><strong>' + esc(s.name || 'Unnamed subcontractor') + '</strong> ' + badge +
      '<button class="linklike" data-delsub="' + s.id + '">remove</button></div>' +
      '<div class="grid3">' +
      '<label class="fld sm">Subcontractor name <input data-f="name" value="' + esc(s.name) + '"></label>' +
      '<label class="fld sm">CAGE <input data-f="cage" value="' + esc(s.cage) + '"></label>' +
      '<label class="fld sm">Subcontract # <input data-f="subcontract" value="' + esc(s.subcontract) + '"></label>' +
      '<label class="fld sm">Contact name <input data-f="contact" value="' + esc(s.contact) + '"></label>' +
      '<label class="fld sm">Contact email <input data-f="email" value="' + esc(s.email) + '"></label>' +
      '<label class="fld sm">Handles CUI? <select data-f="cui">' +
      [['', 'Select…'], ['yes', 'Yes'], ['no', 'No'], ['unknown', 'Not sure yet']].map(o =>
        '<option value="' + o[0] + '"' + (s.cui === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') +
      '</select></label>' +
      '<label class="fld sm">SPRS score <input data-f="sprs" value="' + esc(s.sprs) + '" placeholder="e.g., 88"></label>' +
      '<label class="fld sm">Assessment date <input data-f="assessDate" type="date" value="' + esc(s.assessDate) + '"></label>' +
      '<label class="fld sm">IR point of contact <input data-f="irPoc" value="' + esc(s.irPoc) + '" placeholder="Name, phone"></label>' +
      '</div>' +
      (fd.needed === true ?
        '<div class="fdbox"><h4>What this sub owes you</h4><ul>' +
        fd.owes.map(o => '<li>' + esc(o) + '</li>').join('') + '</ul>' +
        '<h4>Clauses to flow down</h4><ul>' + fd.clauses.map(c => '<li>' + esc(c) + '</li>').join('') + '</ul>' +
        '<div class="row"><label class="check"><input type="checkbox" data-f="noticeSent"' + (s.noticeSent ? ' checked' : '') + '> Notice sent' + (s.noticeSent ? ' (' + esc(s.noticeSent) + ')' : '') + '</label>' +
        '<label class="check"><input type="checkbox" data-f="ackReceived"' + (s.ackReceived ? ' checked' : '') + '> Acknowledgment received</label></div></div>'
        : '') +
      '</div>';
  }).join('') : '<p class="muted">No subcontractors yet. Add your first one above.</p>';

  $('subs').querySelectorAll('[data-sub] [data-f]').forEach(inp => {
    inp.addEventListener('change', () => {
      const id = +inp.closest('[data-sub]').dataset.sub;
      const s = state.subs.find(x => x.id === id);
      if (inp.type === 'checkbox') {
        s[inp.dataset.f] = inp.checked ? new Date().toISOString().slice(0, 10) : '';
      } else s[inp.dataset.f] = inp.value;
      save(); renderSubs(); renderLetters(); updateStats();
    });
  });
  $('subs').querySelectorAll('[data-delsub]').forEach(b => {
    b.addEventListener('click', () => {
      if (confirm('Remove this subcontractor?')) {
        state.subs = state.subs.filter(x => x.id !== +b.dataset.delsub);
        save(); renderSubs(); renderLetters(); updateStats();
      }
    });
  });
}

function letterFor(s) {
  const p = state.prime;
  const today = new Date().toISOString().slice(0, 10);
  const fd = flowdownFor(s);
  let L = 'SUBCONTRACTOR CYBERSECURITY FLOW-DOWN NOTICE\n\n';
  L += 'Date: ' + today + '\n';
  L += 'From: ' + (p.pi_company || '[Prime company]') + ' (' + (p.pi_name || '[Name, Title]') + ', ' + (p.pi_email || '[email]') + ')\n';
  L += 'To: ' + (s.name || '[Subcontractor]') + ' (' + (s.contact || '[contact]') + ', ' + (s.email || '[email]') + ')\n';
  L += 'Re: Prime contract ' + (p.pi_contract || '[contract number]') + ' / Subcontract ' + (s.subcontract || '[number]') + '\n\n';
  L += 'Our prime contract includes DFARS 252.204-7012 (Safeguarding Covered Defense Information and Cyber Incident Reporting). ' +
    'That clause requires us to flow its safeguarding and incident-reporting requirements down to every subcontractor that will handle covered defense information. ' +
    'Your company has been identified as handling CUI under the subcontract above.\n\n';
  L += 'WHAT THIS REQUIRES OF YOU\n\n';
  L += '1. Implement the NIST SP 800-171 security requirements to safeguard covered defense information on your systems.\n';
  L += '2. Maintain a current NIST SP 800-171 assessment in SPRS (DFARS 252.204-7019 / 7020).\n';
  L += '3. Report any cyber incident to us within 24 hours of discovery so we can meet our 72-hour reporting obligation to DoD. Do not wait for your investigation to conclude.\n';
  L += '4. Preserve forensic images and system access related to any incident for review.\n';
  L += '5. Flow these same requirements down to your subcontractors that will handle covered defense information.\n';
  if (fd.clauses.length > 1) L += '6. Additional clauses flowed down under this subcontract: ' + fd.clauses.slice(1).join('; ') + '.\n';
  L += '\nWHAT WE NEED BACK FROM YOU\n\n';
  fd.owes.forEach((o, i) => { L += (i + 1) + '. ' + o + '.\n'; });
  L += '\nThis notice summarizes contract requirements for planning purposes. The subcontract terms, including the flowed-down DFARS clauses, control in all cases. ' +
    'Please direct questions to ' + (p.pi_email || '[prime contact email]') + '.\n';
  return L;
}

function renderLetters() {
  const cui = state.subs.filter(s => s.cui === 'yes');
  $('letters').innerHTML = cui.length ? cui.map(s =>
    '<div class="letter-row"><span><strong>' + esc(s.name || 'Unnamed') + '</strong>' +
    (s.noticeSent ? ' <span class="muted small">sent ' + esc(s.noticeSent) + '</span>' : '') + '</span>' +
    '<span><button class="btn sm" data-preview="' + s.id + '">Preview</button> ' +
    '<button class="btn sm primary" data-dl="' + s.id + '">Download notice</button></span></div>' +
    '<pre class="letter-preview hidden" data-prev="' + s.id + '"></pre>').join('')
    : '<p class="muted">Notices appear here for subcontractors marked as handling CUI.</p>';
  $('letters').querySelectorAll('[data-preview]').forEach(b => {
    b.addEventListener('click', () => {
      const s = state.subs.find(x => x.id === +b.dataset.preview);
      const pre = document.querySelector('[data-prev="' + s.id + '"]');
      pre.textContent = letterFor(s);
      pre.classList.toggle('hidden');
    });
  });
  $('letters').querySelectorAll('[data-dl]').forEach(b => {
    b.addEventListener('click', () => {
      const s = state.subs.find(x => x.id === +b.dataset.dl);
      download('flowdown-notice-' + (s.name || 'sub').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.md', letterFor(s), 'text/markdown');
      if (!s.noticeSent) { s.noticeSent = new Date().toISOString().slice(0, 10); save(); renderSubs(); renderLetters(); updateStats(); }
    });
  });
}

function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

function csvCell(v) {
  v = String(v == null ? '' : v).replace(/\r?\n/g, ' | ');
  return /[",]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}

async function init() {
  load();
  for (const k of ['pi_company', 'pi_name', 'pi_contract', 'pi_email']) {
    if (state.prime[k]) $(k).value = state.prime[k];
    $(k).addEventListener('change', () => { state.prime[k] = $(k).value; save(); });
  }
  renderSubs();
  renderLetters();
  updateStats();
  $('addSub').addEventListener('click', () => {
    state.subs.push({ id: uid++, name: '', cage: '', contact: '', email: '', subcontract: '', cui: '', sprs: '', assessDate: '', noticeSent: '', ackReceived: '', irPoc: '' });
    save(); renderSubs(); renderLetters(); updateStats();
  });
  $('exportCsv').addEventListener('click', () => {
    const head = ['Name', 'CAGE', 'Subcontract #', 'Contact', 'Email', 'Handles CUI', 'Flow-down required', 'SPRS score', 'Assessment date', 'Notice sent', 'Acknowledged', 'IR POC'];
    const lines = [head.join(',')].concat(state.subs.map(s => {
      const fd = flowdownFor(s);
      return [s.name, s.cage, s.subcontract, s.contact, s.email, s.cui,
        fd.needed === true ? 'YES' : fd.needed === false ? 'no' : 'undetermined',
        s.sprs, s.assessDate, s.noticeSent, s.ackReceived ? 'yes' : 'no', s.irPoc].map(csvCell).join(',');
    }));
    download('subcontractor-register.csv', lines.join('\n'), 'text/csv');
  });
  $('printBtn').addEventListener('click', () => window.print());
  $('resetAll').addEventListener('click', () => {
    if (confirm('Clear all flow-down data?')) {
      state.subs = []; Object.keys(state.prime).forEach(k => delete state.prime[k]);
      save(); renderSubs(); renderLetters(); updateStats();
    }
  });
}
init();
