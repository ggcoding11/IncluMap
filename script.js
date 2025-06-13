document.addEventListener("DOMContentLoaded", () => {
  const registerModalEl = document.getElementById("registerModal");
  const registerModal = new bootstrap.Modal(registerModalEl);
  let miniMap = null;
  let miniMapMarker = null;

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

  const categorias = [
    { value: "cadeirante", nome: "Pessoas com deficiência física", icone: "cadeirante.png" },
    { value: "visual", nome: "Pessoas com deficiência visual", icone: "cedo.png" },
    { value: "auditiva", nome: "Pessoas com deficiência auditiva", icone: "surdo.png" },
    { value: "intelectual", nome: "Pessoas com deficiência intelectual", icone: "intelectual.png" },
    { value: "idoso", nome: "Idosos", icone: "idoso.png" },
    { value: "gravida", nome: "Gestantes", icone: "gravida.png" },
    { value: "autismo", nome: "Pessoas com autismo", icone: "autismo.png" }
  ];

  let markersList = [];

  function gerarGruposPrioritarios() {
    const count = Math.floor(Math.random() * 3) + 1;
    const shuffled = [...categorias].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  function configurarBotaoAvaliar(marker) {
    marker.on("popupopen", () => {
      setTimeout(() => {
        const btn = document.querySelector(".avaliar-btn");
        if (btn) {
          btn.addEventListener("click", () => {
            const nome = btn.dataset.nome;
            document.getElementById("avaliar-nome").value = nome;
            document.getElementById("form-avaliacao").reset();
            bootstrap.Modal.getOrCreateInstance(document.getElementById("avaliacaoModal")).show();
            loadPOIs(); // Recarrega os marcadores e seus popups com as avaliações atualizadas
          });
        }
      }, 200);
    });
  }

  function loadPOIs() {
    markersList.forEach(p => map.removeLayer(p.marker));
    markersList = [];

    const bbox = '-23.7,-52.2,-23.2,-51.6';

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

    // carrega empresas registradas manualmente
    const empresasSalvas = JSON.parse(sessionStorage.getItem("empresas") || "[]");
    empresasSalvas.forEach(emp => {
      const htmlGrupos = `<br><em>Atende:</em><ul style="list-style:none;padding-left:0">` +
        emp.grupos.map(v => {
          const g = categorias.find(c => c.value === v);
          return `<li style="display:flex;align-items:center;margin-bottom:4px">
                    <img src="assets/${g.icone}" width="24" height="24" class="me-2">${g.nome}
                  </li>`;
        }).join('') + `</ul>`;

      const avaliacoes = JSON.parse(sessionStorage.getItem("avaliacoes") || "[]")
        .filter(av => av.nome === emp.nome);

      const maxInicial = 5;
      const mostrarTodas = false; // será usado no controle do botão

      const htmlAvaliacoes = avaliacoes.length
        ? (() => {
            const visiveis = avaliacoes.slice(0, maxInicial);
            const extras = avaliacoes.length > maxInicial;

            return `
              <br><em>Avaliações:</em>
              <ul class="avaliacoes-lista" style="padding-left: 16px; font-size: 0.9em">
                ${visiveis.map(av => `<li>⭐ ${av.estrelas}/5 - ${av.comentario}</li>`).join('')}
              </ul>
              ${extras ? `<button class="btn btn-link btn-sm p-0 mt-1 mostrar-mais-btn" data-nome="${nome}">Mostrar mais avaliações (${avaliacoes.length - maxInicial})</button>` : ""}
            `;
          })()
        : `<br><em>Ainda não há avaliações.</em>`;


      const popupHTML = `<strong>${emp.nome}</strong><br>${emp.endereco}${htmlGrupos}${htmlAvaliacoes}
        <br><button class="btn btn-sm btn-primary avaliar-btn mt-2" data-nome="${emp.nome}">Avaliar</button>`;

      const marker = L.marker([emp.lat, emp.lng], { icon: iconePadrao })
        .addTo(map)
        .bindPopup(popupHTML);

      configurarBotaoAvaliar(marker);
      markersList.push({ nome: emp.nome, marker, grupos: emp.grupos });
    });

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

          const avaliacoes = JSON.parse(sessionStorage.getItem("avaliacoes") || "[]")
            .filter(av => av.nome === nome);

          const maxInicial = 5;
          const mostrarTodas = false; // será usado no controle do botão

          const htmlAvaliacoes = avaliacoes.length
            ? (() => {
                const visiveis = avaliacoes.slice(0, maxInicial);
                const extras = avaliacoes.length > maxInicial;

                return `
                  <br><em>Avaliações:</em>
                  <ul class="avaliacoes-lista" style="padding-left: 16px; font-size: 0.9em">
                    ${visiveis.map(av => `<li>⭐ ${av.estrelas}/5 - ${av.comentario}</li>`).join('')}
                  </ul>
                  ${extras ? `<button class="btn btn-link btn-sm p-0 mt-1 mostrar-mais-btn" data-nome="${nome}">Mostrar mais avaliações (${avaliacoes.length - maxInicial})</button>` : ""}
                `;
              })()
            : `<br><em>Ainda não há avaliações.</em>`;

          const popupHTML = `<strong>${nome}</strong><br>${endereco}${htmlGrupos}${htmlAvaliacoes}
            <br><button class="btn btn-sm btn-primary avaliar-btn mt-2" data-nome="${nome}">Avaliar</button>`;

          const marker = L.marker([el.lat, el.lon], { icon: iconePadrao })
            .addTo(map)
            .bindPopup(popupHTML);

          configurarBotaoAvaliar(marker);

          // Botão "Mostrar mais avaliações"
          marker.on("popupopen", () => {
            setTimeout(() => {
              const mostrarMaisBtn = document.querySelector(".mostrar-mais-btn");
              if (mostrarMaisBtn) {
                mostrarMaisBtn.addEventListener("click", (e) => {
                  e.preventDefault();
                  e.stopPropagation(); // Impede que o evento de clique feche o popup

                  const nome = mostrarMaisBtn.dataset.nome;
                  const avaliacoes = JSON.parse(sessionStorage.getItem("avaliacoes") || "[]")
                    .filter(av => av.nome === nome);

                  const ul = document.querySelector(".avaliacoes-lista");
                  ul.innerHTML = avaliacoes.map(av => `<li>⭐ ${av.estrelas}/5 - ${av.comentario}</li>`).join('');

                  mostrarMaisBtn.remove(); // remove o botão após expandir
                });
              }
            }, 100);
          });
        });

        applyFilters();
      })
      .catch(err => console.error('Erro ao carregar POIs:', err));
  }

  map.whenReady(loadPOIs);

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

  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const autoList = document.getElementById('autocomplete-list');

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

  document.addEventListener('click', e => {
    if (!searchInput.contains(e.target)) {
      autoList.classList.remove('show');
    }
  });

  function flyToMarker(p) {
    const { lat, lng } = p.marker.getLatLng();
    map.flyTo([lat, lng], 17, { animate: true });
    p.marker.openPopup();
  }

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

  let cadastroMarker = null;
  let modoCadastroAtivo = false;

  document.getElementById("open-register").addEventListener("click", () => {
    modoCadastroAtivo = false;
    map.getContainer().style.cursor = "grab";
    registerModal.show();
  });

  const btnSelecionarLocal = document.getElementById("btn-selecionar-local");

  btnSelecionarLocal.addEventListener("click", () => {
    const container = document.getElementById("mini-map-container");
    container.style.display = "block";

    setTimeout(() => {
      if (!miniMap) {
        miniMap = L.map('mini-map').setView(map.getCenter(), 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(miniMap);

        miniMap.on("click", e => {
          const { lat, lng } = e.latlng;
          document.getElementById("latlng").value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

          if (miniMapMarker) {
            miniMap.removeLayer(miniMapMarker);
          }
          miniMapMarker = L.marker([lat, lng], { icon: iconePadrao }).addTo(miniMap);
        });
      } else {
        miniMap.invalidateSize(); // Recalcula o tamanho do mapa se ele já existir
      }
    }, 100);
  });;

  document.getElementById("registerModal").addEventListener("hidden.bs.modal", () => {
    modoCadastroAtivo = false;
    map.getContainer().style.cursor = "grab";
    document.getElementById("latlng").value = "";

    // Remove marcador do mapa principal (se tiver sido usado)
    if (cadastroMarker) {
      map.removeLayer(cadastroMarker);
      cadastroMarker = null;
    }

    // Remove marcador do mini mapa (se existir)
    if (miniMapMarker && miniMap) {
      miniMap.removeLayer(miniMapMarker);
      miniMapMarker = null;
    }

    // Esconde o mini mapa
    document.getElementById("mini-map-container").style.display = "none";
  });

  map.on("click", e => {
    if (!modoCadastroAtivo) return;

    const { lat, lng } = e.latlng;
    document.getElementById("latlng").value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    if (cadastroMarker) map.removeLayer(cadastroMarker);
    cadastroMarker = L.marker([lat, lng], { icon: iconePadrao }).addTo(map);

    modoCadastroAtivo = false;
    map.getContainer().style.cursor = "grab";
  });

  document.getElementById("register-form").addEventListener("submit", e => {
    e.preventDefault();

    const nome = document.getElementById("nome-empresa").value.trim();
    const cnpj = document.getElementById("cnpj-empresa").value.trim();
    const endereco = document.getElementById("endereco").value.trim();
    const latlngStr = document.getElementById("latlng").value.trim();
    const grupos = Array.from(document.querySelectorAll("#register-form input[type=checkbox]:checked")).map(cb => cb.value);

    if (!latlngStr || !grupos.length) {
      alert("Por favor selecione uma localização no mapa e ao menos um filtro de acessibilidade.");
      return;
    }

    const [lat, lng] = latlngStr.split(',').map(Number);

    const htmlGrupos = `<br><em>Atende:</em><ul style="list-style:none;padding-left:0">` +
      grupos.map(v => {
        const g = categorias.find(c => c.value === v);
        return `<li style="display:flex;align-items:center;margin-bottom:4px">
                  <img src="assets/${g.icone}" width="24" height="24" class="me-2">${g.nome}
                </li>`;
      }).join('') + `</ul>`;

    const avaliacoes = JSON.parse(sessionStorage.getItem("avaliacoes") || "[]")
      .filter(av => av.nome === nome);

    const maxInicial = 5;
    const mostrarTodas = false; // será usado no controle do botão

    const htmlAvaliacoes = avaliacoes.length
      ? (() => {
          const visiveis = avaliacoes.slice(0, maxInicial);
          const extras = avaliacoes.length > maxInicial;

          return `
            <br><em>Avaliações:</em>
            <ul class="avaliacoes-lista" style="padding-left: 16px; font-size: 0.9em">
              ${visiveis.map(av => `<li>⭐ ${av.estrelas}/5 - ${av.comentario}</li>`).join('')}
            </ul>
            ${extras ? `<button class="btn btn-link btn-sm p-0 mt-1 mostrar-mais-btn" data-nome="${nome}">Mostrar mais avaliações (${avaliacoes.length - maxInicial})</button>` : ""}
          `;
        })()
      : `<br><em>Ainda não há avaliações.</em>`;
    
    const popupHTML = `<strong>${nome}</strong><br>${endereco}${htmlGrupos}${htmlAvaliacoes}
      <br><button class="btn btn-sm btn-primary avaliar-btn mt-2" data-nome="${nome}">Avaliar</button>`;

    const marker = L.marker([lat, lng], { icon: iconePadrao }).addTo(map).bindPopup(popupHTML);

    configurarBotaoAvaliar(marker);

    markersList.push({ nome, marker, grupos });

    applyFilters();

    // salva no sessionStorage
    const empresas = JSON.parse(sessionStorage.getItem("empresas") || "[]");
    empresas.push({ nome, endereco, lat, lng, grupos });
    sessionStorage.setItem("empresas", JSON.stringify(empresas));

    document.getElementById("register-form").reset();
    document.getElementById("latlng").value = "";
    if (cadastroMarker) {
      map.removeLayer(cadastroMarker);
      cadastroMarker = null;
    }
    bootstrap.Modal.getInstance(document.getElementById("registerModal")).hide();
  });

  document.getElementById("form-avaliacao").addEventListener("submit", e => {
    e.preventDefault();

    const nome = document.getElementById("avaliar-nome").value;
    const estrelas = document.getElementById("avaliar-estrelas").value;
    const comentario = document.getElementById("avaliar-comentario").value;

    const avaliacao = { nome, estrelas: Number(estrelas), comentario };

    const anteriores = JSON.parse(sessionStorage.getItem("avaliacoes") || "[]");
    anteriores.push(avaliacao);
    sessionStorage.setItem("avaliacoes", JSON.stringify(anteriores));

    alert("Obrigado pela sua avaliação!");
    bootstrap.Modal.getInstance(document.getElementById("avaliacaoModal")).hide();
    loadPOIs(); // Recarrega os marcadores e seus popups com as avaliações atualizadas
  });
});
