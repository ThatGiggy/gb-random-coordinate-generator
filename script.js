let map;
let marker;
let ukPolygon;

async function initMap() {
  map = L.map("map").setView([54.5, -3], 6);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  try {
    console.log("Fetching gb.geojson...");
    const response = await fetch("gb.geojson");
    console.log("Response status:", response.status);

    const geojson = await response.json();
    console.log("GeoJSON loaded:", geojson);

    // Filter out null or invalid features
    const polygons = geojson.features
      .filter(f => f && f.geometry) // Only process valid features
      .map(f => {
        return f.geometry.type === "Polygon"
          ? turf.polygon(f.geometry.coordinates)
          : turf.multiPolygon(f.geometry.coordinates);
      });

    // Merge all polygons into one large polygon (if multipolygon or multiple polygons)
    ukPolygon = polygons.reduce((acc, curr) => turf.union(acc, curr));

    console.log("Total polygons being used:", polygons.length);
    document.getElementById("output").textContent = "Ready! Click to generate a coordinate.";
  } catch (error) {
    console.error("Error loading GeoJSON:", error);
    document.getElementById("output").textContent = "Failed to load map data.";
  }
}

function getRandomLatLng() {
  const lat = 49.9 + Math.random() * (59 - 49.9);     // a bit broader to ensure coverage
  const lng = -8.2 + Math.random() * (2.2 + 8.2);     // whole GB range
  return [lat, lng];
}

async function generateCoordinate() {
  if (!ukPolygon) {
    document.getElementById("output").textContent = "Map not ready yet!";
    return;
  }

  document.getElementById("output").textContent = "Generating...";

  let lat, lng, isValid = false;
  let attempts = 0;

  while (!isValid && attempts < 500) {
    [lat, lng] = getRandomLatLng();
    const point = turf.point([lng, lat]);
    isValid = turf.booleanPointInPolygon(point, ukPolygon);
    attempts++;
  }

  if (!isValid) {
    document.getElementById("output").textContent = "Could not generate a valid coordinate.";
    return;
  }

  // Save the generated coordinates to localStorage
  localStorage.setItem("targetLat", lat);
  localStorage.setItem("targetLng", lng);

  document.getElementById("output").textContent =
    `Latitude: ${lat.toFixed(5)}, Longitude: ${lng.toFixed(5)}`;

  if (marker) map.removeLayer(marker);
  marker = L.marker([lat, lng]).addTo(map);
  map.setView([lat, lng], 10);
}

window.onload = initMap;
