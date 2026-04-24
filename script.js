document.addEventListener('DOMContentLoaded', () => {
    let sessionPIN = "", activeJobID = "";
    let stream = null, rearPhotoData = null, frontPhotoData = null;
    let currentFacingMode = "environment";

    // --- ANCHOR: Permanent Memory Logic ---
    const settingsFields = ['set-name', 'set-email', 'set-phone', 'set-rec-email', 'set-wa'];
    const loadSettings = () => {
        settingsFields.forEach(id => {
            const val = localStorage.getItem(id);
            if (val) document.getElementById(id).value = val;
        });
    };
    const saveToMemory = () => {
        settingsFields.forEach(id => {
            localStorage.setItem(id, document.getElementById(id).value);
        });
    };
    loadSettings();

    const showScreen = (id) => {
        document.querySelectorAll('.app-screen').forEach(s => s.style.display = 'none');
        document.getElementById(id).style.display = 'block';
        document.getElementById('app-header').style.display = (id === 'camera-screen') ? 'none' : 'block';
        if (id !== 'camera-screen') stopCamera();
    };

    const stopCamera = () => { if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } };

    const startCamera = async (facing) => {
        stopCamera();
        currentFacingMode = facing;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: facing, width: { ideal: 1280 } } 
            });
            document.getElementById('video-feed').srcObject = stream;
        } catch (err) { alert("Camera Permission Error"); }
    };

    // Navigation
    document.getElementById('cam-back').onclick = () => {
        if (currentFacingMode === "user") startCamera("environment");
        else showScreen('menu-screen');
    };

    document.getElementById('nav-capture').onclick = () => {
        sessionPIN = (Math.floor(Math.random() * 90000000) + 10000000).toString();
        document.getElementById('pin-display').innerText = `Security PIN: ${sessionPIN}`;
        showScreen('input-screen');
    };

    document.getElementById('unlock-camera').onclick = () => {
        if (document.getElementById('pin-verification').value !== sessionPIN) { alert("PIN Error"); return; }
        activeJobID = document.getElementById('job-id-input').value.trim() || "Null";
        showScreen('camera-screen');
        startCamera("environment");
    };

    // --- ANCHOR: Logic Flow Diagnostic ---
    const updatePulse = (msg) => { document.getElementById('logic-pulse').innerText = `ID: ${msg}`; };

    document.getElementById('shutter').onclick = async () => {
        const video = document.getElementById('video-feed');
        const canvas = document.getElementById('capture-canvas');
        const ctx = canvas.getContext('2d');

        if (currentFacingMode === "environment") {
            canvas.width = video.videoWidth; canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            rearPhotoData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            startCamera("user");
        } else {
            updatePulse("1_Selfie_Captured");
            document.getElementById('review-overlay').style.display = 'flex';
            document.getElementById('qr-loading-status').style.display = 'block';
            document.getElementById('final-actions').style.display = 'none';

            ctx.putImageData(rearPhotoData, 0, 0);
            const sW = canvas.width * 0.3;
            const sH = (video.videoHeight / video.videoWidth) * sW;
            ctx.drawImage(video, 20, canvas.height - sH - 20, sW, sH);
            
            frontPhotoData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            document.getElementById('final-document').src = canvas.toDataURL('image/jpeg', 0.9);

            updatePulse("2_Calling_QR_Engine");
            const qrLive = document.getElementById('qrcode-live');
            qrLive.innerHTML = "";
            
            new QRCode(qrLive, { text: `Job:${activeJobID}|PIN:${sessionPIN}`, width: 128, height: 128 });

            const checkQR = setInterval(() => {
                updatePulse("3_Waiting_For_Render");
                const qrImg = qrLive.querySelector('img');
                if (qrImg && qrImg.src && qrImg.complete) {
                    clearInterval(checkQR);
                    updatePulse("4_Success_Clean_Up");
                    qrLive.style.display = "block";
                    document.getElementById('qr-loading-status').style.display = 'none';
                    document.getElementById('final-actions').style.display = 'flex';
                    stopCamera();
                }
            }, 1000);
        }
    };

    document.getElementById('save-to-device').onclick = () => {
        const canvas = document.getElementById('capture-canvas');
        const ctx = canvas.getContext('2d');
        const qrImg = document.querySelector('#qrcode-live img');
        ctx.putImageData(frontPhotoData, 0, 0);
        ctx.drawImage(qrImg, canvas.width - 150, canvas.height - 150, 130, 130);
        const link = document.createElement('a');
        link.download = `SiteVerify_${activeJobID}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 1.0);
        link.click();
    };

    document.getElementById('save-settings').onclick = () => { saveToMemory(); showScreen('menu-screen'); };
    document.getElementById('discard-btn').onclick = () => location.reload();
    document.getElementById('settings-gear').onclick = () => showScreen('settings-screen');

    // GPS & Clock Persistence
    navigator.geolocation.watchPosition(pos => {
        document.getElementById('location-display').innerText = "🌐 Horizon Hills";
        document.getElementById('gps-status').innerText = "GPS: ON";
    }, null, { enableHighAccuracy: true });

    setInterval(() => {
        document.getElementById('live-clock').innerText = new Date().toLocaleString('en-GB').replace(',', '');
    }, 1000);
});
