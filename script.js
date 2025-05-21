// crea mapa y lo ubica en el elemento con id "map". Lo ubica en Colombia
const map = L.map("map").setView([4.6, -74.08], 6);

// carga tiles de OSM
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap",
}).addTo(map);




document.getElementById("osmFileInput").addEventListener("change", function () {
  const file = this.files[0];

  if (!file) return;

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
    .then(data => {
        alert(`Grafo cargado: ${data.nodes} nodos, ${data.edges} aristas`);
        console.log("Respuesta del servidor:", data);

        // Ahora pedimos los datos del grafo para pintarlos
        fetch("http://localhost:8000/graph-data")
            .then(res => res.json())
            .then(graph => {
            drawGraph(graph);  
        });
    })

    .catch(error => {
      alert("Error al subir el archivo");
      console.error(error);
    });
});




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



function setAlgorithmButtonsEnabled(enabled) {
  document.getElementById("btnBruteForce").disabled = !enabled;
  document.getElementById("btnGreedy").disabled = !enabled;
  document.getElementById("btnDynamic").disabled = !enabled;
}
