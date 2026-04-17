document.addEventListener('DOMContentLoaded', () => {
    const fields = ['userName', 'userEmail', 'userHandphone', 'recipientEmail', 'whatsappPhone'];
    let currentLat = 0, currentLon = 0, generatedPin = "", stream = null;

    const showScreen = (id) => {
        document.querySelectorAll('section').forEach(s => s.style.display = 'none');
        const target = document.getElementById(id);
        target.style.display = (id === 'menu-screen' || id === 'settings-screen') ? 'block' : 'flex';
        
        // Hide header for Phase 2 "Clean View"
        document.getElementById('main-header').style.display = (['menu-screen', 'settings-screen'].includes(id)) ? 'block' : 'none';
        if (id !== 'camera-screen') stopCamera();
    };

    // Bug Fix: Activate Settings Gear
    document.getElementById('settings-gear').addEventListener('click', () => showScreen('settings-screen'));
    
    // Bug Fix: Save Settings & Return
    document.getElementById('save-settings').addEventListener('click', () => {
        fields.forEach(f => localStorage.setItem(f, document.getElementById(f).value));
        showScreen('menu-screen');
    });

    // Camera Lifecycle
    async function startCamera(mode) {
        if (stream) stopCamera();
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode, width: 1280, height: 720 } });
        document.getElementById('video-feed').srcObject = stream;
    }

    function stopCamera() { if (stream) stream.getTracks().forEach(t => t.stop()); }

    document.getElementById('nav-capture').addEventListener('click', () => { showScreen('camera-screen'); startCamera('environment'); });
    document.getElementById('camera-back').addEventListener('click', () => showScreen('menu-screen'));

    // The Double-Snap Sequence
    document.getElementById('shutter-btn').addEventListener('click', async () => {
        const video = document.getElementById('video-feed');
        const canvas = document.getElementById('capture-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0); // Rear Snap

        stopCamera();
        await startCamera('user'); // Flip to Front (<0.5s)
        setTimeout(() => {
            const sW = canvas.width * 0.3; const sH = (video.videoHeight / video.videoWidth) * sW;
            ctx.drawImage(video, 20, canvas.height - sH - 20, sW, sH); // Selfie Overlay
            
            // Generate GPS PIN
            const latF = currentLat.toString().split('.')[1] || "0";
            const lonF = currentLon.toString().split('.')[1] || "0";
            generatedPin = (latF + lonF).split('').reduce((a,b) => parseInt(a) + parseInt(b), 0).toString().slice(-4).padStart(4, '0');
            
            document.getElementById('display-pin').innerText = generatedPin;
            document.getElementById('pin-preview').src = canvas.toDataURL('image/jpeg');
            showScreen('pin-screen');
        }, 400);
    });

    // Multi-Step Verification Logic
    document.getElementById('pin-input').addEventListener('input', (e) => {
        if (e.target.value === generatedPin) {
            document.getElementById('confirm-preview').src = document.getElementById('pin-preview').src;
            showScreen('confirm-screen');
        }
    });

    document.getElementById('verify-generate-btn').addEventListener('click', async () => {
        const canvas = document.getElementById('capture-canvas');
        const ctx = canvas.getContext('2d');
        const qrText = `User: ${localStorage.getItem('userName')}\nGPS: ${currentLat},${currentLon}\nTime: ${new Date().toISOString()}`;
        
        const qrCanvas = document.createElement('canvas');
        await QRCode.toCanvas(qrCanvas, qrText, { width: canvas.width * 0.2, margin: 1 });
        ctx.drawImage(qrCanvas, canvas.width - qrCanvas.width - 20, canvas.height - qrCanvas.height - 20); // QR Stamp
        
        document.getElementById('final-image-preview').src = canvas.toDataURL('image/jpeg');
        showScreen('preview-screen');
    });

    document.getElementById('save-to-device').addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = document.getElementById('final-image-preview').src;
        a.download = `siteverify_logo.png`; //
        a.click();
        showScreen('menu-screen');
    });

    // Initialization
    function init() {
        fields.forEach(f => { if(localStorage.getItem(f)) document.getElementById(f).value = localStorage.getItem(f); });
        
        setInterval(() => {
            const now = new Date();
            document.getElementById('live-clock').innerText = now.toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'}) + " " + now.toTimeString().split(' ')[0];
        }, 1000);

        navigator.geolocation.watchPosition(p => {
            currentLat = p.coords.latitude; currentLon = p.coords.longitude;
            document.getElementById('gps-status').className = "gps-on";
        }, () => { document.getElementById('gps-status').className = "gps-off"; });
    }

    init();
});
