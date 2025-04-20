const arrowElement = document.getElementById('arrow');
const lat = parseFloat(localStorage.getItem('targetLat'));
const lng = parseFloat(localStorage.getItem('targetLng'));

if (isNaN(lat) || isNaN(lng)) {
  alert('No target coordinate found.');
  history.back();
}

const target = { lat, lng };

// Convert degrees to radians
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Calculate bearing between two coordinates
function calculateBearing(start, end) {
  const φ1 = deg2rad(start.lat);
  const φ2 = deg2rad(end.lat);
  const Δλ = deg2rad(end.lng - start.lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return (θ * 180 / Math.PI + 360) % 360;
}

let bearingToTarget = 0;

// Get initial location to calculate target bearing
navigator.geolocation.getCurrentPosition(pos => {
  const userLoc = {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude
  };
  bearingToTarget = calculateBearing(userLoc, target);
  console.log('Bearing to target:', bearingToTarget.toFixed(2));
  requestOrientationPermission();
}, err => {
  console.error('Geolocation error:', err);
  alert("Couldn't get your location.");
});

// Handle orientation changes
let heading = null;
let isHeadingValid = false;

// Function to reset heading data and stop previous event listeners
function resetOrientation() {
  window.removeEventListener('deviceorientation', handleOrientation);
  window.removeEventListener('deviceorientationabsolute', handleOrientation);
  heading = null;
  isHeadingValid = false;
  console.log('Orientation data reset');
}

// Function to handle orientation event
function handleOrientation(event) {
  if (event.alpha !== null) {
    heading = 360 - event.alpha; // For Android and iOS
  } else {
    console.warn('No heading data available.');
    return;
  }

  // Once we get a valid heading, we can set it
  isHeadingValid = true;

  // Calculate angle between the current heading and target bearing
  const angle = (bearingToTarget - heading + 360) % 360;
  console.log(`Rotation angle: ${angle}`);

  // Rotate the arrow
  arrowElement.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`;
}

// Request orientation permission (only needed for iOS)
function requestOrientationPermission() {
  if (typeof DeviceOrientationEvent !== 'undefined' && 
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    // iOS permission request
    DeviceOrientationEvent.requestPermission()
      .then(permissionState => {
        if (permissionState === 'granted') {
          console.log('Permission granted!');
          // Add event listeners once permission is granted
          window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
          console.error('Permission to access the compass was denied.');
          alert('Permission denied. Compass functionality won’t work.');
        }
      })
      .catch(err => {
        console.error('Error requesting orientation permission:', err);
        alert('Error requesting permission.');
      });
  } else {
    // No permission request needed for Android and non-iOS devices
    console.log('No permission request needed.');
    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);
  }
}

// Reset orientation data and event listeners when navigating away from compass page
window.addEventListener('beforeunload', resetOrientation);
