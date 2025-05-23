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

// ====== Função para gerar 1–3 categorias aleatórias (simulação) ======
function gerarGruposPrioritarios() {
  const count = Math.floor(Math.random() * 3) + 1;
  const shuffled = [...categorias].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// ====== Carregamento de POIs via Overpass ======
function loadPOIs() {
  // remove antigos
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
    method: 'POST',
    body: query
  })
    .then(r => r.json())
    .then(data => {
      data.elements.forEach(el => {
        const tags = el.tags || {};
        if (!tags['addr:street']) return;

        const nome = tags.name || '(sem nome)';
        let endereco = tags['addr:street'];
        if (tags['addr:housenumber']) endereco += `, ${tags['addr:housenumber']}`;

        const gruposObjs = gerarGruposPrioritarios();
        const valores = gruposObjs.map(g => g.value);

        const htmlGrupos = `<br><em>Atende:</em><ul style="list-style:none;padding-left:0">` +
          gruposObjs.map(g => `
            <li style="display:flex;align-items:center;margin-bottom:4px">
              <img src="assets/${g.icone}" width="24" height="24" class="me-2">
              ${g.nome}
            </li>`).join('') +
        `</ul>`;

        const popupHTML = `<strong>${nome}</strong><br>${endereco}${htmlGrupos}`;

        const marker = L.marker([el.lat, el.lon], { icon: iconePadrao })
          .addTo(map)
          .bindPopup(popupHTML);

        markersList.push({ nome, marker, grupos: valores });
      });

      applyFilters();
    })
    .catch(err => console.error('Erro ao carregar POIs:', err));
}

map.whenReady(loadPOIs);

// ====== FILTROS ======
const filterCheckboxes = document.querySelectorAll('.dropdown-menu input[type=checkbox]');
filterCheckboxes.forEach(cb => cb.addEventListener('change', applyFilters));

function getSelectedFilters() {
  return Array.from(filterCheckboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);
}

function applyFilters() {
  const sel = getSelectedFilters();
  markersList.forEach(({ marker, grupos }) => {
    const ok = sel.length === 0 || sel.every(v => grupos.includes(v));
    ok ? map.addLayer(marker) : map.removeLayer(marker);
  });
}

// ====== AUTOCOMPLETE E BUSCA ENTRE MARCADORES ======
const searchInput = document.getElementById('search-input');
const searchBtn   = document.getElementById('search-btn');
const autoList    = document.getElementById('autocomplete-list');

// Atualiza sugestões ao digitar
searchInput.addEventListener('input', () => {
  const term = searchInput.value.trim().toLowerCase();
  autoList.innerHTML = '';

  if (!term) {
    autoList.classList.remove('show');
    return;
  }

  const matches = markersList
    .filter(p => p.nome.toLowerCase().includes(term))
    .slice(0, 5);

  if (matches.length === 0) {
    autoList.classList.remove('show');
    return;
  }

  matches.forEach(p => {
    const li = document.createElement('li');
    li.className = 'dropdown-item';
    li.textContent = p.nome;
    li.addEventListener('click', () => {
      flyToMarker(p);
      autoList.classList.remove('show');
    });
    autoList.appendChild(li);
  });

  autoList.classList.add('show');
});

// Fecha o dropdown ao clicar fora
document.addEventListener('click', e => {
  if (!searchInput.contains(e.target)) {
    autoList.classList.remove('show');
  }
});

// Centraliza e abre popup
function flyToMarker(p) {
  const { lat, lng } = p.marker.getLatLng();
  map.flyTo([lat, lng], 17, { animate: true });
  p.marker.openPopup();
}

// Busca completa ao clicar em “Buscar”
searchBtn.addEventListener('click', () => {
  const term = searchInput.value.trim().toLowerCase();
  if (!term) return;

  const found = markersList.find(p => p.nome.toLowerCase().includes(term));
  if (found) {
    flyToMarker(found);
  } else {
    alert('Nenhum local correspondente encontrado.');
  }
});
