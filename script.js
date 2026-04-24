document.addEventListener('DOMContentLoaded', () => {
    let sessionPIN = "", activeJobID = "";
    let stream = null, rearPhotoData = null;
    let currentFacingMode = "environment";

    const showScreen = (id) => {
        document.querySelectorAll('.app-screen').forEach(s => s.style.display = 'none');
        const target = document.getElementById(id);
        if(target) target.style.display = 'block';
        document.getElementById('app-header').style.display = (id === 'camera-screen') ? 'none' : 'block';
    };

    const stopCamera = () => { if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } };

    const startCamera = async (facing) => {
        stopCamera();
        currentFacingMode = facing;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 } } });
            document.getElementById('video-feed').srcObject = stream;
        } catch (e) { alert("Camera Error"); }
    };

    // v26 SUCCESS INITIALIZATION
    document.getElementById('nav-capture').onclick = () => {
        sessionPIN = (Math.floor(Math.random() * 90000000) + 10000000).toString();
        document.getElementById('pin-display').innerText = sessionPIN;
        showScreen('input-screen');
    };

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
            document.getElementById('review-overlay').style.display = 'flex';
            ctx.putImageData(rearPhotoData, 0, 0);
            
            // RECALLED BAKING: April 17 Logic
            const pipW = canvas.width * 0.25;
            const pipH = (video.videoHeight / video.videoWidth) * pipW;
            ctx.drawImage(video, 20, canvas.height - pipH - 20, pipW, pipH);

            const qrContainer = document.getElementById('qrcode-cache');
            qrContainer.innerHTML = "";
            const qrData = [`Job: ${activeJobID}`, "NG SEE ON", "+60127383923", sessionPIN, new Date().toLocaleDateString('en-GB'), new Date().toLocaleTimeString('en-GB', {hour12:false}), Math.floor(Date.now()/1000), "Lat 1.4579", "Lng 103.6450"].join('\n');
            
            new QRCode(qrContainer, { text: qrData, width: 250, height: 250 });

            const checkQR = setInterval(() => {
                const qrImg = qrContainer.querySelector('img');
                if (qrImg && qrImg.complete) {
                    clearInterval(checkQR);
                    const qrSize = canvas.width * 0.20;
                    ctx.drawImage(qrImg, canvas.width - qrSize - 20, canvas.height - qrSize - 20, qrSize, qrSize);
                    document.getElementById('final-document').src = canvas.toDataURL('image/jpeg', 0.9);
                    document.getElementById('final-actions').style.display = 'flex';
                    stopCamera();
                }
            }, 500);
        }
    };

    document.getElementById('save-to-device').onclick = () => {
        const link = document.createElement('a');
        link.download = `SV_${activeJobID}.jpg`;
        link.href = document.getElementById('final-document').src;
        link.click();
    };

    document.getElementById('discard-btn').onclick = () => location.reload();
    document.getElementById('cam-back').onclick = () => location.reload();

    setInterval(() => {
        const clock = document.getElementById('live-clock');
        if(clock) clock.innerText = new Date().toLocaleString('en-GB').replace(',', '');
    }, 1000);
});
