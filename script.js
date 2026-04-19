document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video-feed');
    const canvas = document.getElementById('capture-canvas');
    const locDisplay = document.getElementById('location-display');
    const header = document.getElementById('app-header');
    
    let stream = null;
    let sitePhoto = null; 
    let currentCoords = { lat: 0, lon: 0 };
    let capturedPIN = "";
    let currentTown = "Gelang Patah";

    // 1. DATA PERSISTENCE & LOAD
    const fields = ['username', 'useremail', 'userphone', 'recemail', 'recphone'];
    const loadSettings = () => {
        fields.forEach(f => {
            const val = localStorage.getItem(`sv_${f}`);
            if (val) document.getElementById(`set-${f}`).value = val;
        });
    };
    loadSettings();

    document.getElementById('save-settings').onclick = () => {
        fields.forEach(f => localStorage.setItem(`sv_${f}`, document.getElementById(`set-${f}`).value));
        alert("Settings Saved Successfully");
        showScreen('menu-screen');
    };

    // 2. LIVE CLOCK
    setInterval(() => {
        document.getElementById('live-clock').innerText = new Date().toLocaleString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' }).replace(',','');
    }, 1000);

    // 3. GPS & TOWN OVERRIDE
    function initGPS() {
        navigator.geolocation.watchPosition(async (p) => {
            currentCoords = { lat: p.coords.latitude, lon: p.coords.longitude };
            document.getElementById('gps-status').innerText = "GPS: ON";
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${currentCoords.lat}&lon=${currentCoords.lon}`);
                const data = await res.json();
                let detected = data.address.town || data.address.village || data.address.suburb || data.address.city;
                // Force "Gelang Patah" override
                currentTown = (detected === "Iskandar Puteri") ? "Gelang Patah" : (detected || "Gelang Patah");
                locDisplay.innerText = `🌐 ${currentTown}`;
            } catch (e) { locDisplay.innerText = "🌐 Gelang Patah"; }
        }, null, { enableHighAccuracy: true });
    }
    initGPS();

    // 4. SCREEN NAVIGATION
    function showScreen(id) {
        document.querySelectorAll('.app-screen').forEach(s => s.style.display = 'none');
        document.getElementById(id).style.display = 'block';
        header.style.display = (id === 'camera-screen') ? 'none' : 'block';
    }

    // 5. CAMERA ENGINE (Rear -> Front Sequence)
    async function startCamera(facing) {
        if(stream) stream.getTracks().forEach(t => t.stop());
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: 1280, height: 720 } });
            video.srcObject = stream;
        } catch (e) { alert("Camera Error: " + e); }
    }

    document.getElementById('nav-capture').onclick = () => { showScreen('camera-screen'); startCamera("environment"); };
    document.getElementById('cam-back').onclick = () => {
        const mode = stream.getVideoTracks()[0].getSettings().facingMode;
        if (mode === 'user') { startCamera("environment"); } else { location.reload(); }
    };

    // 6. DUAL CAPTURE & PIN TRIGGER
    document.getElementById('shutter').onclick = () => {
        const ctx = canvas.getContext('2d');
        const mode = stream.getVideoTracks()[0].getSettings().facingMode;

        if (mode !== 'user') {
            canvas.width = 1280; canvas.height = 720;
            ctx.drawImage(video, 0, 0, 1280, 720);
            sitePhoto = ctx.getImageData(0, 0, 1280, 720);
            startCamera("user"); // Move to Selfie Stage
        } else {
            // PIN Calculation (Sum of GPS Decimals)
            const dStr = currentCoords.lat.toString().split('.')[1] + currentCoords.lon.toString().split('.')[1];
            capturedPIN = dStr.split('').reduce((a,b)=>parseInt(a)+parseInt(b), 0).toString().padStart(4,'0').substring(0,4);
            
            document.getElementById('generated-pin').innerText = capturedPIN;
            document.getElementById('pin-overlay').style.display = 'flex';
            document.getElementById('camera-controls').style.display = 'none';
        }
    };

    // 7. VERIFY & RENDER (No Watermarks, integrated QR only)
    document.getElementById('verify-pin-btn').onclick = () => {
        if (document.getElementById('pin-input').value === capturedPIN) {
            const ctx = canvas.getContext('2d');
            ctx.putImageData(sitePhoto, 0, 0); // Restore site photo

            // Selfie (Bottom Left)
            ctx.lineWidth = 8; ctx.strokeStyle = "white";
            ctx.strokeRect(40, 460, 240, 240);
            ctx.drawImage(video, 40, 460, 240, 240);

            // QR Generation
            const qrContent = `User: ${localStorage.getItem('sv_username')}\nPhone: ${localStorage.getItem('sv_userphone')}\nLoc: ${currentTown}\nGPS: ${currentCoords.lat},${currentCoords.lon}\nTime: ${document.getElementById('live-clock').innerText}`;
            const qrTemp = document.getElementById('qrcode-temp');
            qrTemp.innerHTML = "";
            new QRCode(qrTemp, { text: qrContent, width: 220, height: 220 });

            setTimeout(() => {
                ctx.drawImage(qrTemp.querySelector('img'), 1020, 460, 220, 220); // QR (Bottom Right)
                stream.getTracks().forEach(t => t.stop()); // Stop camera
                document.getElementById('final-document').src = canvas.toDataURL('image/jpeg', 0.9);
                document.getElementById('pin-overlay').style.display = 'none';
                document.getElementById('review-overlay').style.display = 'block';
            }, 600);
        } else { alert("Incorrect Security PIN"); }
    };

    // 8. SAVE & SHARE
    document.getElementById('save-to-device').onclick = () => {
        const link = document.createElement('a');
        link.download = `Verified_${Date.now()}.jpg`;
        link.href = document.getElementById('final-document').src;
        link.click();
        document.getElementById('save-controls').style.display = 'none';
        document.getElementById('share-controls').style.display = 'flex';
    };

    document.getElementById('share-whatsapp').onclick = () => {
        const ph = localStorage.getItem('sv_recphone').replace(/\+/g,'');
        window.open(`https://wa.me/${ph}?text=Verification%20Locked%20at%20${currentTown}`);
    };

    document.getElementById('settings-gear').onclick = () => showScreen('settings-screen');
    document.getElementById('discard-btn').onclick = () => location.reload();
    document.getElementById('final-back').onclick = () => location.reload();
});
