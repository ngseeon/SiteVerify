document.addEventListener('DOMContentLoaded', () => {
    let liveLat = 0, liveLon = 0, sessionPIN = "", activeJobID = "";
    let stream = null, rearPhotoData = null;

    // NEW: Persistent Storage Sync
    const fields = ['name', 'email', 'phone', 'rec-email', 'wa'];
    const loadSettings = () => {
        fields.forEach(f => {
            document.getElementById(`set-${f}`).value = localStorage.getItem(`sv-${f}`) || '';
        });
    };
    const saveSettings = () => {
        fields.forEach(f => {
            localStorage.setItem(`sv-${f}`, document.getElementById(`set-${f}`).value);
        });
        showScreen('menu-screen');
    };

    loadSettings();
    document.getElementById('settings-gear').onclick = () => showScreen('settings-screen');
    document.getElementById('save-settings').onclick = saveSettings;

    // ANCHOR: Location with English Lock
    navigator.geolocation.watchPosition(async (p) => {
        liveLat = p.coords.latitude; liveLon = p.coords.longitude;
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
        if (document.getElementById('pin-verification').value !== sessionPIN) { alert("Incorrect PIN"); return; }
        activeJobID = document.getElementById('job-id-input').value.trim() || "Null";
        showScreen('camera-screen');
        startCamera("environment");
    };

    async function startCamera(facing) {
        if(stream) stream.getTracks().forEach(t => t.stop());
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        document.getElementById('video-feed').srcObject = stream;
    }

    // ANCHOR: v25.1 Stable Capture Sequence
    document.getElementById('shutter').onclick = async () => {
        const video = document.getElementById('video-feed');
        const canvas = document.getElementById('capture-canvas');
        const ctx = canvas.getContext('2d');
        const mode = stream.getVideoTracks()[0].getSettings().facingMode;

        if (mode !== 'user') {
            canvas.width = video.videoWidth; canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            rearPhotoData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            startCamera("user");
        } else {
            document.getElementById('loading-overlay').style.display = 'block';
            ctx.putImageData(rearPhotoData, 0, 0);
            
            // Draw Selfie Overlay (v25.1 Math)
            const sWidth = canvas.width * 0.3;
            const sHeight = (video.videoHeight / video.videoWidth) * sWidth;
            ctx.drawImage(video, 20, canvas.height - sHeight - 20, sWidth, sHeight);
            
            // Final Bake
            document.getElementById('final-document').src = canvas.toDataURL('image/jpeg', 0.8);
            document.getElementById('review-overlay').style.display = 'flex';
            document.getElementById('loading-overlay').style.display = 'none';
        }
    };

    document.getElementById('discard-btn').onclick = () => location.reload();
    showScreen('menu-screen'); // Ensure menu shows on start
});
