// script.js

// ====== Inicialização do mapa ======
const map = L.map('map')
  .setView([-23.41139330567758, -51.93118538009486], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contribuidores'
}).addTo(map);

// ícone padrão azul
const iconePadrao = L.icon({
  iconUrl: 'assets/marcador.png',
  iconSize:   [30, 30],
  iconAnchor: [15, 30],
  popupAnchor:[0, -30]
});

// categorias com valor pra filtro + ícone + nome de exibição
const categorias = [
  { value: "cadeirante", nome: "Pessoas com deficiência física", icone: "cadeirante.png" },
  { value: "visual",     nome: "Pessoas com deficiência visual", icone: "cedo.png" },
  { value: "auditiva",   nome: "Pessoas com deficiência auditiva", icone: "surdo.png" },
  { value: "intelectual",nome: "Pessoas com deficiência intelectual", icone: "intelectual.png" },
  { value: "idoso",      nome: "Idosos",                          icone: "idoso.png" },
  { value: "gravida",    nome: "Gestantes",                      icone: "gravida.png" },
  { value: "autismo",    nome: "Pessoas com autismo",            icone: "autismo.png" }
];

// array global de { nome, marker, grupos: [value,...] }
let markersList = [];

/**
 * Gera de 1 a 3 categorias aleatórias para simular dados de atendimento.
 * Retorna um array de objetos da const categorias.
 */
function gerarGruposPrioritarios() {
  const quantidade = Math.floor(Math.random() * 3) + 1;
  const shuffled = [...categorias].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, quantidade);
}

/**
 * Carrega POIs via Overpass e popula markersList.
 * Cada entrada de markersList terá:
 *   { nome: string, marker: L.Marker, grupos: [value,...] }
 */
function loadPOIs() {
  // remove marcadores antigos
  markersList.forEach(p => map.removeLayer(p.marker));
  markersList = [];

  const b    = map.getBounds();
  const bbox = [b.getSouth(), b.getWest(), b.getNorth(), b.getEast()].join(',');

  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="theatre"](${bbox});
      node["amenity"="restaurant"](${bbox});
      node["shop"](${bbox});
      node["amenity"="cinema"](${bbox});
      node["amenity"="hairdresser"](${bbox});
    );
    out body;
  `;

  fetch('https://overpass-api.de/api/interpreter', {
    method:'POST',
    body: query
  })
    .then(r => r.json())
    .then(data => {
      data.elements.forEach(el => {
        const tags = el.tags || {};
        if (!tags['addr:street']) return; // pula sem endereço

        // monta dados básicos
        const nome = tags.name || '(sem nome)';
        let endereco = tags['addr:street'];
        if (tags['addr:housenumber']) endereco += `, ${tags['addr:housenumber']}`;

        // gera categorias simuladas
        const gruposObjs = gerarGruposPrioritarios();
        const gruposVals = gruposObjs.map(g => g.value);

        // monta HTML do popup
        const htmlGrupos = `<br><em>Atende:</em><ul style="list-style:none;padding-left:0">` +
          gruposObjs.map(g => `
            <li style="display:flex;align-items:center;margin-bottom:4px">
              <img src="assets/${g.icone}" width="24" height="24" class="me-2">
              ${g.nome}
            </li>
          `).join('') +
        `</ul>`;

        const popupHTML = `
          <strong>${nome}</strong><br>
          ${endereco}
          ${htmlGrupos}
        `;

        // cria marker e adiciona ao mapa
        const marker = L.marker([el.lat, el.lon], { icon: iconePadrao })
          .addTo(map)
          .bindPopup(popupHTML);

        // guarda para autocomplete e filtro
        markersList.push({ nome, marker, grupos: gruposVals });
      });

      // após recarregar marcadores, reaplica o filtro atual
      applyFilters();
    })
    .catch(err => console.error('Erro ao carregar POIs:', err));
}

// recarrega quando o mapa estiver pronto e após cada movimento
map.whenReady(loadPOIs);


// ====== AUTOCOMPLETE & BUSCA POR NOME ======
const input      = document.getElementById('search-input');
const btnSearch  = document.getElementById('search-btn');
const listEl     = document.getElementById('autocomplete-list');

function renderSuggestions(arr) {
  listEl.innerHTML = '';
  arr.forEach(({ nome, marker }) => {
    const li = document.createElement('li');
    li.className = 'list-group-item list-group-item-action';
    li.textContent = nome;
    li.addEventListener('click', () => selectSuggestion(marker));
    listEl.appendChild(li);
  });
}

function selectSuggestion(marker) {
  const { lat, lng } = marker.getLatLng();
  map.setView([lat, lng], 17, { animate: true });
  marker.openPopup();
  listEl.innerHTML = '';
  input.value = '';
}

input.addEventListener('input', () => {
  const term = input.value.trim().toLowerCase();
  if (!term) return listEl.innerHTML = '';
  const matches = markersList.filter(p =>
    p.nome.toLowerCase().includes(term)
  );
  renderSuggestions(matches);
});

btnSearch.addEventListener('click', () => {
  const term = input.value.trim().toLowerCase();
  const match = markersList.find(p =>
    p.nome.toLowerCase() === term
  );
  if (match) selectSuggestion(match.marker);
});


// ====== FILTROS ======
const filterCheckboxes = document.querySelectorAll('.dropdown-menu input[type=checkbox]');

/** 
 * Lê valores dos checkboxes marcados e retorna array de strings
 */
function getSelectedFilters() {
  return Array.from(filterCheckboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);
}

/**
 * Exibe ou oculta marcadores de acordo com os filtros selecionados.
 * - Se nenhum filtro estiver marcado, mostra tudo.
 * - Senão, mostra apenas quem tiver pelo menos uma categoria em comum.
 */
function applyFilters() {
    const selected = getSelectedFilters(); // ex: ['cadeirante','idoso']
    markersList.forEach(({ marker, grupos }) => {
      const match = selected.length === 0
        ? true
        // agora exige que **todas** as categorias selecionadas estejam em grupos
        : selected.every(val => grupos.includes(val));
  
      if (match) {
        if (!map.hasLayer(marker)) marker.addTo(map);
      } else {
        if (map.hasLayer(marker)) marker.remove();
      }
    });
  }

// vincula a função a cada checkbox
filterCheckboxes.forEach(cb =>
  cb.addEventListener('change', applyFilters)
);
