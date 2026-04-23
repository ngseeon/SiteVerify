document.addEventListener('DOMContentLoaded', () => {
    let liveLat = 0, liveLon = 0, sessionPIN = "", activeJobID = "";
    let stream = null, rearPhotoData = null;

    // ANCHOR: Persistent Storage Logic
    const fieldIDs = ['name', 'email', 'phone', 'rec-email', 'wa'];
    const loadData = () => {
        fieldIDs.forEach(id => {
            const val = localStorage.getItem(`sv_${id}`);
            if (val) document.getElementById(`set-${id}`).value = val;
        });
    };
    
    const saveData = () => {
        fieldIDs.forEach(id => {
            localStorage.setItem(`sv_${id}`, document.getElementById(`set-${id}`).value);
        });
        showScreen('menu-screen');
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
    };

    const showScreen = (id) => {
        document.querySelectorAll('.app-screen').forEach(s => s.style.display = 'none');
        document.getElementById(id).style.display = 'block';
        document.getElementById('app-header').style.display = (id === 'camera-screen') ? 'none' : 'block';
        if (id !== 'camera-screen') stopCamera();
    };

    // Initialization Logic
    loadData();
    document.getElementById('settings-gear').onclick = () => showScreen('settings-screen');
    document.getElementById('save-settings').onclick = saveData;
    document.getElementById('cancel-init').onclick = () => showScreen('menu-screen');

    // ANCHOR: English-Locked Geolocation
    navigator.geolocation.watchPosition(async (pos) => {
        liveLat = pos.coords.latitude; liveLon = pos.coords.longitude;
        document.getElementById('gps-status').innerText = "GPS: ON";
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${liveLat}&lon=${liveLon}&format=json&accept-language=en`);
            const data = await res.json();
            document.getElementById('location-display').innerText = `🌐 ${data.address.suburb || data.address.city || "Site Located"}`;
        } catch {
            document.getElementById('location-display').innerText = `📍 ${liveLat.toFixed(4)}, ${liveLon.toFixed(4)}`;
        }
    }, null, { enableHighAccuracy: true });

    setInterval(() => {
        document.getElementById('live-clock').innerText = new Date().toLocaleString('en-GB').replace(',', '');
    }, 1000);

    document.getElementById('nav-capture').onclick = () => {
        sessionPIN = (Math.floor(Math.random() * 90000000) + 10000000).toString();
        document.getElementById('pin-display').innerText = `Security PIN: ${sessionPIN}`;
        showScreen('input-screen');
    };

    document.getElementById('unlock-camera').onclick = () => {
        if (document.getElementById('pin-verification').value !== sessionPIN) { alert("Incorrect PIN"); return; }
        activeJobID = document.getElementById('job-id-input').value.trim() || "Null";
        showScreen('camera-screen');
        startCamera("environment");
    };

    document.getElementById('cam-back').onclick = () => showScreen('menu-screen');

    async function startCamera(facing) {
        stopCamera();
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } } 
            });
            document.getElementById('video-feed').srcObject = stream;
        } catch (err) { alert("Camera Error: " + err); }
    }

    // ANCHOR: Stable Shutter & Selfie Break
    document.getElementById('shutter').onclick = async () => {
        const video = document.getElementById('video-feed');
        const canvas = document.getElementById('capture-canvas');
        const ctx = canvas.getContext('2d');
        const isSelfie = stream.getVideoTracks()[0].getSettings().facingMode === 'user';

        if (!isSelfie) {
            canvas.width = video.videoWidth; canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            rearPhotoData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            startCamera("user");
        } else {
            document.getElementById('loading-overlay').style.display = 'block';
            
            // Draw original rear photo
            ctx.putImageData(rearPhotoData, 0, 0);
            
            // Draw selfie overlay
            const sWidth = canvas.width * 0.3;
            const sHeight = (video.videoHeight / video.videoWidth) * sWidth;
            ctx.drawImage(video, 20, canvas.height - sHeight - 20, sWidth, sHeight);
            
            // ANCHOR: KILL STREAM to break loop
            stopCamera();
            
            document.getElementById('final-document').src = canvas.toDataURL('image/jpeg', 0.8);
            document.getElementById('review-overlay').style.display = 'flex';
            document.getElementById('loading-overlay').style.display = 'none';
        }
    };

    document.getElementById('discard-btn').onclick = () => location.reload();
    showScreen('menu-screen');
});
