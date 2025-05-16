

let map;
let markers = [];

/**
 * Inicialize aqui o Google Maps:
 * map = new google.maps.Map(document.getElementById('map'), {
 *   center: { lat: -23.55052, lng: -46.63331 },
 *   zoom: 13
 * });
 */
function initMap() {
  // TODO: implemente a criação do mapa com sua API key
}

function getSearchTerm() {
  return document.getElementById('search-input').value.trim();
}

function getSelectedFilters() {
  const checks = document.querySelectorAll('.dropdown-menu input[type="checkbox"]');
  return Array.from(checks)
    .filter(c => c.checked)
    .map(c => c.value);
}

function clearMarkers() {
  markers.forEach(m => m.setMap(null));
  markers = [];
}

function addMarkers(estabelecimentos) {
  estabelecimentos.forEach(e => {
    const pos = { lat: e.latitude, lng: e.longitude };
    const marker = new google.maps.Marker({
      position: pos,
      map,
      title: e.nome,
      icon: e.acessibilidade.includes('cadeirante')
        ? 'icons/wheelchair.png'
        : 'icons/default.png'
    });
    const info = new google.maps.InfoWindow({
      content: `<strong>${e.nome}</strong><br>${e.endereco}<br>Acessibilidade: ${e.acessibilidade.join(', ')}`
    });
    marker.addListener('click', () => info.open(map, marker));
    markers.push(marker);
  });
}

function fetchEstabelecimentos() {
  const nome = getSearchTerm();
  const filtros = getSelectedFilters();
  let qs = [];
  if (nome) qs.push(`nome=${encodeURIComponent(nome)}`);
  if (filtros.length) qs.push(`acessibilidade=${filtros.join(',')}`);
  const query = qs.length ? `?${qs.join('&')}` : '';
  fetch(`/api/estabelecimentos${query}`)
    .then(res => res.json())
    .then(data => {
      clearMarkers();
      addMarkers(data);
    })
    .catch(console.error);
}

document.getElementById('search-btn').addEventListener('click', fetchEstabelecimentos);
document.getElementById('search-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') fetchEstabelecimentos();
});

document.addEventListener('DOMContentLoaded', () => {
  initMap();
  fetchEstabelecimentos();
});
