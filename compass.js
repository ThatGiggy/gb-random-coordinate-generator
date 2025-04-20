let lat = parseFloat(localStorage.getItem('targetLat'));
let lng = parseFloat(localStorage.getItem('targetLng'));

if (isNaN(lat) || isNaN(lng)) {
  alert('No target coordinate found.');
  history.back();
}

let target = { lat, lng };
let arrowElement = document.getElementById('arrow');

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

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

navigator.geolocation.getCurrentPosition(pos => {
  const userLoc = {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude
  };
  bearingToTarget = calculateBearing(userLoc, target);
  requestOrientationPermission();
}, err => {
  alert('Failed to get your location.');
});

function handleOrientation(event) {
  const alpha = event.alpha;
  if (alpha != null) {
    const heading = 360 - alpha;
    const angle = (bearingToTarget - heading + 360) % 360;
    arrowElement.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`;
  }
}

function requestOrientationPermission() {
  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    // iOS 13+ permission flow
    DeviceOrientationEvent.requestPermission()
      .then(permissionState => {
        if (permissionState === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
        } else {
          alert('Compass access was denied.');
        }
      })
      .catch(console.error);
  } else {
    // Android / non-iOS fallback
    window.addEventListener('deviceorientation', handleOrientation);
  }
}

