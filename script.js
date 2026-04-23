document.addEventListener('DOMContentLoaded', () => {
    let liveLat = 0, liveLon = 0, sessionPIN = "", activeJobID = "";
    let stream = null, rearPhotoData = null;

    const stopCamera = () => {
        if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    };

    const showScreen = (id) => {
        document.querySelectorAll('.app-screen').forEach(s => s.style.display = 'none');
        document.getElementById(id).style.display = 'block';
        document.getElementById('app-header').style.display = (id === 'camera-screen') ? 'none' : 'block';
        if (id !== 'camera-screen') stopCamera();
    };

    // System Settings Persistence
    const fieldIDs = ['name', 'email', 'phone', 'rec-email', 'wa'];
    fieldIDs.forEach(id => {
        const val = localStorage.getItem(`sv_${id}`);
        if (val) document.getElementById(`set-${id}`).value = val;
    });

    document.getElementById('settings-gear').onclick = () => showScreen('settings-screen');
    document.getElementById('save-settings').onclick = () => {
        fieldIDs.forEach(id => localStorage.setItem(`sv_${id}`, document.getElementById(`set-${id}`).value));
        showScreen('menu-screen');
    };

    // ANCHOR: Navigation Integrity
    document.getElementById('cancel-init').onclick = () => showScreen('menu-screen');
    
    document.getElementById('cam-back').onclick = () => {
        const isSelfie = stream?.getVideoTracks()[0].getSettings().facingMode === 'user';
        if (isSelfie) {
            startCamera("environment"); // Back to Main Capture
        } else {
            showScreen('menu-screen'); // Back to Menu
        }
    };

    document.getElementById('discard-btn').onclick = () => location.reload();
    document.getElementById('save-to-device').onclick = () => {
        const link = document.createElement('a');
        link.download = `SiteVerify_${activeJobID}.jpg`;
        link.href = document.getElementById('final-document').src;
        link.click();
    };

    // GPS & Clock
    navigator.geolocation.watchPosition((pos) => {
        liveLat = pos.coords.latitude; liveLon = pos.coords.longitude;
        document.getElementById('gps-status').innerText = "GPS: ON";
    }, null, { enableHighAccuracy: true });

    setInterval(() => {
        document.getElementById('live-clock').innerText = new Date().toLocaleString('en-GB').replace(',', '');
    }, 1000);

    document.getElementById('nav-capture').onclick = () => {
        sessionPIN = (Math.floor(Math.random() * 90000000) + 10000000).toString();
        document.getElementById('pin-display').innerText = `Security PIN: ${sessionPIN}`;
        showScreen('input-screen');
    };

    document.getElementById('unlock-camera').onclick = () => {
        if (document.getElementById('pin-verification').value !== sessionPIN) { alert("Invalid PIN"); return; }
        activeJobID = document.getElementById('job-id-input').value.trim() || "Null";
        showScreen('camera-screen');
        startCamera("environment");
    };

    async function startCamera(facing) {
        stopCamera();
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        document.getElementById('video-feed').srcObject = stream;
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
            // ENTER QR GENERATION STATE
            document.getElementById('review-overlay').style.display = 'flex';
            document.getElementById('qr-loading-status').style.display = 'block';
            document.getElementById('final-actions').style.display = 'none';

            // 1. Draw Rear Image
            ctx.putImageData(rearPhotoData, 0, 0);
            
            // 2. Draw Selfie
            const sW = canvas.width * 0.3;
            const sH = (video.videoHeight / video.videoWidth) * sW;
            ctx.drawImage(video, 20, canvas.height - sH - 20, sW, sH);

            // 3. Generate & Draw QR (Delayed for animation effect)
            const qrContainer = document.getElementById('qrcode-container');
            qrContainer.innerHTML = "";
            new QRCode(qrContainer, { text: `Job:${activeJobID}|PIN:${sessionPIN}`, width: 256, height: 256 });

            setTimeout(() => {
                const qrImg = qrContainer.querySelector('img');
                if (qrImg) {
                    ctx.drawImage(qrImg, canvas.width - 170, canvas.height - 170, 150, 150);
                    document.getElementById('final-document').src = canvas.toDataURL('image/jpeg', 0.9);
                    
                    // EXIT QR STATE -> SHOW BUTTONS
                    document.getElementById('qr-loading-status').style.display = 'none';
                    document.getElementById('final-actions').style.display = 'flex';
                    stopCamera();
                }
            }, 2000); // 2 second delay to show the "Generating" state
        }
    };
});
