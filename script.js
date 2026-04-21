document.addEventListener('DOMContentLoaded', () => {
    const pinDisplay = document.getElementById('pin-display');
    const locDisplay = document.getElementById('location-display');
    const clockDisplay = document.getElementById('live-clock');
    
    let liveLat = 0, liveLon = 0, liveTown = "Detecting...";
    let sessionLat = 0, sessionLon = 0, sessionPIN = "", sessionUnix = 0, sessionDate = "", sessionTime = "";
    let masterAuditBody = ""; 

    let stream = null, rearPhotoData = null, activeJobID = "";

    function calculatePIN(lat, lon) {
        const latDec = lat.toString().split('.')[1] || "0";
        const lonDec = lon.toString().split('.')[1] || "0";
        return (parseInt(latDec) + parseInt(lonDec)).toString();
    }

    const showScreen = (id) => {
        document.querySelectorAll('.app-screen').forEach(s => s.style.display = 'none');
        document.getElementById(id).style.display = 'block';
        document.getElementById('app-header').style.display = (id === 'camera-screen') ? 'none' : 'block';
    };

    document.getElementById('nav-capture').onclick = () => {
        if (liveLat === 0) { alert("GPS Pending. Please wait."); return; }
        sessionLat = liveLat; sessionLon = liveLon;
        sessionPIN = calculatePIN(sessionLat, sessionLon);
        pinDisplay.innerText = `Security PIN: ${sessionPIN}`;
        showScreen('input-screen');
    };

    document.getElementById('settings-gear').onclick = () => showScreen('settings-screen');
    document.getElementById('cancel-input').onclick = () => showScreen('menu-screen');
    document.getElementById('cam-back').onclick = () => location.reload();

    const loadSettings = () => {
        ['username', 'useremail', 'userphone', 'recemail', 'recphone'].forEach(f => {
            const val = localStorage.getItem(`sv_${f}`);
            if (val) document.getElementById(`set-${f}`).value = val;
        });
    };
    loadSettings();

    document.getElementById('save-settings').onclick = () => {
        ['username', 'useremail', 'userphone', 'recemail', 'recphone'].forEach(f => {
            localStorage.setItem(`sv_${f}`, document.getElementById(`set-${f}`).value);
        });
        showScreen('menu-screen');
    };

    function initGPS() {
        if (!navigator.geolocation) return;
        navigator.geolocation.watchPosition(async (p) => {
            liveLat = p.coords.latitude; liveLon = p.coords.longitude;
            document.getElementById('gps-status').innerText = "GPS: ON";
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${liveLat}&lon=${liveLon}`);
                const data = await res.json();
                liveTown = data.address.neighbourhood || data.address.suburb || data.address.town || data.address.city || "Site Location";
                locDisplay.innerText = `🌐 ${liveTown}`;
            } catch (e) { locDisplay.innerText = "🌐 Iskandar Puteri"; }
        }, null, { enableHighAccuracy: true });
    }
    initGPS();

    setInterval(() => {
        clockDisplay.innerText = new Date().toLocaleString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' }).replace(',','');
    }, 1000);

    async function startCamera(facing) {
        if(stream) stream.getTracks().forEach(t => t.stop());
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } } 
            });
            document.getElementById('video-feed').srcObject = stream;
        } catch (err) { alert("Camera Access Error."); }
    }

    document.getElementById('unlock-camera').onclick = () => {
        const idVal = document.getElementById('job-id-input').value.trim();
        const pinVal = document.getElementById('pin-verification').value;
        if (idVal && pinVal === sessionPIN) {
            activeJobID = idVal;
            sessionUnix = Date.now();
            const now = new Date();
            sessionDate = now.toLocaleDateString('en-GB');
            sessionTime = now.toLocaleTimeString('en-GB');
            
            // CONSTRUCT UNIFIED MASTER AUDIT STRING
            masterAuditBody = `SiteVerify Job ID: ${activeJobID}\n` +
                              `Name: ${localStorage.getItem('sv_username') || 'N/A'}\n` +
                              `Phone number: ${localStorage.getItem('sv_userphone') || 'N/A'}\n` +
                              `PIN: ${sessionPIN}\n` +
                              `Date: ${sessionDate}\n` +
                              `Time: ${sessionTime}\n` +
                              `Unix Timestamp: ${sessionUnix}\n` +
                              `Latitude: ${sessionLat}\n` +
                              `Longitude: ${sessionLon}`;
            
            showScreen('camera-screen');
            startCamera("environment");
        } else { alert("Verification Failed."); }
    };

    document.getElementById('shutter').onclick = () => {
        const video = document.getElementById('video-feed');
        const canvas = document.getElementById('capture-canvas');
        const mode = stream.getVideoTracks()[0].getSettings().facingMode;
        const ctx = canvas.getContext('2d');

        if (mode !== 'user') {
            // LOCK RATIO TO CAMERA NATURAL SIZE
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            rearPhotoData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            startCamera("user");
        } else {
            // BAKE FINAL DOCUMENT
            ctx.putImageData(rearPhotoData, 0, 0); 
            const sSize = Math.floor(canvas.width * 0.22);
            ctx.lineWidth = 5; ctx.strokeStyle = "white";
            ctx.strokeRect(20, canvas.height - sSize - 20, sSize, sSize);
            ctx.drawImage(video, 20, canvas.height - sSize - 20, sSize, sSize);
            
            const qrTemp = document.getElementById('qrcode-temp');
            qrTemp.innerHTML = "";
            const qrSize = Math.floor(canvas.width * 0.18);
            new QRCode(qrTemp, { text: masterAuditBody, width: qrSize, height: qrSize, correctLevel: QRCode.CorrectLevel.L });

            // Wait specifically for QR to render then finish canvas
            setTimeout(() => {
                const qrImg = qrTemp.querySelector('img');
                if (qrImg) ctx.drawImage(qrImg, canvas.width - qrSize - 20, canvas.height - qrSize - 20, qrSize, qrSize);
                document.getElementById('final-document').src = canvas.toDataURL('image/jpeg', 0.9);
                stream.getTracks().forEach(t => t.stop());
                document.getElementById('review-overlay').style.display = 'flex';
                document.getElementById('camera-controls').style.display = 'none';
            }, 300);
        }
    };

    document.getElementById('save-to-device').onclick = () => {
        const link = document.createElement('a');
        link.download = `SiteVerify_${activeJobID}_${sessionUnix}.jpg`;
        link.href = document.getElementById('final-document').src;
        link.click();
        document.getElementById('save-controls').style.display = 'none';
        document.getElementById('share-controls').style.display = 'flex';
    };

    document.getElementById('share-whatsapp').onclick = () => {
        window.open(`https://wa.me/${(localStorage.getItem('sv_recphone')||'').replace(/\+/g,'')}?text=${encodeURIComponent(masterAuditBody)}`);
    };

    document.getElementById('share-gmail').onclick = () => {
        window.location.href = `mailto:${localStorage.getItem('sv_recemail')}?subject=Audit: ${activeJobID}&body=${encodeURIComponent(masterAuditBody)}`;
    };

    document.getElementById('discard-btn').onclick = () => location.reload();
    document.getElementById('final-back').onclick = () => location.reload();
});
