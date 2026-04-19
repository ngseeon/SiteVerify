document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video-feed');
    const canvas = document.getElementById('capture-canvas');
    const locDisplay = document.getElementById('location-display');
    const gpsStatus = document.getElementById('gps-status');
    const header = document.getElementById('app-header');
    
    let stream = null;
    let sitePhoto = null; 
    let currentCoords = { lat: 0, lon: 0 };
    let capturedPIN = "";
    let currentTown = "Gelang Patah";

    // 1. LIVE CLOCK
    setInterval(() => {
        document.getElementById('live-clock').innerText = new Date().toLocaleString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' }).replace(',','');
    }, 1000);

    // 2. GPS & TOWN OVERRIDE
    function initGPS() {
        navigator.geolocation.watchPosition(async (p) => {
            currentCoords = { lat: p.coords.latitude, lon: p.coords.longitude };
            gpsStatus.innerText = "GPS: ON";
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${currentCoords.lat}&lon=${currentCoords.lon}`);
                const data = await res.json();
                let detected = data.address.town || data.address.village || data.address.suburb || data.address.city;
                // Strict Override: Iskandar Puteri -> Gelang Patah
                currentTown = (detected === "Iskandar Puteri") ? "Gelang Patah" : detected;
                locDisplay.innerText = `🌐 ${currentTown}`;
            } catch (e) { locDisplay.innerText = "🌐 Gelang Patah"; }
        }, null, { enableHighAccuracy: true });
    }
    initGPS();

    // 3. SCREEN NAVIGATION
    function showScreen(id) {
        document.querySelectorAll('.app-screen').forEach(s => s.style.display = 'none');
        document.getElementById(id).style.display = 'block';
        header.style.display = (id === 'camera-screen') ? 'none' : 'block';
    }

    // 4. CAMERA ENGINE (Rear then Front)
    async function startCamera(facing) {
        if(stream) stream.getTracks().forEach(t => t.stop());
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: 1280, height: 720 } });
        video.srcObject = stream;
    }

    document.getElementById('nav-capture').onclick = () => { showScreen('camera-screen'); startCamera("environment"); };
    document.getElementById('set-nav-capture').onclick = () => { showScreen('camera-screen'); startCamera("environment"); };

    // 5. THE CAPTURE WORKFLOW
    document.getElementById('shutter').onclick = async () => {
        const ctx = canvas.getContext('2d');
        const facingMode = stream.getVideoTracks()[0].getSettings().facingMode;

        if (facingMode !== 'user') {
            // Stage 1: Rear Capture
            canvas.width = 1280; canvas.height = 720;
            ctx.drawImage(video, 0, 0, 1280, 720);
            sitePhoto = ctx.getImageData(0, 0, 1280, 720);
            startCamera("user");
        } else {
            // Stage 2: Front Selfie + Data Generation
            // PIN Math: Sum of decimals
            const dStr = currentCoords.lat.toString().split('.')[1] + currentCoords.lon.toString().split('.')[1];
            capturedPIN = dStr.split('').reduce((a,b)=>parseInt(a)+parseInt(b), 0).toString().padStart(4,'0').substring(0,4);
            
            // Show PIN entry over live front feed (sharp background)
            document.getElementById('generated-pin').innerText = capturedPIN;
            document.getElementById('pin-overlay').style.display = 'flex';
            document.getElementById('camera-controls').style.display = 'none';
        }
    };

    // 6. VERIFY, LOCK & RENDER
    document.getElementById('verify-pin-btn').onclick = () => {
        if (document.getElementById('pin-input').value === capturedPIN) {
            renderFinalDocument();
        } else { alert("PIN Mismatch"); }
    };

    function renderFinalDocument() {
        const ctx = canvas.getContext('2d');
        // Restore Rear Site Photo
        ctx.putImageData(sitePhoto, 0, 0);

        // Overlay Selfie (Bottom Left)
        ctx.lineWidth = 10; ctx.strokeStyle = "white";
        ctx.strokeRect(40, 460, 240, 240);
        ctx.drawImage(video, 40, 460, 240, 240);

        // Generate QR Data Payload
        const qrContent = `User: ${document.getElementById('set-username').value}\nPhone: ${document.getElementById('set-userphone').value}\nLoc: ${currentTown}\nGPS: ${currentCoords.lat},${currentCoords.lon}\nTime: ${document.getElementById('live-clock').innerText}`;
        
        const qrTemp = document.getElementById('qrcode-temp');
        qrTemp.innerHTML = "";
        new QRCode(qrTemp, { text: qrContent, width: 200, height: 200 });

        setTimeout(() => {
            // Overlay QR (Bottom Right)
            ctx.drawImage(qrTemp.querySelector('img'), 1040, 460, 200, 200);
            
            // Kill Stream & Show Review
            stream.getTracks().forEach(t => t.stop());
            document.getElementById('final-document').src = canvas.toDataURL('image/jpeg', 0.95);
            document.getElementById('pin-overlay').style.display = 'none';
            document.getElementById('review-overlay').style.display = 'block';
        }, 500);
    }

    // 7. SAVE & SHARE
    document.getElementById('save-to-device').onclick = () => {
        const link = document.createElement('a');
        link.download = `SiteVerify_${Date.now()}.jpg`;
        link.href = document.getElementById('final-document').src;
        link.click();
        document.getElementById('save-controls').style.display = 'none';
        document.getElementById('share-controls').style.display = 'flex';
    };

    document.getElementById('share-whatsapp').onclick = () => {
        const phone = document.getElementById('set-recphone').value.replace(/\+/g,'');
        window.open(`https://wa.me/${phone}?text=Verified%20at%20${currentTown}`);
    };

    document.getElementById('share-gmail').onclick = () => {
        const email = document.getElementById('set-recemail').value;
        window.location.href = `mailto:${email}?subject=SiteVerify%20Report&body=Attached%20Verification`;
    };

    // MISC NAV
    document.getElementById('settings-gear').onclick = () => showScreen('settings-screen');
    document.getElementById('save-settings').onclick = () => location.reload();
    document.getElementById('cam-back').onclick = () => location.reload();
    document.getElementById('discard-btn').onclick = () => location.reload();
    document.getElementById('final-back').onclick = () => location.reload();
    document.getElementById('set-nav-history').onclick = () => alert("History feature in Phase 3");
    document.getElementById('nav-history').onclick = () => alert("History feature in Phase 3");
});
