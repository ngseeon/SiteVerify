document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('app-header');
    const gpsStatusText = document.getElementById('gps-status');
    const video = document.getElementById('video-feed');
    let stream = null;

    // 1. DYNAMIC GPS CHECK
    async function updateGpsStatus() {
        if (!navigator.geolocation) {
            gpsStatusText.innerText = "GPS: UNSUPPORTED";
            return;
        }

        try {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            
            const handleStatus = (status) => {
                if (status === 'granted') {
                    gpsStatusText.innerText = "GPS: ON";
                    gpsStatusText.style.color = "black";
                } else if (status === 'prompt') {
                    gpsStatusText.innerText = "GPS: PENDING";
                } else {
                    gpsStatusText.innerText = "GPS: OFF";
                    gpsStatusText.style.color = "red";
                }
            };

            handleStatus(result.state);
            result.onchange = () => handleStatus(result.state);

        } catch (e) {
            // Fallback if Permissions API isn't fully supported
            navigator.geolocation.getCurrentPosition(
                () => { gpsStatusText.innerText = "GPS: ON"; },
                () => { gpsStatusText.innerText = "GPS: OFF"; }
            );
        }
    }

    // Run GPS check on load
    updateGpsStatus();

    // 2. LIVE CLOCK
    setInterval(() => {
        document.getElementById('live-clock').innerText = new Date().toLocaleString('en-GB');
    }, 1000);

    // 3. NAVIGATION LOGIC
    function switchScreen(screenId, showHeader) {
        document.querySelectorAll('.app-screen').forEach(s => s.style.display = 'none');
        document.getElementById(screenId).style.display = 'block';
        header.style.display = showHeader ? 'block' : 'none';
        
        // Re-check GPS whenever we go back to a screen with a header
        if (showHeader) updateGpsStatus();
    }

    document.getElementById('nav-capture').onclick = async () => {
        switchScreen('camera-screen', false); 
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            video.srcObject = stream;
        } catch (e) { 
            alert("Camera Error"); 
            switchScreen('menu-screen', true); 
        }
    };

    document.getElementById('shutter').onclick = () => {
        // Step 1: Capture & Stamp Logic will go here
        alert("Capture function triggered!"); 
    };

    document.getElementById('cam-back').onclick = () => {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            stream = null;
        }
        switchScreen('menu-screen', true); // Properly restores header
    };

    document.getElementById('settings-gear').onclick = () => switchScreen('settings-screen', true);
    document.getElementById('save-settings').onclick = () => switchScreen('menu-screen', true);
});
