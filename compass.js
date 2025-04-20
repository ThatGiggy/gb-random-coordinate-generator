let targetLat = parseFloat(localStorage.getItem("targetLat"));
let targetLng = parseFloat(localStorage.getItem("targetLng"));
const arrow = document.getElementById("arrow");
const output = document.getElementById("output");

let deviceHeading = 0;  // Default heading if not available

if (isNaN(targetLat) || isNaN(targetLng)) {
  output.textContent = "No valid target coordinate found.";
} else {
  navigator.geolocation.getCurrentPosition(showDirection, handleError);
  window.addEventListener('deviceorientation', updateDeviceHeading);
}

function showDirection(position) {
  const userLat = position.coords.latitude;
  const userLng = position.coords.longitude;
  output.textContent = "Tracking your position...";

  // Calculate the bearing (angle) from user to target coordinate
  const bearing = calculateBearing(userLat, userLng, targetLat, targetLng);

  // Adjust the bearing based on the device's current facing direction
  const relativeBearing = bearing - deviceHeading;

  // Update the arrow's rotation based on the adjusted bearing
  arrow.style.transform = `translateX(-50%) translateY(-100%) rotate(${relativeBearing}deg)`;

  // Display user's and target's coordinates (optional)
  console.log(`Your Location: ${userLat}, ${userLng}`);
  console.log(`Target Location: ${targetLat}, ${targetLng}`);
}

function handleError(error) {
  output.textContent = "Error getting location.";
  console.error(error);
}

function calculateBearing(lat1, lon1, lat2, lon2) {
  const radians = Math.PI / 180;
  
  const φ1 = lat1 * radians;
  const φ2 = lat2 * radians;
  const Δλ = (lon2 - lon1) * radians;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  
  let bearing = Math.atan2(y, x) * (180 / Math.PI);
  bearing = (bearing + 360) % 360; // Normalize to 0–360°
  return bearing;
}

// Updates the device's current heading (rotation direction)
function updateDeviceHeading(event) {
  deviceHeading = event.alpha || 0; // `alpha` is the compass heading in degrees
}
