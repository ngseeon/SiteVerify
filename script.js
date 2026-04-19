document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('app-header');
    const gpsStatusText = document.getElementById('gps-status');
    const liveClockText = document.getElementById('live-clock');
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

    // 2. GPS STATUS
    async function updateGpsStatus() {
        if (!navigator.geolocation) {
            gpsStatusText.innerText = "GPS: UNSUPPORTED";
            return;
        }
        navigator.geolocation.getCurrentPosition(
            () => { gpsStatusText.innerText = "GPS: ON"; gpsStatusText.style.color = "black"; },
            () => { gpsStatusText.innerText = "GPS: OFF"; gpsStatusText.style.color = "red"; }
        );
    }
    updateGpsStatus();

    // 3. NAVIGATION
    function switchScreen(screenId, showHeader) {
        document.querySelectorAll('.app-screen').forEach(s => s.style.display = 'none');
        document.getElementById(screenId).style.display = 'block';
        header.style.display = showHeader ? 'block' : 'none';
    }

    // BUTTON CLICKS
    document.getElementById('nav-capture').onclick = async () => {
        switchScreen('camera-screen', false); // Goes Full Screen
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
    
    document.getElementById('shutter').onclick = () => alert("Capture Triggered! Phase 2 Ready.");
});
