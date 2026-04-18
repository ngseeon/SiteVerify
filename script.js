document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('app-header');
    const video = document.getElementById('video-feed');
    let stream = null;

    // 1. LIVE CLOCK
    setInterval(() => {
        document.getElementById('live-clock').innerText = new Date().toLocaleString('en-GB');
    }, 1000);

    function switchScreen(screenId, showHeader) {
        document.querySelectorAll('.app-screen').forEach(s => s.style.display = 'none');
        document.getElementById(screenId).style.display = 'block';
        header.style.display = showHeader ? 'block' : 'none';
    }

    // 2. CAMERA LOGIC
    document.getElementById('nav-capture').onclick = async () => {
        switchScreen('camera-screen', false); // Hide header for camera
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            video.srcObject = stream;
        } catch (e) { alert("Camera Error"); switchScreen('menu-screen', true); }
    };

    document.getElementById('shutter').onclick = () => {
        alert("Capture function triggered!"); // Logic for Step 1 of workflow
    };

    document.getElementById('cam-back').onclick = () => {
        if (stream) stream.getTracks().forEach(t => t.stop());
        switchScreen('menu-screen', true);
    };

    // 3. SETTINGS NAVIGATION
    document.getElementById('settings-gear').onclick = () => switchScreen('settings-screen', true);
    document.getElementById('save-settings').onclick = () => switchScreen('menu-screen', true);
});
