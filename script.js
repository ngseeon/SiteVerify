document.addEventListener('DOMContentLoaded', () => {
    // 1. GLOBAL ELEMENT SELECTORS
    const header = document.getElementById('app-header');
    const gpsStatusText = document.getElementById('gps-status');
    const liveClockText = document.getElementById('live-clock');
    const video = document.getElementById('video-feed');
    let stream = null;

    // 2. LIVE CLOCK LOGIC
    function startClock() {
        setInterval(() => {
            const now = new Date();
            // Formats to DD/MM/YYYY, HH:MM:SS as seen in your blueprint
            liveClockText.innerText = now.toLocaleString('en-GB', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            }).replace(',', '');
        }, 1000);
    }
    startClock();

    // 3. ACTUAL GPS HARDWARE CHECK
    async function updateGpsStatus() {
        if (!navigator.geolocation) {
            gpsStatusText.innerText = "GPS: UNSUPPORTED";
            return;
        }

        const checkAuth = async () => {
            try {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                const updateUI = (state) => {
                    if (state === 'granted') {
                        gpsStatusText.innerText = "GPS: ON";
                        gpsStatusText.style.color = "black";
                    } else {
                        gpsStatusText.innerText = "GPS: OFF";
                        gpsStatusText.style.color = "red";
                    }
                };
                updateUI(result.state);
                result.onchange = () => updateUI(result.state);
            } catch (e) {
                // Fallback for browsers that don't support permissions.query
                navigator.geolocation.getCurrentPosition(
                    () => { gpsStatusText.innerText = "GPS: ON"; gpsStatusText.style.color = "black"; },
                    () => { gpsStatusText.innerText = "GPS: OFF"; gpsStatusText.style.color = "red"; }
                );
            }
        };
        checkAuth();
    }
    updateGpsStatus();

    // 4. NAVIGATION ENGINE
    function switchScreen(screenId, showHeader) {
        // Hide all screens
        document.querySelectorAll('.app-screen').forEach(s => s.style.display = 'none');
        // Show target screen
        const target = document.getElementById(screenId);
        if (target) target.style.display = 'block';
        
        // Toggle Header Visibility
        header.style.display = showHeader ? 'block' : 'none';
        
        // Refresh GPS when returning to header screens
        if (showHeader) updateGpsStatus();
    }

    // Button Listeners
    document.getElementById('nav-capture').onclick = async () => {
        switchScreen('camera-screen', false); // Goes to Full Screen Camera
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "environment" } 
            });
            video.srcObject = stream;
        } catch (e) {
            alert("Camera Access Denied");
            switchScreen('menu-screen', true);
        }
    };

    document.getElementById('nav-history').onclick = () => {
        alert("History module coming in Phase 3");
    };

    document.getElementById('cam-back').onclick = () => {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            stream = null;
        }
        switchScreen('menu-screen', true); // Returns to Main Menu
    };

    document.getElementById('shutter').onclick = () => {
        alert("Capture Triggered! Proceeding to Dual-Lens Logic.");
    };

    // Settings Toggle
    document.getElementById('settings-gear').onclick = () => switchScreen('settings-screen', true);
    document.getElementById('save-settings').onclick = () => switchScreen('menu-screen', true);
});
