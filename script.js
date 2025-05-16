const map = L.map('map').setView([-23.41139330567758, -51.93118538009486], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contribuidores'
}).addTo(map);

const iconePadrao = L.icon({
    iconUrl: 'assets/marcador.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});

// categorias com ícone correspondente
const categorias = [
    { nome: "Pessoas com deficiência física", icone: "cadeirante.png" },
    { nome: "Pessoas com deficiência visual", icone: "cedo.png" },
    { nome: "Pessoas com deficiência auditiva", icone: "surdo.png" },
    { nome: "Pessoas com deficiência intelectual", icone: "intelectual.png" },
    { nome: "Idosos", icone: "idoso.png" },
    { nome: "Gestantes", icone: "gravida.png" },
    { nome: "Pessoas com autismo", icone: "autismo.png" }
];

function gerarGruposPrioritarios() {
    const quantidade = Math.floor(Math.random() * 3) + 1;
    const embaralhado = [...categorias].sort(() => 0.5 - Math.random());
    return embaralhado.slice(0, quantidade);
}

function loadPOIs() {
    const b = map.getBounds();
    const bbox = [
        b.getSouth(),
        b.getWest(),
        b.getNorth(),
        b.getEast()
    ].join(',');

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
        .then(res => res.json())
        .then(data => {
            data.elements.forEach(el => {
                const tags = el.tags || {};
                if (!tags['addr:street']) return;

                const lat = el.lat;
                const lon = el.lon;
                const nome = tags.name || '(sem nome)';

                let endereco = tags['addr:street'];
                if (tags['addr:housenumber']) {
                    endereco += ', ' + tags['addr:housenumber'];
                }

                const grupos = gerarGruposPrioritarios();
                const popupHTML = `
          <strong>${nome}</strong><br>
          ${endereco}<br><br>
          <em>Atende:</em><br>
          <ul style="padding-left: 0; list-style: none;">
            ${grupos.map(g => `
              <li style="display: flex; align-items: center; margin-bottom: 4px;">
                <img src="assets/${g.icone}" style="width: 32px; height: 32px; margin-right: 8px;" alt="">
                ${g.nome}
              </li>`).join('')}
          </ul>
        `;

                L.marker([lat, lon], { icon: iconePadrao })
                    .addTo(map)
                    .bindPopup(popupHTML);
            });
        })
        .catch(err => console.error('Erro ao carregar POIs:', err));
}

map.whenReady(loadPOIs);
map.on('moveend', loadPOIs);
