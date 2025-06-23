// Tabs Logic
const tabs = document.querySelectorAll('[data-tab-value]');
const tabInfos = document.querySelectorAll('[data-tab-info]');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = document.querySelector(tab.dataset.tabValue);

    tabInfos.forEach(tabInfo => tabInfo.classList.remove('active'));
    tabs.forEach(t => t.classList.remove('active'));

    tab.classList.add('active');
    target.classList.add('active');
  });
});

/* ---------- import Excel ---------- */
document.getElementById('excelFile').addEventListener('change', handleExcel, false);

function handleExcel(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = event => {
    const data      = new Uint8Array(event.target.result);
    const workbook  = XLSX.read(data, { type: 'array' });
    const sheet     = workbook.Sheets[workbook.SheetNames[0]];
   const rows = XLSX.utils.sheet_to_json(sheet, {
  defval: '',
  range: 3 // ligne 4
});

    // Nettoyer d'abord tous les onglets (hors General)
    tabInfos.forEach(tab => {
      if (tab.id !== 'tab_0') tab.innerHTML = '';
    });

    // Grouper par famille et injecter
    const grouped = {};
    rows.forEach(row => {
      const fam = (row.FAMILLE || '').trim();
      if (!fam) return;                         // aucune famille
      if (!grouped[fam]) grouped[fam] = [];
      grouped[fam].push(row);
    });

    Object.entries(grouped).forEach(([fam, list]) => {
  const targetTab = Array.from(tabInfos).find(t => t.id !== 'tab_0' &&
                                                   tabsNamed(t.id) === fam);
  if (!targetTab) return;

  const table = document.createElement('table');
  table.className = 'excel-table';

  const thead = document.createElement('thead');
  thead.innerHTML = `<tr>
    ${Object.keys(list[0]).map(h => `<th>${h}</th>`).join('')}
  </tr>`;
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  list.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = Object.values(r).map(v => `<td>${v}</td>`).join('');
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  // Ajoute le tableau
  targetTab.appendChild(table);

  // Crée un bouton "Imprimer"
  const printBtn = document.createElement('button');
  printBtn.textContent = 'Imprimer cette famille';
  printBtn.className = 'print-button';

  // Ajoute l'action d'impression
  printBtn.addEventListener('click', () => {
    const tableClone = table.cloneNode(true);
    // Supprimer lignes avec TOTAL == 0
    const rows = tableClone.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      const totalIndex = Array.from(tableClone.querySelectorAll('th')).findIndex(th => th.textContent.trim().toUpperCase() === 'TOTAL');
      if (totalIndex >= 0 && cells[totalIndex].textContent.trim() === '0') {
        row.remove();
      }
    });

    // Ouvre une fenêtre pour impression
    const win = window.open('', '', 'height=700,width=900');
    win.document.write('<html><head><title>Impression</title>');
    win.document.write('<style>table {border-collapse: collapse; width: 100%;} th, td {border: 1px solid #000; padding: 4px;}</style>');
    win.document.write('</head><body>');
    win.document.write(`<h3>${fam}</h3>`);
    win.document.write(tableClone.outerHTML);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  });

  // Ajoute le bouton sous le tableau
  targetTab.appendChild(printBtn);
});

    document.getElementById('importMsg').textContent = 
      `Import terminé : ${rows.length} lignes réparties dans ${Object.keys(grouped).length} familles.`;
  };
  reader.readAsArrayBuffer(file);
}

/* ---------- utilitaire : correspondance id->label ---------- */
function tabsNamed(tabId) {
  const span = Array.from(tabs).find(s => s.dataset.tabValue === `#${tabId}`);
  return span ? span.textContent.trim() : '';
}
// Initialisation
addLine();
