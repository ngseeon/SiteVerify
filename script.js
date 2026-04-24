document.addEventListener('DOMContentLoaded', () => {
    let liveLat = 0, liveLon = 0, sessionPIN = "", activeJobID = "";
    let stream = null, rearPhotoData = null;
    let currentFacingMode = "environment"; // Tracks state to prevent nav-errors

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
                video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } } 
            });
            document.getElementById('video-feed').srcObject = stream;
        } catch (err) {
            alert("Camera Error: Please ensure permissions are granted.");
        }
    };

    // --- Hardened Navigation Routing ---
    document.getElementById('cam-back').onclick = () => {
        if (currentFacingMode === "user") {
            startCamera("environment"); // Forced forward to Main Capture
        } else {
            showScreen('menu-screen'); // Only return to menu from Rear mode
        }
    };

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

    // --- Capture & QR Logic ---
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
            // Initiate QR Generation Sequence
            document.getElementById('review-overlay').style.display = 'flex';
            document.getElementById('qr-loading-status').style.display = 'block';
            document.getElementById('final-actions').style.display = 'none';

            // Base Image Composition
            ctx.putImageData(rearPhotoData, 0, 0);
            const sW = canvas.width * 0.3;
            const sH = (video.videoHeight / video.videoWidth) * sW;
            ctx.drawImage(video, 20, canvas.height - sH - 20, sW, sH);

            // Create QR
            const qrContainer = document.getElementById('qrcode-container');
            qrContainer.innerHTML = "";
            new QRCode(qrContainer, { text: `JobID:${activeJobID}|PIN:${sessionPIN}`, width: 256, height: 256 });

            // Animated Delay for "Generating" State
            setTimeout(() => {
                const qrImg = qrContainer.querySelector('img');
                if (qrImg) {
                    ctx.drawImage(qrImg, canvas.width - 170, canvas.height - 170, 150, 150);
                    document.getElementById('final-document').src = canvas.toDataURL('image/jpeg', 0.9);
                    
                    document.getElementById('qr-loading-status').style.display = 'none';
                    document.getElementById('final-actions').style.display = 'flex';
                    stopCamera();
                }
            }, 2000);
        }
    };

    // UI Cleanup
    document.getElementById('discard-btn').onclick = () => location.reload();
    document.getElementById('save-to-device').onclick = () => {
        const link = document.createElement('a');
        link.download = `SiteVerify_${activeJobID}.jpg`;
        link.href = document.getElementById('final-document').src;
        link.click();
    };

    // Header Persistence
    document.getElementById('settings-gear').onclick = () => showScreen('settings-screen');
    document.getElementById('save-settings').onclick = () => showScreen('menu-screen');
    setInterval(() => {
        document.getElementById('live-clock').innerText = new Date().toLocaleString('en-GB').replace(',', '');
    }, 1000);
});
