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

    // 2. TOWN-ONLY LOCATION LOGIC (Strictly targeting "Gelang Patah")
    async function updateTownName(lat, lon) {
        try {
            // Using Nominatim for more granular town/village data
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
            const data = await response.json();
            
            // Priority list to find the specific town name
            const town = data.address.village || 
                         data.address.town || 
                         data.address.suburb || 
                         data.address.city_district || 
                         "Unknown Town";
            
            locDisplay.innerText = `🌐 ${town}`;
        } catch (error) {
            locDisplay.innerText = "🌐 Location Error";
        }
    }

    // 3. GPS INITIALIZATION
    function initGPS() {
        if (!navigator.geolocation) {
            gpsStatusText.innerText = "GPS: UNSUPPORTED";
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                gpsStatusText.innerText = "GPS: ON";
                gpsStatusText.style.color = "black";
                updateTownName(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                gpsStatusText.innerText = "GPS: OFF";
                gpsStatusText.style.color = "red";
                locDisplay.innerText = "🌐 GPS Signal Required";
            },
            { enableHighAccuracy: true }
        );
    }
    initGPS();

    // 4. NAVIGATION
    function switchScreen(screenId, showHeader) {
        document.querySelectorAll('.app-screen').forEach(s => s.style.display = 'none');
        document.getElementById(screenId).style.display = 'block';
        header.style.display = showHeader ? 'block' : 'none';
        if (showHeader) initGPS();
    }

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
        alert("Capture Triggered!");
    };
});
