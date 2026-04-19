document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('app-header');
    const video = document.getElementById('video-feed');
    const canvas = document.getElementById('capture-canvas');
    const finalPreview = document.getElementById('final-preview');
    const locDisplay = document.getElementById('location-display');
    const gpsStatus = document.getElementById('gps-status');
    
    let stream = null;
    let currentCoords = { lat: 0, lon: 0 };
    let capturedPIN = "";
    let isFrontCamera = false;
    let currentTown = "Detecting...";

    // 1. LIVE CLOCK
    setInterval(() => {
        document.getElementById('live-clock').innerText = new Date().toLocaleString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' }).replace(',','');
    }, 1000);

    // 2. DYNAMIC GPS & REVERSE GEOCODING
    async function initGPS() {
        navigator.geolocation.getCurrentPosition(async (p) => {
            currentCoords = { lat: p.coords.latitude, lon: p.coords.longitude };
            gpsStatus.innerText = "GPS: ON";
            gpsStatus.style.color = "black";
            
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${currentCoords.lat}&lon=${currentCoords.lon}`);
                const data = await res.json();
                currentTown = data.address.town || data.address.village || data.address.city || data.address.suburb || "Gelang Patah";
                locDisplay.innerText = `🌐 ${currentTown}`;
            } catch (e) { locDisplay.innerText = "🌐 Location Found"; }
        }, () => {
            gpsStatus.innerText = "GPS: OFF";
            gpsStatus.style.color = "red";
        }, { enableHighAccuracy: true });
    }
    initGPS();

    // 3. CAMERA ENGINE (Rear then Front)
    async function startCam(mode) {
        if(stream) stream.getTracks().forEach(t => t.stop());
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode, width: 1280, height: 720 } });
            video.srcObject = stream;
            isFrontCamera = (mode === "user");
        } catch (err) { alert("Camera Error: Please check permissions."); }
    }

    document.getElementById('nav-capture').onclick = () => {
        if (gpsStatus.innerText === "GPS: OFF") { alert("Enable GPS to proceed."); return; }
        document.getElementById('camera-screen').style.display = 'block';
        header.style.display = 'none';
        startCam("environment");
    };

    // 4. SEQUENTIAL CAPTURE & INTEGRATION
    document.getElementById('shutter').onclick = async () => {
        const ctx = canvas.getContext('2d');
        if (!isFrontCamera) {
            // Stage 1: Rear Snap (16:9)
            canvas.width = 1280; canvas.height = 720;
            ctx.drawImage(video, 0, 0, 1280, 720);
            startCam("user"); // Swap to Selfie
        } else {
            // Stage 2: Front Snap Overlay
            ctx.lineWidth = 8; ctx.strokeStyle = "white";
            ctx.strokeRect(30, 470, 220, 220);
            ctx.drawImage(video, 30, 470, 220, 220);
            
            // PIN Calculation (Sum of Decimals)
            const dStr = currentCoords.lat.toString().split('.')[1] + currentCoords.lon.toString().split('.')[1];
            capturedPIN = dStr.split('').reduce((a,b)=>parseInt(a)+parseInt(b), 0).toString().padStart(4,'0').substring(0,4);
            
            renderFinalStamp();
        }
    };

    function renderFinalStamp() {
        const ctx = canvas.getContext('2d');
        const stampStr = `User: ${document.getElementById('set-username').value}\nPhone: ${document.getElementById('set-userphone').value}\nLoc: ${currentTown}\nGPS: ${currentCoords.lat.toFixed(5)}, ${currentCoords.lon.toFixed(5)}\nTime: ${document.getElementById('live-clock').innerText}`;
        
        const qrDiv = document.getElementById('qrcode');
        qrDiv.innerHTML = "";
        new QRCode(qrDiv, { text: stampStr, width: 160, height: 160 });

        setTimeout(() => {
            // Apply QR to Bottom Right
            ctx.drawImage(qrDiv.querySelector('img'), 1080, 520, 160, 160);
            const finalImg = canvas.toDataURL('image/jpeg', 0.9);
            
            document.getElementById('pin-preview-bg').src = finalImg;
            finalPreview.src = finalImg;
            
            document.getElementById('generated-pin').innerText = capturedPIN;
            document.getElementById('pin-overlay').style.display = 'flex';
            document.getElementById('camera-controls').style.display = 'none';
        }, 400);
    }

    // 5. PIN & SHARE LOGIC
    document.getElementById('verify-pin-btn').onclick = () => {
        if(document.getElementById('pin-input').value === capturedPIN) {
            document.getElementById('pin-overlay').style.display = 'none';
            document.getElementById('review-overlay').style.display = 'flex';
        } else { alert("Verification Failed. Check Security PIN."); }
    };

    document.getElementById('save-to-device').onclick = () => {
        const link = document.createElement('a');
        link.download = `SiteVerify_${Date.now()}.jpg`;
        link.href = finalPreview.src;
        link.click();
        document.getElementById('save-controls').style.display = 'none';
        document.getElementById('share-controls').style.display = 'flex';
    };

    document.getElementById('share-whatsapp').onclick = () => {
        const num = document.getElementById('set-recphone').value.replace(/\+/g,'');
        window.open(`https://wa.me/${num}?text=Site%20Verification%20Report%3A%20${currentTown}`);
        location.reload();
    };

    document.getElementById('share-gmail').onclick = () => {
        window.location.href = `mailto:${document.getElementById('set-recemail').value}?subject=SiteVerify%20Capture&body=Verified%20at%20${currentTown}`;
        location.reload();
    };

    // NAVIGATION
    document.getElementById('settings-gear').onclick = () => {
        document.getElementById('settings-screen').style.display = 'block';
        document.getElementById('menu-screen').style.display = 'none';
    };
    document.getElementById('save-settings').onclick = () => location.reload();
    document.getElementById('cam-back').onclick = () => location.reload();
    document.getElementById('discard-btn').onclick = () => location.reload();
    document.getElementById('final-back').onclick = () => location.reload();
});
