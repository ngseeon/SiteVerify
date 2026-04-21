document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const pinDisplay = document.getElementById('pin-display');
    const locDisplay = document.getElementById('location-display');
    const clockDisplay = document.getElementById('live-clock');
    
    // Live Background GPS Variables
    let liveLat = 0, liveLon = 0;
    let liveTown = "Detecting...";

    // THE AUDIT SNAPSHOT (LOCKED FOR THE SESSION)
    let sessionLat = 0;
    let sessionLon = 0;
    let sessionPIN = "";
    
    let stream = null;
    let rearPhotoData = null;
    let activeJobID = "";

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

    // TRIGGER SNAPSHOT ON MENU BUTTON CLICK
    document.getElementById('nav-capture').onclick = () => {
        if (liveLat === 0) {
            alert("Waiting for GPS lock. Please try again in a few seconds.");
            return;
        }
        // Take the absolute snapshot for the audit trail
        sessionLat = liveLat;
        sessionLon = liveLon;
        sessionPIN = calculatePIN(sessionLat, sessionLon);
        
        pinDisplay.innerText = `Security PIN: ${sessionPIN}`;
        showScreen('input-screen');
    };

    document.getElementById('settings-gear').onclick = () => showScreen('settings-screen');
    document.getElementById('cancel-input').onclick = () => {
        sessionPIN = ""; // Clear snapshot on cancel
        showScreen('menu-screen');
    };
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

    // BACKGROUND GPS WATCHER
    function initGPS() {
        if (!navigator.geolocation) return;
        navigator.geolocation.watchPosition(async (p) => {
            liveLat = p.coords.latitude;
            liveLon = p.coords.longitude;
            document.getElementById('gps-status').innerText = "GPS: ON";
            
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${liveLat}&lon=${liveLon}`);
                const data = await res.json();
                liveTown = data.address.neighbourhood || data.address.suburb || data.address.town || data.address.city || "Gelang Patah";
                locDisplay.innerText = `🌐 ${liveTown}`;
            } catch (e) { locDisplay.innerText = `🌐 ${liveTown}`; }
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
                video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } } 
            });
            document.getElementById('video-feed').srcObject = stream;
        } catch (err) { alert("Camera Access Required."); }
    }

    document.getElementById('unlock-camera').onclick = () => {
        const idVal = document.getElementById('job-id-input').value.trim();
        const pinVal = document.getElementById('pin-verification').value;
        
        // Strictly compare typed PIN with the Snapshot PIN
        if (idVal && pinVal === sessionPIN) {
            activeJobID = idVal;
            showScreen('camera-screen');
            startCamera("environment");
        } else {
            alert("Verification Failed. PIN must match exactly.");
        }
    };

    document.getElementById('shutter').onclick = () => {
        const video = document.getElementById('video-feed');
        const canvas = document.getElementById('capture-canvas');
        const mode = stream.getVideoTracks()[0].getSettings().facingMode;
        const ctx = canvas.getContext('2d');
        canvas.width = 1280; canvas.height = 720;

        if (mode !== 'user') {
            ctx.drawImage(video, 0, 0, 1280, 720);
            rearPhotoData = ctx.getImageData(0, 0, 1280, 720);
            startCamera("user");
        } else {
            // Composite Image
            ctx.putImageData(rearPhotoData, 0, 0); 
            ctx.lineWidth = 6; ctx.strokeStyle = "white";
            ctx.strokeRect(40, 440, 260, 260);
            ctx.drawImage(video, 40, 440, 260, 260);
            
            // Metadata uses SESSION SNAPSHOT for 100% Audit Consistency
            const meta = `SiteVerify\nJob: ${activeJobID}\nPIN: ${sessionPIN}\nTime: ${clockDisplay.innerText}\nUser: ${localStorage.getItem('sv_username')}\nLoc: ${liveTown}\nGPS: ${sessionLat},${sessionLon}`;
            
            const qrTemp = document.getElementById('qrcode-temp');
            qrTemp.innerHTML = "";
            new QRCode(qrTemp, { text: meta, width: 220, height: 220 });

            setTimeout(() => {
                const qrImg = qrTemp.querySelector('img');
                if (qrImg) ctx.drawImage(qrImg, 1020, 440, 220, 220);
                document.getElementById('final-document').src = canvas.toDataURL('image/jpeg', 0.95);
                stream.getTracks().forEach(t => t.stop());
                document.getElementById('review-overlay').style.display = 'flex';
                document.getElementById('camera-controls').style.display = 'none';
            }, 600);
        }
    };

    document.getElementById('save-to-device').onclick = () => {
        const link = document.createElement('a');
        link.download = `SiteVerify_${activeJobID}.jpg`;
        link.href = document.getElementById('final-document').src;
        link.click();
        document.getElementById('save-controls').style.display = 'none';
        document.getElementById('share-controls').style.display = 'flex';
    };

    document.getElementById('share-whatsapp').onclick = () => {
        const msg = encodeURIComponent(`SiteVerify Lock\nJob ID: ${activeJobID}\nPIN: ${sessionPIN}\nTime: ${clockDisplay.innerText}\nGPS: ${sessionLat},${sessionLon}`);
        window.open(`https://wa.me/${(localStorage.getItem('sv_recphone')||'').replace(/\+/g,'')}?text=${msg}`);
    };

    document.getElementById('share-gmail').onclick = () => {
        const body = encodeURIComponent(`Job ID: ${activeJobID}\nPIN: ${sessionPIN}\nTime: ${clockDisplay.innerText}\nGPS: ${sessionLat},${sessionLon}`);
        window.location.href = `mailto:${localStorage.getItem('sv_recemail')}?subject=SiteVerify: ${activeJobID}&body=${body}`;
    };

    document.getElementById('discard-btn').onclick = () => location.reload();
    document.getElementById('final-back').onclick = () => location.reload();
});
