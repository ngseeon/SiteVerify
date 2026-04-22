document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loading-overlay');
    let liveLat = 0, liveLon = 0, sessionPIN = "", activeJobID = "", masterAuditBody = "";
    let stream = null, rearPhotoData = null;

    navigator.geolocation.watchPosition((p) => {
        liveLat = p.coords.latitude; liveLon = p.coords.longitude;
        document.getElementById('gps-status').innerText = "GPS: ON";
    }, null, { enableHighAccuracy: true });

    setInterval(() => {
        document.getElementById('live-clock').innerText = new Date().toLocaleString('en-GB').replace(',','');
    }, 1000);

    const showScreen = (id) => {
        document.querySelectorAll('.app-screen').forEach(s => s.style.display = 'none');
        document.getElementById(id).style.display = 'block';
        document.getElementById('app-header').style.display = (id === 'camera-screen') ? 'none' : 'block';
    };

    document.getElementById('nav-capture').onclick = () => {
        sessionPIN = (Math.floor(Math.random() * 90000000) + 10000000).toString();
        document.getElementById('pin-display').innerText = `Security PIN: ${sessionPIN}`;
        showScreen('input-screen');
    };

    document.getElementById('unlock-camera').onclick = () => {
        let val = document.getElementById('job-id-input').value.trim();
        activeJobID = (val === "") ? "Null" : val; // RULE 1: Null Assignment
        
        const pinVal = document.getElementById('pin-verification').value;
        if (pinVal !== sessionPIN) { alert("Incorrect PIN"); return; }

        masterAuditBody = `Job ID: ${activeJobID}\nPIN: ${sessionPIN}\nLat: ${liveLat}\nLon: ${liveLon}\nTimestamp: ${Date.now()}`;
        showScreen('camera-screen');
        startCamera("environment");
    };

    async function startCamera(facing) {
        if(stream) stream.getTracks().forEach(t => t.stop());
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } } 
        });
        document.getElementById('video-feed').srcObject = stream;
    }

    document.getElementById('shutter').onclick = () => {
        const video = document.getElementById('video-feed');
        const canvas = document.getElementById('capture-canvas');
        const ctx = canvas.getContext('2d');
        const mode = stream.getVideoTracks()[0].getSettings().facingMode;

        if (mode !== 'user') {
            // Step 1: Capture Rear Site Photo
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            rearPhotoData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            startCamera("user");
        } else {
            // Step 2: Capture Selfie & FREEZE
            loader.style.display = 'flex'; // Show spinner immediately
            
            ctx.putImageData(rearPhotoData, 0, 0); 
            
            // RULE 2: Natural Ratio Selfie (Prevent Squashing)
            const sWidth = canvas.width * 0.25;
            const sRatio = video.videoWidth / video.videoHeight;
            const sHeight = sWidth / sRatio;
            ctx.drawImage(video, 20, canvas.height - sHeight - 20, sWidth, sHeight);
            
            // FREEZE BACKGROUND: Update UI immediately while spinning
            document.getElementById('final-document').src = canvas.toDataURL('image/jpeg', 0.5);
            document.getElementById('review-overlay').style.display = 'flex';
            document.getElementById('camera-controls').style.display = 'none';
            
            // Kill Live Feed to show frozen image only
            stream.getTracks().forEach(t => t.stop());

            // RULE 3: Baking & QR Render
            const qrBox = document.getElementById('qrcode-temp');
            qrBox.innerHTML = "";
            const qrSize = canvas.width * 0.18;
            new QRCode(qrBox, { text: masterAuditBody, width: qrSize, height: qrSize });

            const checkQR = setInterval(() => {
                const img = qrBox.querySelector('img');
                if (img && img.complete && img.naturalWidth > 0) {
                    clearInterval(checkQR);
                    // Draw finalized QR onto the canvas
                    ctx.drawImage(img, canvas.width - qrSize - 20, canvas.height - qrSize - 20, qrSize, qrSize);
                    // Update final source with baked QR
                    document.getElementById('final-document').src = canvas.toDataURL('image/jpeg', 0.9);
                    loader.style.display = 'none'; // Hide spinner once logic finishes
                }
            }, 100);
        }
    };

    document.getElementById('save-to-device').onclick = () => {
        const a = document.createElement('a');
        a.href = document.getElementById('final-document').src;
        a.download = `SiteVerify_${activeJobID}.jpg`;
        a.click();
    };

    document.getElementById('discard-btn').onclick = () => location.reload();
});
