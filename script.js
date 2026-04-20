document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video-feed');
    const canvas = document.getElementById('capture-canvas');
    const locDisplay = document.getElementById('location-display');
    const header = document.getElementById('app-header');
    
    let stream = null;
    let rearPhotoData = null; 
    let currentCoords = { lat: 0, lon: 0 };
    let capturedPIN = "";
    let currentTown = "Gelang Patah";

    // LOCKED SETTINGS LOGIC
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
        showScreen('menu-screen');
    };

    setInterval(() => {
        document.getElementById('live-clock').innerText = new Date().toLocaleString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' }).replace(',','');
    }, 1000);

    function initGPS() {
        navigator.geolocation.watchPosition(async (p) => {
            currentCoords = { lat: p.coords.latitude, lon: p.coords.longitude };
            document.getElementById('gps-status').innerText = "GPS: ON";
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${currentCoords.lat}&lon=${currentCoords.lon}`);
                const data = await res.json();
                const addr = data.address;
                let detected = addr.neighbourhood || addr.suburb || addr.residential || addr.town || addr.city;
                currentTown = (detected === "Iskandar Puteri") ? "Gelang Patah" : (detected || "Gelang Patah");
                locDisplay.innerText = `🌐 ${currentTown}`;
            } catch (e) { locDisplay.innerText = "🌐 Gelang Patah"; }
        }, null, { enableHighAccuracy: true });
    }
    initGPS();

    function showScreen(id) {
        document.querySelectorAll('.app-screen').forEach(s => s.style.display = 'none');
        document.getElementById(id).style.display = 'block';
        header.style.display = (id === 'camera-screen') ? 'none' : 'block';
    }

    async function startCamera(facing) {
        if(stream) stream.getTracks().forEach(t => t.stop());
        // Force 1280x720 capture for correct ratio
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } } });
        video.srcObject = stream;
    }

    document.getElementById('nav-capture').onclick = () => { showScreen('camera-screen'); startCamera("environment"); };
    document.getElementById('settings-gear').onclick = () => showScreen('settings-screen');

    document.getElementById('cam-back').onclick = () => {
        const mode = stream.getVideoTracks()[0].getSettings().facingMode;
        if (mode === 'user') { startCamera("environment"); } 
        else { location.reload(); }
    };

    // AMENDED CAPTURE LOGIC (Fixes Black Screen and Distortion)
    document.getElementById('shutter').onclick = () => {
        const mode = stream.getVideoTracks()[0].getSettings().facingMode;
        const ctx = canvas.getContext('2d');
        
        // Locked Canvas Sizing
        canvas.width = 1280; 
        canvas.height = 720;

        if (mode !== 'user') {
            ctx.drawImage(video, 0, 0, 1280, 720);
            rearPhotoData = ctx.getImageData(0, 0, 1280, 720);
            startCamera("user");
        } else {
            // Composite selfie onto rear photo before killing stream
            ctx.putImageData(rearPhotoData, 0, 0); 
            ctx.lineWidth = 6; ctx.strokeStyle = "white";
            ctx.strokeRect(40, 460, 240, 240);
            ctx.drawImage(video, 40, 460, 240, 240);
            
            // Generate Static Buffer
            const bufferUrl = canvas.toDataURL('image/jpeg', 0.9);
            document.getElementById('pin-bg-preview').src = bufferUrl;
            document.getElementById('final-document').src = bufferUrl;

            stream.getTracks().forEach(t => t.stop());
            
            const unix = Math.floor(Date.now() / 1000);
            capturedPIN = unix.toString().slice(-4);
            document.getElementById('generated-pin').innerText = capturedPIN;
            document.getElementById('pin-overlay').style.display = 'flex';
            document.getElementById('camera-controls').style.display = 'none';
        }
    };

    // AMENDED VERIFICATION (Fixes Missing QR Site Stamp)
    document.getElementById('verify-pin-btn').onclick = () => {
        if (document.getElementById('pin-input').value === capturedPIN) {
            const ctx = canvas.getContext('2d');
            const unix = Math.floor(Date.now() / 1000);
            const timeStr = document.getElementById('live-clock').innerText;
            
            // 7-Point Metadata List
            const meta = `SiteVerify\nDate/Time: ${timeStr}\nUser: ${localStorage.getItem('sv_username')}\nPhone: ${localStorage.getItem('sv_userphone')}\nLoc: ${currentTown}\nGPS: ${currentCoords.lat},${currentCoords.lon}\nUnix: ${unix}`;
            
            const qrTemp = document.getElementById('qrcode-temp');
            qrTemp.innerHTML = "";
            new QRCode(qrTemp, { text: meta, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.H });

            setTimeout(() => {
                // Stamp QR onto the composite
                ctx.drawImage(qrTemp.querySelector('img'), 1020, 460, 220, 220);
                document.getElementById('final-document').src = canvas.toDataURL('image/jpeg', 0.9);
                document.getElementById('pin-overlay').style.display = 'none';
                document.getElementById('review-overlay').style.display = 'block';
            }, 500);
        } else { alert("Wrong PIN"); }
    };

    document.getElementById('save-to-device').onclick = () => {
        const link = document.createElement('a');
        link.download = `SiteVerify_${Math.floor(Date.now()/1000)}.jpg`;
        link.href = document.getElementById('final-document').src;
        link.click();
        document.getElementById('save-controls').style.display = 'none';
        document.getElementById('share-controls').style.display = 'flex';
    };

    document.getElementById('share-whatsapp').onclick = () => {
        const msg = encodeURIComponent(`SiteVerify\nTime: ${document.getElementById('live-clock').innerText}\nUser: ${localStorage.getItem('sv_username')}\nPhone: ${localStorage.getItem('sv_userphone')}\nLoc: ${currentTown}\nGPS: ${currentCoords.lat},${currentCoords.lon}\nUnix: ${Math.floor(Date.now()/1000)}`);
        window.open(`https://wa.me/${localStorage.getItem('sv_recphone').replace(/\+/g,'')}?text=${msg}`);
    };

    document.getElementById('share-gmail').onclick = () => {
        const body = encodeURIComponent(`SiteVerify Verification Report\n\nUser: ${localStorage.getItem('sv_username')}\nPhone: ${localStorage.getItem('sv_userphone')}\nLocation: ${currentTown}\nGPS: ${currentCoords.lat}, ${currentCoords.lon}\nTime: ${document.getElementById('live-clock').innerText}\nUnix Timestamp: ${Math.floor(Date.now()/1000)}`);
        window.location.href = `mailto:${localStorage.getItem('sv_recemail')}?subject=SiteVerify Data Lock&body=${body}`;
    };

    document.getElementById('discard-btn').onclick = () => location.reload();
    document.getElementById('final-back').onclick = () => location.reload();
});
