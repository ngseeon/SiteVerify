document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('app-header');
    const gpsStatusText = document.getElementById('gps-status');
    const video = document.getElementById('video-feed');
    let stream = null;

    // GPS Status Tracking
    async function updateGpsStatus() {
        if (!navigator.geolocation) { gpsStatusText.innerText = "GPS: UNSUPPORTED"; return; }
        try {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            const handleStatus = (s) => {
                gpsStatusText.innerText = (s === 'granted') ? "GPS: ON" : "GPS: OFF";
                gpsStatusText.style.color = (s === 'granted') ? "black" : "red";
            };
            handleStatus(result.state);
            result.onchange = () => handleStatus(result.state);
        } catch (e) {
            navigator.geolocation.getCurrentPosition(() => { gpsStatusText.innerText="GPS: ON"; }, () => { gpsStatusText.innerText="GPS: OFF"; });
        }
    }
    updateGpsStatus();

    // Clock
    setInterval(() => { document.getElementById('live-clock').innerText = new Date().toLocaleString('en-GB'); }, 1000);

    // Navigation
    function switchScreen(screenId, showHeader) {
        document.querySelectorAll('.app-screen').forEach(s => s.style.display = 'none');
        document.getElementById(screenId).style.display = 'block';
        header.style.display = showHeader ? 'block' : 'none';
        if (showHeader) updateGpsStatus();
    }

    document.getElementById('nav-capture').onclick = async () => {
        switchScreen('camera-screen', false); // Clean View: Hides Header
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            video.srcObject = stream;
        } catch (e) { alert("Camera Error"); switchScreen('menu-screen', true); }
    };

    document.getElementById('cam-back').onclick = () => {
        if (stream) stream.getTracks().forEach(t => t.stop());
        switchScreen('menu-screen', true); // Restores Header
    };

    document.getElementById('settings-gear').onclick = () => switchScreen('settings-screen', true);
    document.getElementById('save-settings').onclick = () => switchScreen('menu-screen', true);
});
