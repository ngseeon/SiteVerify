document.addEventListener('DOMContentLoaded', () => {
    let liveLat = 0, liveLon = 0, sessionPIN = "", activeJobID = "";
    let stream = null, rearPhotoData = null, frontPhotoData = null;
    let currentFacingMode = "environment";

    const showScreen = (id) => {
        document.querySelectorAll('.app-screen').forEach(s => s.style.display = 'none');
        document.getElementById(id).style.display = 'block';
        document.getElementById('app-header').style.display = (id === 'camera-screen') ? 'none' : 'block';
        if (id !== 'camera-screen') stopCamera();
    };

    const stopCamera = () => {
        if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    };

    const startCamera = async (facing) => {
        stopCamera();
        currentFacingMode = facing;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } } 
            });
            document.getElementById('video-feed').srcObject = stream;
        } catch (err) { alert("Camera Permission Required"); }
    };

    // ANCHOR: Navigation Logic
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
            // STEP 1: IMMEDIATE PREVIEW (Main + Selfie)
            document.getElementById('review-overlay').style.display = 'flex';
            document.getElementById('qr-loading-status').style.display = 'block';
            document.getElementById('final-actions').style.display = 'none';

            ctx.putImageData(rearPhotoData, 0, 0);
            const sW = canvas.width * 0.3;
            const sH = (video.videoHeight / video.videoWidth) * sW;
            ctx.drawImage(video, 20, canvas.height - sH - 20, sW, sH);
            
            // Store this composite state for the final bake
            frontPhotoData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            document.getElementById('final-document').src = canvas.toDataURL('image/jpeg', 0.9);

            // STEP 2: LIVE QR OVERLAY
            const qrLive = document.getElementById('qrcode-live');
            qrLive.innerHTML = "";
            qrLive.style.display = "none";
            
            new QRCode(qrLive, { text: `Job:${activeJobID}|PIN:${sessionPIN}`, width: 128, height: 128 });

            // STEP 3: COMPLETION WATCHER
            const checkQR = setInterval(() => {
                const qrImg = qrLive.querySelector('img');
                if (qrImg && qrImg.src) {
                    clearInterval(checkQR);
                    qrLive.style.display = "block"; // Live element appears bottom-right
                    document.getElementById('qr-loading-status').style.display = 'none';
                    document.getElementById('final-actions').style.display = 'flex';
                    stopCamera();
                }
            }, 500);
        }
    };

    // FINAL BAKE ON SAVE
    document.getElementById('save-to-device').onclick = () => {
        const canvas = document.getElementById('capture-canvas');
        const ctx = canvas.getContext('2d');
        const qrImg = document.querySelector('#qrcode-live img');

        // Merge the live QR into the pixels
        ctx.putImageData(frontPhotoData, 0, 0);
        ctx.drawImage(qrImg, canvas.width - 150, canvas.height - 150, 130, 130);

        const link = document.createElement('a');
        link.download = `SiteVerify_${activeJobID}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 1.0);
        link.click();
    };

    document.getElementById('discard-btn').onclick = () => location.reload();
    document.getElementById('settings-gear').onclick = () => showScreen('settings-screen');
    document.getElementById('save-settings').onclick = () => showScreen('menu-screen');
    
    // GPS & Clock
    navigator.geolocation.watchPosition(pos => {
        liveLat = pos.coords.latitude; liveLon = pos.coords.longitude;
        document.getElementById('gps-status').innerText = "GPS: ON";
    }, null, { enableHighAccuracy: true });

    setInterval(() => {
        document.getElementById('live-clock').innerText = new Date().toLocaleString('en-GB').replace(',', '');
    }, 1000);
});
