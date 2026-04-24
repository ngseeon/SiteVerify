document.addEventListener('DOMContentLoaded', () => {
    let sessionPIN = "", activeJobID = "";
    let stream = null, rearPhotoData = null, frontPhotoData = null;
    let currentFacingMode = "environment";
    let curLat = "0.00", curLng = "0.00";

    const settingsFields = ['set-name', 'set-email', 'set-phone', 'set-rec-email', 'set-wa'];
    const loadSettings = () => {
        settingsFields.forEach(id => {
            const val = localStorage.getItem(id);
            if (val) document.getElementById(id).value = val;
        });
    };
    const saveToMemory = () => {
        settingsFields.forEach(id => localStorage.setItem(id, document.getElementById(id).value));
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
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 } } });
            document.getElementById('video-feed').srcObject = stream;
        } catch (err) { alert("Camera Permission Error"); }
    };

    document.getElementById('nav-capture').onclick = () => {
        sessionPIN = (Math.floor(Math.random() * 90000000) + 10000000).toString().substring(0, 8);
        document.getElementById('pin-display').innerText = sessionPIN;
        showScreen('input-screen');
    };

    // ANCHOR: CANCEL BUTTON FIX
    document.getElementById('cancel-init').onclick = () => showScreen('menu-screen');

    document.getElementById('unlock-camera').onclick = () => {
        if (document.getElementById('pin-verification').value !== sessionPIN) { alert("Invalid PIN"); return; }
        activeJobID = document.getElementById('job-id-input').value.trim() || "NIL";
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
            document.getElementById('review-overlay').style.display = 'block';
            document.getElementById('qr-loading-status').style.display = 'flex';
            
            // ANCHOR: SUCCESSFUL IMAGE LAYERING
            ctx.putImageData(rearPhotoData, 0, 0);
            const sW = canvas.width * 0.3;
            const sH = (video.videoHeight / video.videoWidth) * sW;
            ctx.drawImage(video, 20, canvas.height - sH - 20, sW, sH);
            frontPhotoData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            document.getElementById('final-document').src = canvas.toDataURL('image/jpeg', 0.9);

            // ANCHOR: 9-LINE CONTENT
            const now = new Date();
            const unixShort = Math.floor(Date.now() / 1000).toString();
            const fullContent = [
                `Job: ${activeJobID}`,
                document.getElementById('set-name').value || "N/A",
                document.getElementById('set-phone').value || "N/A",
                sessionPIN,
                now.toLocaleDateString('en-GB'),
                now.toLocaleTimeString('en-GB', { hour12: false }),
                unixShort,
                `Lat ${curLat}`,
                `Lng ${curLng}`
            ].join('\n');

            const qrLive = document.getElementById('qrcode-live');
            qrLive.innerHTML = "";
            new QRCode(qrLive, { text: fullContent, width: 256, height: 256 });

            const checkQR = setInterval(() => {
                const qrImg = qrLive.querySelector('img');
                if (qrImg && qrImg.complete) {
                    clearInterval(checkQR);
                    qrLive.style.display = "block";
                    document.getElementById('qr-loading-status').style.display = 'none';
                    document.getElementById('final-actions').style.display = 'flex';
                    stopCamera();
                }
            }, 500);
        }
    };

    document.getElementById('save-to-device').onclick = () => {
        const canvas = document.getElementById('capture-canvas');
        const ctx = canvas.getContext('2d');
        const qrImg = document.querySelector('#qrcode-live img');
        ctx.putImageData(frontPhotoData, 0, 0);
        if (qrImg) ctx.drawImage(qrImg, canvas.width - 240, canvas.height - 240, 220, 220);
        const link = document.createElement('a');
        link.download = `SV_${activeJobID}_${sessionPIN}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 1.0);
        link.click();
    };

    document.getElementById('save-settings').onclick = () => { saveToMemory(); showScreen('menu-screen'); };
    document.getElementById('discard-btn').onclick = () => location.reload();
    document.getElementById('settings-gear').onclick = () => showScreen('settings-screen');
    document.getElementById('cam-back').onclick = () => location.reload();

    navigator.geolocation.watchPosition(pos => {
        curLat = pos.coords.latitude.toFixed(7);
        curLng = pos.coords.longitude.toFixed(7);
        document.getElementById('location-display').innerText = `🌐 ${curLat}, ${curLng}`;
    }, null, { enableHighAccuracy: true });

    setInterval(() => {
        document.getElementById('live-clock').innerText = new Date().toLocaleString('en-GB').replace(',', '');
    }, 1000);
});
