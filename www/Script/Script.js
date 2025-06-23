const clientLines = {};
let currentClient = "Client 1";

const container = document.getElementById("lines-container");
const clientSelect = document.getElementById("client");
const resultTable = document.getElementById("result-table");
const headerRow = document.getElementById("header-row");
const resultTableBody = resultTable.querySelector("tbody");

clientSelect.addEventListener("change", () => {
  saveCurrentLines();
  currentClient = clientSelect.value;
  loadClientLines();
});

function addLine(designationVal = "", cadreVal = "") {
  const line = document.createElement("div");
  line.className = "line";

  const designationInput = document.createElement("input");
  designationInput.placeholder = "Désignation";
  designationInput.value = designationVal;

  const cadreInput = document.createElement("input");
  cadreInput.placeholder = "Quantité (ex : 5 ou -3)";
  cadreInput.value = cadreVal;

  const removeBtn = document.createElement("button");
  removeBtn.textContent = "Supprimer";
  removeBtn.onclick = () => line.remove();

  line.appendChild(designationInput);
  line.appendChild(cadreInput);
  line.appendChild(removeBtn);
  container.appendChild(line);
}

function saveCurrentLines() {
  const lines = [];
  for (const line of container.children) {
    const inputs = line.getElementsByTagName("input");
    if (inputs.length === 2) {
      const designation = inputs[0].value.trim();
      const cadre = inputs[1].value.trim();
      lines.push([designation, cadre]);
    }
  }
  clientLines[currentClient] = lines;
}

function loadClientLines() {
  container.innerHTML = "";
  const lines = clientLines[currentClient] || [];
  if (lines.length === 0) {
    addLine();
  } else {
    for (const [designation, cadre] of lines) {
      addLine(designation, cadre);
    }
  }
}

function faireDebit() {
  saveCurrentLines();
  const lignes = clientLines[currentClient] || [];
  if (lignes.length === 0) {
    alert(`Aucune ligne valide pour ${currentClient}`);
    return;
  }

  // Extraire toutes les désignations uniques
  const allDesignations = new Set();
  for (const client in clientLines) {
    clientLines[client].forEach(([designation, _]) => {
      if (designation) allDesignations.add(designation);
    });
  }
  const designations = Array.from(allDesignations);

  // Mettre à jour l'en-tête du tableau
  headerRow.innerHTML = "<th>Client</th>";
  designations.forEach(designation => {
    const th = document.createElement("th");
    th.textContent = designation;
    headerRow.appendChild(th);
  });
  const totalTh = document.createElement("th");
  totalTh.textContent = "Total Besoins";
  headerRow.appendChild(totalTh);

  // Mettre à jour ou ajouter la ligne du client
  let clientRow = Array.from(resultTableBody.rows).find(row => row.cells[0].textContent === currentClient);
  if (!clientRow) {
    clientRow = resultTableBody.insertRow();
    const clientCell = clientRow.insertCell();
    clientCell.textContent = currentClient;
    designations.forEach(() => clientRow.insertCell());
    clientRow.insertCell(); // Cellule pour le total
  }

  // Réinitialiser les cellules de désignation
  for (let i = 1; i <= designations.length; i++) {
    clientRow.cells[i].textContent = "";
  }

  // Remplir les cellules avec les valeurs de cadre
  let totalBesoins = 0;
  lignes.forEach(([designation, cadreStr]) => {
    const index = designations.indexOf(designation);
    if (index !== -1) {
      const cadre = parseFloat(cadreStr);
      clientRow.cells[index + 1].textContent = isNaN(cadre) ? "" : cadre;
      if (!isNaN(cadre)) totalBesoins += cadre;
    }
  });

  // Mettre à jour la cellule du total
  clientRow.cells[designations.length + 1].textContent = totalBesoins;
}

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

// Initialisation
addLine();