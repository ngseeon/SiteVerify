document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video-feed');
    const canvas = document.getElementById('capture-canvas');
    const locDisplay = document.getElementById('location-display');
    const pinDisplay = document.getElementById('pin-display');
    
    let stream = null;
    let rearPhotoData = null; 
    let currentCoords = { lat: 0, lon: 0 };
    let currentTown = "Gelang Patah";
    let locationPIN = "";
    let activeJobID = "";

    // PIN LOGIC: Sum of decimals from Lat and Lon
    function calculatePIN(lat, lon) {
        const latStr = lat.toString().split('.')[1] || "0";
        const lonStr = lon.toString().split('.')[1] || "0";
        return (parseInt(latStr) + parseInt(lonStr)).toString();
    }

    const showScreen = (id) => {
        document.querySelectorAll('.app-screen').forEach(s => s.style.display = 'none');
        const target = document.getElementById(id);
        if (target) target.style.display = 'block';
        document.getElementById('app-header').style.display = (id === 'camera-screen') ? 'none' : 'block';
    };

    // BUTTON LISTENERS (Moved to top for stability)
    document.getElementById('nav-capture').onclick = () => showScreen('input-screen');
    document.getElementById('settings-gear').onclick = () => showScreen('settings-screen');
    document.getElementById('cancel-input').onclick = () => showScreen('menu-screen');
    document.getElementById('back-settings').onclick = () => showScreen('menu-screen');
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

    setInterval(() => {
        document.getElementById('live-clock').innerText = new Date().toLocaleString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' }).replace(',','');
    }, 1000);

    function initGPS() {
        if (!navigator.geolocation) {
            document.getElementById('gps-status').innerText = "GPS: NOT SUPPORTED";
            return;
        }
        
        navigator.geolocation.watchPosition(async (p) => {
            currentCoords = { lat: p.coords.latitude, lon: p.coords.longitude };
            document.getElementById('gps-status').innerText = "GPS: ON";
            
            const newPIN = calculatePIN(currentCoords.lat, currentCoords.lon);
            if(newPIN !== locationPIN) {
                locationPIN = newPIN;
                pinDisplay.innerText = `Security PIN: ${locationPIN}`;
            }

            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${currentCoords.lat}&lon=${currentCoords.lon}`);
                const data = await res.json();
                currentTown = data.address.neighbourhood || data.address.suburb || data.address.town || data.address.city || "Gelang Patah";
                locDisplay.innerText = `🌐 ${currentTown}`;
            } catch (e) { locDisplay.innerText = "🌐 Gelang Patah"; }
        }, (err) => {
            document.getElementById('gps-status').innerText = "GPS: ERROR";
        }, { enableHighAccuracy: true });
    }
    initGPS();

    async function startCamera(facing) {
        try {
            if(stream) stream.getTracks().forEach(t => t.stop());
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: 1280, height: 720 } });
            video.srcObject = stream;
        } catch (err) { alert("Camera Error: " + err.message); }
    }

    document.getElementById('unlock-camera').onclick = () => {
        const jobId = document.getElementById('job-id-input').value.trim();
        const pinVerify = document.getElementById('pin-verification').value;
        if (jobId && pinVerify === locationPIN) {
            activeJobID = jobId;
            showScreen('camera-screen');
            startCamera("environment");
        } else { alert("Correct Job ID and PIN Required."); }
    };

    document.getElementById('shutter').onclick = () => {
        const tracks = stream.getVideoTracks();
        if (tracks.length === 0) return;
        
        const mode = tracks[0].getSettings().facingMode;
        const ctx = canvas.getContext('2d');
        canvas.width = 1280; canvas.height = 720;

        if (mode !== 'user') {
            ctx.drawImage(video, 0, 0, 1280, 720);
            rearPhotoData = ctx.getImageData(0, 0, 1280, 720);
            startCamera("user");
        } else {
            ctx.putImageData(rearPhotoData, 0, 0); 
            ctx.lineWidth = 6; ctx.strokeStyle = "white";
            ctx.strokeRect(40, 440, 260, 260);
            ctx.drawImage(video, 40, 440, 260, 260);
            
            const timeStr = document.getElementById('live-clock').innerText;
            const meta = `SiteVerify\nJob: ${activeJobID}\nPIN: ${locationPIN}\nTime: ${timeStr}\nUser: ${localStorage.getItem('sv_username')}\nLoc: ${currentTown}\nGPS: ${currentCoords.lat},${currentCoords.lon}`;
            
            const qrTemp = document.getElementById('qrcode-temp');
            qrTemp.innerHTML = "";
            new QRCode(qrTemp, { text: meta, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.H });

            setTimeout(() => {
                const qrImg = qrTemp.querySelector('img');
                if (qrImg) ctx.drawImage(qrImg, 1020, 440, 220, 220);
                document.getElementById('final-document').src = canvas.toDataURL('image/jpeg', 0.95);
                if(stream) stream.getTracks().forEach(t => t.stop());
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
        const msg = encodeURIComponent(`SiteVerify Lock\nJob ID: ${activeJobID}\nPIN: ${locationPIN}\nTime: ${document.getElementById('live-clock').innerText}\nGPS: ${currentCoords.lat},${currentCoords.lon}`);
        window.open(`https://wa.me/${localStorage.getItem('sv_recphone').replace(/\+/g,'')}?text=${msg}`);
    };

    document.getElementById('share-gmail').onclick = () => {
        const body = encodeURIComponent(`Job ID: ${activeJobID}\nPIN: ${locationPIN}\nTime: ${document.getElementById('live-clock').innerText}\nGPS: ${currentCoords.lat},${currentCoords.lon}`);
        window.location.href = `mailto:${localStorage.getItem('sv_recemail')}?subject=SiteVerify: ${activeJobID}&body=${body}`;
    };

    document.getElementById('discard-btn').onclick = () => location.reload();
    document.getElementById('final-back').onclick = () => location.reload();
});
