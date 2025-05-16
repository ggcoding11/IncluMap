const map = L.map('map').setView([-23.41139330567758, -51.93118538009486], 13); // Maringá
//Aqui eu seto o local, as coordenadas


L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contribuidores'
}).addTo(map);

const iconeAcessivel = L.icon({
    iconUrl: 'assets/marcador.png',
    iconSize: [30, 30], // tamanho do ícone
    iconAnchor: [19, 38], // ponto do ícone que será posicionado na coordenada
    popupAnchor: [0, -38] // onde o popup aparece em relação ao ícone
});

//Guardei todas as informações sobre o ícone personalizado no L.icon


L.marker([-23.41139330567758, -51.93118538009486], { icon: iconeAcessivel })
  .addTo(map)
  .bindPopup(`oi`);



