document.addEventListener('DOMContentLoaded', () => {
    let liveLat = 0, liveLon = 0, sessionPIN = "", activeJobID = "";
    let stream = null, rearPhotoData = null;
    let qrReady = false;

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
    };

    const showScreen = (id) => {
        document.querySelectorAll('.app-screen').forEach(s => s.style.display = 'none');
        document.getElementById(id).style.display = 'block';
        document.getElementById('app-header').style.display = (id === 'camera-screen') ? 'none' : 'block';
        if (id !== 'camera-screen') stopCamera();
    };

    // ANCHOR: Persistent Storage Logic
    const fieldIDs = ['name', 'email', 'phone', 'rec-email', 'wa'];
    const loadData = () => {
        fieldIDs.forEach(id => {
            const val = localStorage.getItem(`sv_${id}`);
            if (val) document.getElementById(`set-${id}`).value = val;
        });
    };
    loadData();

    document.getElementById('settings-gear').onclick = () => showScreen('settings-screen');
    document.getElementById('save-settings').onclick = () => {
        fieldIDs.forEach(id => localStorage.setItem(`sv_${id}`, document.getElementById(`set-${id}`).value));
        showScreen('menu-screen');
    };

    // ANCHOR: Navigation Fixes
    document.getElementById('cancel-init').onclick = () => showScreen('menu-screen');
    document.getElementById('cam-back').onclick = () => showScreen('menu-screen');
    document.getElementById('discard-btn').onclick = () => location.reload();
    document.getElementById('save-to-device').onclick = () => {
        const link = document.createElement('a');
        link.download = `SiteVerify_${activeJobID}_${Date.now()}.jpg`;
        link.href = document.getElementById('final-document').src;
        link.click();
    };

    // Geolocation and Clock
    navigator.geolocation.watchPosition(async (pos) => {
        liveLat = pos.coords.latitude; liveLon = pos.coords.longitude;
        document.getElementById('gps-status').innerText = "GPS: ON";
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${liveLat}&lon=${liveLon}&format=json&accept-language=en`);
            const data = await res.json();
            document.getElementById('location-display').innerText = `🌐 ${data.address.suburb || data.address.city || "Site Located"}`;
        } catch {
            document.getElementById('location-display').innerText = `📍 ${liveLat.toFixed(4)}, ${liveLon.toFixed(4)}`;
        }
    }, null, { enableHighAccuracy: true });

    setInterval(() => {
        document.getElementById('live-clock').innerText = new Date().toLocaleString('en-GB').replace(',', '');
    }, 1000);

    document.getElementById('nav-capture').onclick = () => {
        sessionPIN = (Math.floor(Math.random() * 90000000) + 10000000).toString();
        document.getElementById('pin-display').innerText = `Security PIN: ${sessionPIN}`;
        showScreen('input-screen');
    };

    // ANCHOR: QR Generation and Camera Unlock
    document.getElementById('unlock-camera').onclick = () => {
        if (document.getElementById('pin-verification').value !== sessionPIN) { alert("Incorrect PIN"); return; }
        activeJobID = document.getElementById('job-id-input').value.trim() || "Null";
        
        // Pre-generate QR Code
        const qrContainer = document.getElementById('qrcode-container');
        qrContainer.innerHTML = "";
        new QRCode(qrContainer, { text: `Job:${activeJobID}|PIN:${sessionPIN}`, width: 128, height: 128 });
        qrReady = true;

        showScreen('camera-screen');
        startCamera("environment");
    };

    async function startCamera(facing) {
        stopCamera();
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } } 
            });
            document.getElementById('video-feed').srcObject = stream;
        } catch (err) { alert("Camera Access Denied"); showScreen('menu-screen'); }
    }

    document.getElementById('shutter').onclick = async () => {
        const video = document.getElementById('video-feed');
        const canvas = document.getElementById('capture-canvas');
        const ctx = canvas.getContext('2d');
        const isSelfie = stream.getVideoTracks()[0].getSettings().facingMode === 'user';

        if (!isSelfie) {
            canvas.width = video.videoWidth; canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            rearPhotoData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            startCamera("user");
        } else {
            document.getElementById('loading-overlay').style.display = 'block';
            ctx.putImageData(rearPhotoData, 0, 0);
            
            // Draw Selfie Overlay
            const sW = canvas.width * 0.3;
            const sH = (video.videoHeight / video.videoWidth) * sW;
            ctx.drawImage(video, 20, canvas.height - sH - 20, sW, sH);

            // Draw QR Code if ready
            if (qrReady) {
                const qrImg = document.querySelector('#qrcode-container img');
                if (qrImg) ctx.drawImage(qrImg, canvas.width - 150, canvas.height - 150, 130, 130);
            }
            
            stopCamera();
            document.getElementById('final-document').src = canvas.toDataURL('image/jpeg', 0.8);
            document.getElementById('review-overlay').style.display = 'flex';
            document.getElementById('loading-overlay').style.display = 'none';
        }
    };
});
