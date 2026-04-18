document.addEventListener('DOMContentLoaded', () => {
    const screens = { menu: 'menu-screen', settings: 'settings-screen', camera: 'camera-screen' };
    const video = document.getElementById('video-feed');
    let stream = null;

    function show(id) {
        Object.values(screens).forEach(s => document.getElementById(s).style.display = 'none');
        document.getElementById(id).style.display = 'block';
    }

    // 1. LIVE CLOCK
    setInterval(() => {
        document.getElementById('live-clock').innerText = new Date().toLocaleString('en-GB');
    }, 1000);

    // 2. LIVE GPS
    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(pos => {
            document.getElementById('gps-display').innerText = `GPS: ON (${pos.coords.latitude.toFixed(4)})`;
            document.getElementById('location-text').innerText = "Active Tracking";
        }, err => {
            document.getElementById('gps-display').innerText = "GPS: ERROR";
        }, { enableHighAccuracy: true });
    }

    // 3. CAMERA ACTIVATION
    document.getElementById('nav-capture').onclick = async () => {
        show(screens.camera);
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            video.srcObject = stream;
        } catch (e) { alert("Camera Permission Denied"); show(screens.menu); }
    };

    document.getElementById('cam-back').onclick = () => {
        if (stream) stream.getTracks().forEach(t => t.stop());
        show(screens.menu);
    };

    // 4. NAVIGATION
    document.getElementById('settings-gear').onclick = () => show(screens.settings);
    document.getElementById('save-settings').onclick = () => { alert("Settings Saved!"); show(screens.menu); };
});
