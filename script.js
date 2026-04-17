document.addEventListener('DOMContentLoaded', () => {
    // --- Phase 1 Variables ---
    const fields = ['userName', 'userEmail', 'userHandphone', 'recipientEmail', 'whatsappPhone'];
    const screens = ['settings-screen', 'menu-screen', 'camera-screen', 'pin-screen', 'preview-screen'];
    let currentLat = 0, currentLon = 0, generatedPin = "";
    let rearStream = null;

    // --- Navigation Logic ---
    function showScreen(targetId) {
        screens.forEach(id => document.getElementById(id).style.display = (id === targetId) ? 'block' : 'none');
        if (targetId !== 'camera-screen' && rearStream) stopCamera();
    }

    document.getElementById('settings-gear').addEventListener('click', () => showScreen('settings-screen'));
    document.getElementById('nav-capture').addEventListener('click', () => {
        showScreen('camera-screen');
        startCamera('environment'); 
    });
    document.getElementById('camera-back').addEventListener('click', () => showScreen('menu-screen'));

    // --- Phase 2: Double-Snap Logic ---
    async function startCamera(mode) {
        if (rearStream) stopCamera();
        const constraints = { video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } } };
        rearStream = await navigator.mediaDevices.getUserMedia(constraints);
        document.getElementById('video-feed').srcObject = rearStream;
    }

    function stopCamera() {
        if (rearStream) rearStream.getTracks().forEach(track => track.stop());
    }

    document.getElementById('shutter-btn').addEventListener('click', async () => {
        const video = document.getElementById('video-feed');
        const canvas = document.getElementById('capture-canvas');
        const ctx = canvas.getContext('2d');
        
        // 1. Capture Rear (Scene)
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const sceneData = canvas.toDataURL('image/jpeg');

        // 2. Flip to Front (Selfie)
        stopCamera();
        await startCamera('user');
        setTimeout(() => { // Small delay for "Proof of Presence" integrity
            ctx.globalAlpha = 1.0;
            // Draw selfie in bottom-left corner
            const sWidth = canvas.width * 0.25;
            const sHeight = (video.videoHeight / video.videoWidth) * sWidth;
            ctx.drawImage(video, 20, canvas.height - sHeight - 20, sWidth, sHeight);
            
            preparePinVerification(canvas.toDataURL('image/jpeg'));
        }, 500);
    });

    // --- Phase 2: Security PIN Logic ---
    function preparePinVerification(imageData) {
        const latStr = currentLat.toString().split('.')[1] || "0";
        const lonStr = currentLon.toString().split('.')[1] || "0";
        const sum = (latStr + lonStr).split('').reduce((a, b) => parseInt(a) + parseInt(b), 0);
        generatedPin = sum.toString().padStart(4, '0').slice(-4);
        
        document.getElementById('display-pin').innerText = generatedPin;
        document.getElementById('final-image-preview').src = imageData;
        showScreen('pin-screen');
    }

    document.getElementById('verify-pin-btn').addEventListener('click', () => {
        if (document.getElementById('pin-input').value === generatedPin) {
            generateFinalStamp();
        } else {
            alert("Incorrect PIN. Location verification failed.");
        }
    });

    // --- Phase 2: QR Stamp Logic ---
    async function generateFinalStamp() {
        const canvas = document.getElementById('capture-canvas');
        const ctx = canvas.getContext('2d');
        const qrData = `User: ${localStorage.getItem('userName')}\nLat: ${currentLat}\nLon: ${currentLon}\nTime: ${new Date().toISOString()}`;
        
        const qrCanvas = document.createElement('canvas');
        await QRCode.toCanvas(qrCanvas, qrData, { margin: 1, width: canvas.width * 0.2 });
        
        // Draw QR in bottom-right
        ctx.drawImage(qrCanvas, canvas.width - qrCanvas.width - 20, canvas.height - qrCanvas.height - 20);
        
        document.getElementById('final-image-preview').src = canvas.toDataURL('image/jpeg');
        showScreen('preview-screen');
    }

    document.getElementById('save-to-device').addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `SiteVerify_${Date.now()}.jpg`;
        link.href = document.getElementById('final-image-preview').src;
        link.click();
        showScreen('menu-screen');
    });

    // --- Common Features (Clock/GPS/Persistence) ---
    function init() {
        fields.forEach(id => {
            const val = localStorage.getItem(id);
            if (val) document.getElementById(id).value = val;
        });
        if (localStorage.getItem('userName')) showScreen('menu-screen');

        setInterval(() => {
            const now = new Date();
            document.getElementById('live-clock').innerText = now.toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'}) + " " + now.toTimeString().split(' ')[0];
        }, 1000);

        navigator.geolocation.watchPosition(p => {
            currentLat = p.coords.latitude;
            currentLon = p.coords.longitude;
            document.getElementById('gps-status').className = "gps-on";
            document.getElementById('gps-status').innerText = "GPS : ON";
        }, () => {
            document.getElementById('gps-status').className = "gps-off";
            document.getElementById('gps-status').innerText = "GPS : OFF";
        }, { enableHighAccuracy: true });
    }

    document.getElementById('save-settings').addEventListener('click', () => {
        fields.forEach(id => localStorage.setItem(id, document.getElementById(id).value));
        showScreen('menu-screen');
    });

    init();
});
