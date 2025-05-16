let locais = [
    { nome: "Teatro Calil Haddad", lat: -23.4273, lng: -51.9369 },
    { nome: "Teatro Barracão Paulo Mantovani", lat: -23.4205, lng: -51.9330 },
    { nome: "Teatro Marista", lat: -23.4200, lng: -51.9400 },
    { nome: "Armazém Restaurante", lat: -23.4265, lng: -51.9330 },
    { nome: "Habanero Grill", lat: -23.4250, lng: -51.9300 },
    { nome: "Baco Espaço Gastronômico", lat: -23.4250, lng: -51.9300 },
    { nome: "Barolo Trattoria", lat: -23.4250, lng: -51.9300 },
    { nome: "Black Bull Steakhouse", lat: -23.4250, lng: -51.9300 },
    { nome: "Casa da Mãe Joana", lat: -23.4250, lng: -51.9300 },
    { nome: "Boaz Café e Restaurante", lat: -23.4250, lng: -51.9300 },
    { nome: "Lojas Renner – Maringá Park", lat: -23.4250, lng: -51.9300 },
    { nome: "Lupo – Maringá Park", lat: -23.4250, lng: -51.9300 },
    { nome: "L’Occitane au Brésil – Maringá Park", lat: -23.4250, lng: -51.9300 },
    { nome: "Track&Field – Maringá Park", lat: -23.4250, lng: -51.9300 },
    { nome: "Sancris Loja de Fábrica", lat: -23.4200, lng: -51.9500 },
    { nome: "Cineflix – Maringá Park", lat: -23.4250, lng: -51.9300 },
    { nome: "Cine Araújo – Shopping Avenida", lat: -23.4255, lng: -51.9350 },
    { nome: "Multiplex Catuaí Maringá", lat: -23.4200, lng: -51.9500 },
    { nome: "Maringá Park Shopping Center", lat: -23.4250, lng: -51.9300 },
    { nome: "Shopping Avenida Center", lat: -23.4255, lng: -51.9350 },
    { nome: "Shopping Cidade Maringá", lat: -23.4200, lng: -51.9500 },
    { nome: "Studio 1000 Hair", lat: -23.4260, lng: -51.9330 },
    { nome: "Attuale Salão de Beleza", lat: -23.4265, lng: -51.9335 },
    { nome: "Lounge Beauty", lat: -23.4270, lng: -51.9340 },
    { nome: "Canto de Aruna Escovaria", lat: -23.4250, lng: -51.9300 },
    { nome: "Leila Lopez Salon", lat: -23.4265, lng: -51.9330 },
    { nome: "Cabelo’s Hair Peluqueria", lat: -23.4265, lng: -51.9330 },
    { nome: "Equipe Carlos Cabeleireiros", lat: -23.4265, lng: -51.9330 },
    { nome: "Monika Ganem", lat: -23.4265, lng: -51.9330 },
    { nome: "Studio Tatiana Pontara", lat: -23.4265, lng: -51.9330 },
];

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

locais.forEach(local => {
    L.marker([local.lat, local.lng], { icon: iconeAcessivel })
        .addTo(map)
        .bindPopup(`<strong>${local.nome}</strong>`);
});


