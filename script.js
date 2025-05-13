// crea mapa y lo ubica en el elemento con id "map". Lo ubica en Colombia
const map = L.map("map").setView([4.6, -74.08], 6);

// carga tiles de OSM
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap",
}).addTo(map);

