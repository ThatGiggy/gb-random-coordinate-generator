const arrowElement = document.getElementById('arrow');

const lat = parseFloat(localStorage.getItem('targetLat'));
const lng = parseFloat(localStorage.getItem('targetLng'));

if (isNaN(lat) || isNaN(lng)) {
  alert('No target coordinate found.');
  history.back();
}

const target = { lat, lng };

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
  console.log('Bearing to target:', bearingToTarget.toFixed(2));
  requestOrientationPermission();
}, err => {
  console.error('Geolocation error:', err);
  alert("Couldn't get your location.");
});

function handleOrientation(event) {
  let heading;

  if (event.webkitCompassHeading !== undefined) {
    heading = event.webkitCompassHeading;
    console.log('iOS heading:', heading);
  } else if (event.alpha !== null) {
    heading = 360 - event.alpha;
    console.log('Android heading:', heading);
  } else {
    console.warn('No heading data available.');
    return;
  }

  const angle = (bearingToTarget - heading + 360) % 360;
  console.log(`Rotation angle: ${angle}`);
  arrowElement.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`;
}

function requestOrientationPermission() {
  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    // iOS permission request
    DeviceOrientationEvent.requestPermission()
      .then(permissionState => {
        if (permissionState === 'granted') {
          console.log('Permission granted!');
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
    // For Android & other devices
    console.log('No permission request needed.');
    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);
  }
}

// Optional retry logic if orientation data isn't updating after a few seconds.
let retryAttempts = 0;
const maxRetries = 5;
const retryInterval = setInterval(() => {
  if (retryAttempts < maxRetries && !heading) {
    retryAttempts++;
    console.log(`Retrying orientation data (attempt ${retryAttempts})`);
  } else if (retryAttempts >= maxRetries) {
    clearInterval(retryInterval);
    console.error('Failed to get valid orientation data after retries.');
    alert('Failed to get valid orientation data.');
  }
}, 1000);