document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('app-header');
    const gpsStatusText = document.getElementById('gps-status');
    const liveClockText = document.getElementById('live-clock');
    const locDisplay = document.getElementById('location-display');
    const video = document.getElementById('video-feed');
    let stream = null;

    // 1. LIVE CLOCK
    function startClock() {
        setInterval(() => {
            const now = new Date();
            liveClockText.innerText = now.toLocaleString('en-GB', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            }).replace(',', '');
        }, 1000);
    }
    startClock();

    // 2. REVERSE GEOCODING (Dynamic City Name)
    async function getCityName(lat, lon) {
        try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
            const data = await response.json();
            const city = data.locality || data.city || "Unknown City";
            const state = data.principalSubdivision || "Unknown State";
            locDisplay.innerText = `🌐 ${city}, ${state}`;
        } catch (e) {
            locDisplay.innerText = "🌐 Location Unavailable";
        }
    }

    // 3. GPS HARDWARE CHECK
    async function updateGpsStatus() {
        if (!navigator.geolocation) {
            gpsStatusText.innerText = "GPS: UNSUPPORTED";
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                gpsStatusText.innerText = "GPS: ON";
                gpsStatusText.style.color = "black";
                getCityName(position.coords.latitude, position.coords.longitude);
            },
            () => {
                gpsStatusText.innerText = "GPS: OFF";
                gpsStatusText.style.color = "red";
                locDisplay.innerText = "🌐 GPS Permission Required";
            }
        );
    }
    updateGpsStatus();

    // 4. NAVIGATION
    function switchScreen(screenId, showHeader) {
        document.querySelectorAll('.app-screen').forEach(s => s.style.display = 'none');
        document.getElementById(screenId).style.display = 'block';
        header.style.display = showHeader ? 'block' : 'none';
        if (showHeader) updateGpsStatus();
    }

    // BUTTON INTERACTIONS
    document.getElementById('nav-capture').onclick = async () => {
        switchScreen('camera-screen', false); // Goes Full View
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            video.srcObject = stream;
        } catch (e) {
            alert("Camera Error: " + e.message);
            switchScreen('menu-screen', true);
        }
    };

    document.getElementById('cam-back').onclick = () => {
        if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
        switchScreen('menu-screen', true);
    };

    document.getElementById('settings-gear').onclick = () => switchScreen('settings-screen', true);
    document.getElementById('save-settings').onclick = () => switchScreen('menu-screen', true);
    
    document.getElementById('shutter').onclick = () => {
        alert("Capture Triggered! Proceeding to Step 2: Dual-Lens Snaps.");
    };
});
