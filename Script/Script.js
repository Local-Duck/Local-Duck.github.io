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

/* ---------- Excel Import and Table Management ---------- */
document.getElementById('excelFile').addEventListener('change', handleExcel, false);

function handleExcel(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = event => {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: '',
      range: 3 // ligne 4
    });

    // Clear all tabs except General
    tabInfos.forEach(tab => {
      if (tab.id !== 'tab_0') tab.innerHTML = '';
    });

    // Group by family
    const grouped = {};
    rows.forEach(row => {
      const fam = (row.FAMILLE || '').trim();
      if (!fam) return;
      if (!grouped[fam]) grouped[fam] = [];
      grouped[fam].push(row);
    });

    // Process each family
    Object.entries(grouped).forEach(([fam, list]) => {
      const targetTab = Array.from(tabInfos).find(t => 
        t.id !== 'tab_0' && tabsNamed(t.id) === fam
      );
      if (!targetTab) return;

      createFamilyTable(targetTab, fam, list);
    });

    document.getElementById('importMsg').textContent = 
      `Import terminé : ${rows.length} lignes réparties dans ${Object.keys(grouped).length} familles.`;
  };
  reader.readAsArrayBuffer(file);
}

function createFamilyTable(targetTab, fam, data) {
  const table = document.createElement('table');
  table.className = 'excel-table editable-table';
  table.setAttribute('data-famille', fam);

  // Create table header
  const thead = document.createElement('thead');
  thead.innerHTML = `<tr>${Object.keys(data[0]).map(h => `<th>${h}</th>`).join('')}</tr>`;
  table.appendChild(thead);

  // Create table body
  const tbody = document.createElement('tbody');
  data.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = Object.values(row).map(v => `<td>${v}</td>`).join('');
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  // Add table to tab
  targetTab.appendChild(table);

  // Apply Excel formulas
  applyExcelFormulas(table);

  // Add control buttons
  addTableButtons(targetTab, table, fam);
}

function applyExcelFormulas(table) {
  const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
  
  // Création d'un index des colonnes (insensible à la casse)
  const colIndex = {};
  headers.forEach((name, index) => {
    colIndex[name.toLowerCase()] = index;
  });

  table.querySelectorAll('tbody tr').forEach(tr => {
    const cells = tr.querySelectorAll('td');
    
    const calculateAll = () => {
      // Fonction helper pour obtenir la valeur numérique d'une cellule
      const getNum = (colName) => {
        const idx = colIndex[colName.toLowerCase()];
        return idx !== undefined ? parseFloat(cells[idx].textContent.replace(',', '.')) || 0 : 0;
      };

      // 1. Calcul du TOTAL (colonne N) = SOMME(I:M)
      if (colIndex['total']) {
        const sum = 
          getNum('h5') +  // I
          getNum('h4') +  // J
          getNum('h3') +  // K
          getNum('h8') +  // L
          getNum('h7');   // M
        
        cells[colIndex['total']].textContent = sum.toFixed(2);
      }

      // 2. Calcul Qté+10% (colonne O) = M * 1.1
      if (colIndex['qté+10%'] && colIndex['total']) {
        const total = getNum('total');
        cells[colIndex['qté+10%']].textContent = (total * 1.1).toFixed(2);
      }

      // 3. Calcul Solde Stock (colonne U) = N - T
      if (colIndex['solde stock'] && colIndex['qté+10%'] && colIndex['stock']) {
        const qtePlus10 = getNum('qté+10%');
        const stock = getNum('stock');
        cells[colIndex['solde stock']].textContent = (qtePlus10 - stock).toFixed(2);
      }
    };

    // Écoute les modifications sur toutes les cellules
    cells.forEach(cell => {
      cell.addEventListener('input', calculateAll);
    });

    // Calcul initial
    calculateAll();
  });
}

function addTableButtons(targetTab, table, fam) {
  // Edit/Save button
  const editBtn = document.createElement('button');
  editBtn.textContent = 'Modifier';
  editBtn.className = 'edit-button';
  
  let isEditing = false;
  editBtn.addEventListener('click', () => {
    isEditing = !isEditing;
    editBtn.textContent = isEditing ? 'Valider' : 'Modifier';
    
    const cells = table.querySelectorAll('tbody td');
    cells.forEach(cell => {
      cell.contentEditable = isEditing;
      cell.style.backgroundColor = isEditing ? '#fff9c4' : '';
    });

    if (!isEditing) {
      saveTableData(fam, table);
    }
  });

  // Print button
  const printBtn = document.createElement('button');
  printBtn.textContent = 'Imprimer cette famille';
  printBtn.className = 'print-button';
  printBtn.addEventListener('click', () => printTable(fam, table));

  // Add buttons to tab
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'table-controls';
  buttonContainer.appendChild(editBtn);
  buttonContainer.appendChild(printBtn);
  targetTab.appendChild(buttonContainer);
}

function printTable(fam, table) {
  const tableClone = table.cloneNode(true);
  const rows = tableClone.querySelectorAll('tbody tr');
  
  // Remove rows with TOTAL = 0
  const totalIndex = Array.from(tableClone.querySelectorAll('th')).findIndex(
    th => th.textContent.trim().toUpperCase() === 'TOTAL'
  );
  
  if (totalIndex >= 0) {
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells[totalIndex]?.textContent.trim() === '0') {
        row.remove();
      }
    });
  }

  const win = window.open('', '', 'height=700,width=900');
  win.document.write(`
    <html>
      <head>
        <title>Impression ${fam}</title>
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #000; padding: 4px; }
          h3 { text-align: center; }
        </style>
      </head>
      <body>
        <h3>${fam}</h3>
        ${tableClone.outerHTML}
      </body>
    </html>
  `);
  win.document.close();
  win.print();
}

function saveTableData(famille, table) {
  const data = [];
  const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent);
  
  table.querySelectorAll('tbody tr').forEach(tr => {
    const row = {};
    tr.querySelectorAll('td').forEach((td, i) => {
      row[headers[i]] = td.textContent;
    });
    data.push(row);
  });
  
  localStorage.setItem(`tableData_${famille}`, JSON.stringify(data));
}

function loadSavedTables() {
  tabInfos.forEach(tab => {
    if (tab.id !== 'tab_0') {
      const famille = tabsNamed(tab.id);
      const savedData = localStorage.getItem(`tableData_${famille}`);
      
      if (savedData) {
        const data = JSON.parse(savedData);
        createFamilyTable(tab, famille, data);
      }
    }
  });
}

function tabsNamed(tabId) {
  const span = Array.from(tabs).find(s => s.dataset.tabValue === `#${tabId}`);
  return span ? span.textContent.trim() : '';
}

// Initialize on load
document.addEventListener('DOMContentLoaded', loadSavedTables);
