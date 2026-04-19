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

    // 2. DYNAMIC LOCATION LOOKUP
    async function updateCityAndState(lat, lon) {
        try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
            const data = await response.json();
            
            // Get city/locality and state/province
            const city = data.locality || data.city || "Unknown City";
            const state = data.principalSubdivision || "Unknown State";
            
            locDisplay.innerText = `🌐 ${city}, ${state}`;
        } catch (error) {
            locDisplay.innerText = "🌐 Location Data Error";
            console.error("Geocoding failed:", error);
        }
    }

    // 3. GPS HANDWARE INTERFACE
    function initGPS() {
        if (!navigator.geolocation) {
            gpsStatusText.innerText = "GPS: UNSUPPORTED";
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                gpsStatusText.innerText = "GPS: ON";
                gpsStatusText.style.color = "black";
                // Trigger the actual name lookup
                updateCityAndState(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                gpsStatusText.innerText = "GPS: OFF";
                gpsStatusText.style.color = "red";
                locDisplay.innerText = "🌐 Permission Denied";
            },
            { enableHighAccuracy: true }
        );
    }
    initGPS();

    // 4. SCREEN NAVIGATION ENGINE
    function switchScreen(screenId, showHeader) {
        document.querySelectorAll('.app-screen').forEach(s => s.style.display = 'none');
        const target = document.getElementById(screenId);
        if (target) target.style.display = 'block';
        header.style.display = showHeader ? 'block' : 'none';
        
        // Refresh GPS/Location when returning to main header
        if (showHeader) initGPS();
    }

    // BUTTON ACTIONS
    document.getElementById('nav-capture').onclick = async () => {
        switchScreen('camera-screen', false); 
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            video.srcObject = stream;
        } catch (e) {
            alert("Camera Access Error");
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
        alert("Capture function triggered!");
    };
});
