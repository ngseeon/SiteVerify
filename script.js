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

    // 1. CLOCK
    setInterval(() => {
        document.getElementById('live-clock').innerText = new Date().toLocaleString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' }).replace(',','');
    }, 1000);

    // 2. DYNAMIC GPS: Town Priority
    async function initGPS() {
        navigator.geolocation.getCurrentPosition(async (p) => {
            currentCoords = { lat: p.coords.latitude, lon: p.coords.longitude };
            gpsStatus.innerText = "GPS: ON";
            
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${currentCoords.lat}&lon=${currentCoords.lon}`);
                const data = await res.json();
                // Priority: Town -> Village -> Suburb
                currentTown = data.address.town || data.address.village || data.address.suburb || data.address.city || "Gelang Patah";
                locDisplay.innerText = `🌐 ${currentTown}`;
            } catch (e) { locDisplay.innerText = "🌐 Location Found"; }
        }, null, { enableHighAccuracy: true });
    }
    initGPS();

    // 3. NAVIGATION (Strict Isolation)
    function showScreen(id) {
        document.querySelectorAll('.app-screen').forEach(s => s.style.display = 'none');
        document.getElementById(id).style.display = 'block';
        header.style.display = (id === 'camera-screen') ? 'none' : 'block';
    }

    // 4. CAMERA ENGINE
    async function startCam(mode) {
        if(stream) stream.getTracks().forEach(t => t.stop());
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode, width: 1280, height: 720 } });
        video.srcObject = stream;
        isFrontCamera = (mode === "user");
    }

    document.getElementById('nav-capture').onclick = () => {
        showScreen('camera-screen');
        startCam("environment");
    };

    document.getElementById('shutter').onclick = async () => {
        const ctx = canvas.getContext('2d');
        if (!isFrontCamera) {
            canvas.width = 1280; canvas.height = 720;
            ctx.drawImage(video, 0, 0, 1280, 720);
            startCam("user"); // Swap to selfie
        } else {
            // Overlay Selfie
            ctx.lineWidth = 10; ctx.strokeStyle = "white";
            ctx.strokeRect(30, 470, 220, 220);
            ctx.drawImage(video, 30, 470, 220, 220);
            
            // Calculate PIN
            const dStr = currentCoords.lat.toString().split('.')[1] + currentCoords.lon.toString().split('.')[1];
            capturedPIN = dStr.split('').reduce((a,b)=>parseInt(a)+parseInt(b), 0).toString().padStart(4,'0').substring(0,4);
            
            renderFinalStamp();
        }
    };

    function renderFinalStamp() {
        const ctx = canvas.getContext('2d');
        const stampStr = `User: ${document.getElementById('set-username').value}\nLoc: ${currentTown}\nGPS: ${currentCoords.lat.toFixed(5)}, ${currentCoords.lon.toFixed(5)}\nTime: ${document.getElementById('live-clock').innerText}`;
        
        const qrDiv = document.getElementById('qrcode');
        qrDiv.innerHTML = "";
        new QRCode(qrDiv, { text: stampStr, width: 160, height: 160 });

        setTimeout(() => {
            ctx.drawImage(qrDiv.querySelector('img'), 1080, 520, 160, 160); // QR Bottom Right
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            document.getElementById('pin-preview-bg').src = dataUrl;
            finalPreview.src = dataUrl;
            
            document.getElementById('generated-pin').innerText = capturedPIN;
            document.getElementById('pin-overlay').style.display = 'flex';
            document.getElementById('camera-controls').style.display = 'none';
        }, 400);
    }

    // 5. PIN VERIFY
    document.getElementById('verify-pin-btn').onclick = () => {
        if(document.getElementById('pin-input').value === capturedPIN) {
            document.getElementById('pin-overlay').style.display = 'none';
            document.getElementById('review-overlay').style.display = 'flex';
        } else { alert("Incorrect Security PIN"); }
    };

    // NAV HANDLERS
    document.getElementById('settings-gear').onclick = () => showScreen('settings-screen');
    document.getElementById('save-settings').onclick = () => location.reload();
    document.getElementById('cam-back').onclick = () => location.reload();
    document.getElementById('discard-btn').onclick = () => location.reload();
    document.getElementById('save-to-device').onclick = () => {
        const link = document.createElement('a');
        link.download = `SiteVerify_${Date.now()}.jpg`;
        link.href = finalPreview.src;
        link.click();
        document.getElementById('save-controls').style.display = 'none';
        document.getElementById('share-controls').style.display = 'flex';
    };
});
