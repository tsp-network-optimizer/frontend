// crea mapa y lo ubica en el elemento con id "map". Lo ubica en Colombia
const map = L.map("map").setView([4.6, -74.08], 6);

// carga tiles de OSM
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap",
}).addTo(map);

// capas para pintar grafo, puntos TSP y rutas
window.graphLayers = [];
window.tspPointLayers = [];

// manejar evento de carga del archivo .osm (grafo) se ejecuta al escuchar cambios en el input
document.getElementById("osmFileInput").addEventListener("change", function () {
  const file = this.files[0];

  if (!file) return;
  //se construye como formalario para luego enviar en el fetch
  const formData = new FormData();
  formData.append("file", file);

  fetch("http://localhost:8000/upload-graph", {
    method: "POST",
    body: formData
  })
    .then(response => {
      if (!response.ok) {
        throw new Error("Error al cargar el grafo");
      }
      return response.json();
    })
    //se recibe la respuesta del grafo
    .then(data => {
        alert(`Grafo cargado: ${data.nodes} nodos, ${data.edges} aristas`);
        console.log("Respuesta del servidor:", data);

        // una vez la respuesta fue exitosa, se pide el grafo 
        fetch("http://localhost:8000/graph-data")
            .then(res => res.json())
            //objeto traído desde le back, ya convertido a objeto JS
            .then(graph => {
              drawGraph(graph);  
            });
    })
    .catch(error => {
      alert("Error al subir el archivo");
      console.error(error);
    });
});


// función para activar/desactivar botones de algoritmos
function setAlgorithmButtonsEnabled(enabled) {
  document.getElementById("btnBruteForce").disabled = !enabled;
  document.getElementById("btnGreedy").disabled = !enabled;
  document.getElementById("btnDynamic").disabled = !enabled;
}



// función para pintar el grafo base (nodos azules, aristas grises)
function drawGraph(graph) {
  // Limpiar mapa si ya había algo
  if (window.graphLayers) {
    window.graphLayers.forEach(layer => layer.remove());
  }
  window.graphLayers = [];

  // Pintar nodos
  graph.nodes.forEach(node => {
    const marker = L.circleMarker([node.lat, node.lon], {
      radius: 3,
      color: "blue",
      fillOpacity: 0.6
    }).addTo(map);
    window.graphLayers.push(marker);
  });

  // Pintar aristas
  graph.edges.forEach(edge => {
    const nodeA = graph.nodes.find(n => n.id === edge.from);
    const nodeB = graph.nodes.find(n => n.id === edge.to);
    if (nodeA && nodeB) {
      const line = L.polyline([[nodeA.lat, nodeA.lon], [nodeB.lat, nodeB.lon]], {
        color: "gray",
        weight: 1
      }).addTo(map);
      window.graphLayers.push(line);
    }
  });
}

//se dispara cuando se sube un archivo al archivo de nodos a visitar
document.getElementById("pointsFileInput").addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  setAlgorithmButtonsEnabled(false);

  fetch("http://localhost:8000/upload-points", {
    method: "POST",
    body: formData
  })
    .then(response => {
      if (!response.ok) throw new Error("Error al subir puntos");
      return response.json();
    })
    //mostrar respuesta
    .then(data => {
      alert(`Puntos cargados: ${data.numPoints} nodos para el TSP`);

      // Mostrar mensaje de cálculo (avisar que se está calculando la matriz con dijkstra)
      const statusMessage = document.getElementById("loadingMessage");
      statusMessage.textContent = "Calculando matriz de distancias...";

      // Lllamar al backend para construir la matriz
      fetch("http://localhost:8000/build-matrix")
        .then(res => res.json())
        .then(matrixResult => {
          statusMessage.textContent = `Matriz lista para ${matrixResult.numPoints} puntos`;

          // se tiene que redibujar el grafo para añadir los puntos nuevos
          fetch("http://localhost:8000/graph-data")
            .then(res => res.json())
            .then(graph => {
              drawGraph(graph);
              drawTSPPoints(data.nodeIds, graph.nodes);
              //una vez todo está listo se pueden activar los botones de los algoritmos
              setAlgorithmButtonsEnabled(true);  
            });
        })
        .catch(error => {
          statusMessage.textContent = "Error al calcular matriz";
          console.error(error);
        });
    })
    .catch(error => {
      alert("Error al cargar los puntos");
      console.error(error);
      setAlgorithmButtonsEnabled(false);
    });
});



// función para renderizar resultados del TSP en el panel lateral
function renderTSPResult(result) {
  const container = document.getElementById("statsContainer");

  const card = document.createElement("div");
  card.className = "stat-card";

  card.innerHTML = `
    <h4>${result.algorithmName}</h4>
    <p class="stat-line"><strong>Distancia:</strong> ${result.total_cost.toFixed(2)} metros</p>
    <p class="stat-line"><strong>Tiempo:</strong> ${result.execution_time.toFixed(4)} s</p>
    <p class="stat-line"><strong>Ruta:</strong> ${result.path.join(" → ")}</p>
  `;

  container.appendChild(card);
}

// función para pintar los nodos del TSP en color naranja (para diferencias los que se tienen que visitar)
function drawTSPPoints(nodeIds, allGraphNodes) {
  // Borrar puntos TSP anteriores
  window.tspPointLayers.forEach(layer => layer.remove());
  window.tspPointLayers = [];

  nodeIds.forEach(id => {
    const node = allGraphNodes.find(n => n.id === id);
    if (node) {
      const circle = L.circleMarker([node.lat, node.lon], {
        radius: 4,
        color: "orange",
        fillColor: "orange",
        fillOpacity: 0.9
      }).addTo(map);
      window.tspPointLayers.push(circle);
    }
  });
}
