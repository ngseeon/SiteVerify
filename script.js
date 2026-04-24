document.addEventListener('DOMContentLoaded', () => {
    let sessionPIN = "", activeJobID = "";
    let stream = null, rearPhotoData = null;
    let currentFacingMode = "environment";

    const showScreen = (id) => {
        document.querySelectorAll('.app-screen').forEach(s => s.style.display = 'none');
        document.getElementById(id).style.display = 'block';
        document.getElementById('app-header').style.display = (id === 'camera-screen') ? 'none' : 'block';
    };

    const stopCamera = () => { if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } };

    const startCamera = async (facing) => {
        stopCamera();
        currentFacingMode = facing;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 } } });
            document.getElementById('video-feed').srcObject = stream;
        } catch (e) { console.error("Cam fail"); }
    };

    document.getElementById('nav-capture').onclick = () => {
        sessionPIN = (Math.floor(Math.random() * 90000000) + 10000000).toString();
        document.getElementById('pin-display').innerText = sessionPIN;
        showScreen('input-screen');
    };

    document.getElementById('unlock-camera').onclick = () => {
        if (document.getElementById('pin-verification').value !== sessionPIN) { alert("PIN Error"); return; }
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
            // STATE LOCK: Show processing UI
            document.getElementById('review-overlay').style.display = 'flex';
            document.getElementById('process-tracker').style.display = 'flex';
            document.getElementById('final-actions').style.display = 'none';

            // Draw Selfie PIP immediately to give visual feedback
            ctx.putImageData(rearPhotoData, 0, 0);
            const pipW = canvas.width * 0.28;
            const pipH = (video.videoHeight / video.videoWidth) * pipW;
            ctx.drawImage(video, 30, canvas.height - pipH - 30, pipW, pipH);
            document.getElementById('final-document').src = canvas.toDataURL('image/jpeg', 0.7);

            // Generate QR Data
            const qrContainer = document.getElementById('qrcode-cache');
            qrContainer.innerHTML = "";
            const qrData = [`Job: ${activeJobID}`, "NG SEE ON", "+60127383923", sessionPIN, new Date().toLocaleDateString('en-GB'), new Date().toLocaleTimeString('en-GB', {hour12:false}), Math.floor(Date.now()/1000), "Lat 1.4579", "Lng 103.6450"].join('\n');
            
            new QRCode(qrContainer, { text: qrData, width: 300, height: 300 });

            // WAIT Logic for QR Render
            const checkQR = setInterval(() => {
                const qrImg = qrContainer.querySelector('img');
                if (qrImg && qrImg.complete) {
                    clearInterval(checkQR);
                    // Bake QR to Canvas
                    const qrSize = canvas.width * 0.22;
                    ctx.drawImage(qrImg, canvas.width - qrSize - 30, canvas.height - qrSize - 30, qrSize, qrSize);
                    
                    // Final Reveal
                    document.getElementById('final-document').src = canvas.toDataURL('image/jpeg', 0.9);
                    document.getElementById('process-tracker').style.display = 'none';
                    document.getElementById('final-actions').style.display = 'flex';
                    stopCamera();
                }
            }, 800);
        }
    };

    document.getElementById('save-to-device').onclick = () => {
        const link = document.createElement('a');
        link.download = `SiteVerify_${activeJobID}.jpg`;
        link.href = document.getElementById('final-document').src;
        link.click();
    };

    document.getElementById('discard-btn').onclick = () => location.reload();
    document.getElementById('cam-back').onclick = () => location.reload();
    document.getElementById('settings-gear').onclick = () => showScreen('settings-screen');
    document.getElementById('save-settings').onclick = () => showScreen('menu-screen');

    setInterval(() => {
        const clock = document.getElementById('live-clock');
        if(clock) clock.innerText = new Date().toLocaleString('en-GB').replace(',', '');
    }, 1000);
});
