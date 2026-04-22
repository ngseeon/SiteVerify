document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loading-overlay');
    let liveLat = 0, liveLon = 0, sessionPIN = "", activeJobID = "";
    let stream = null, rearPhotoData = null;

    // Header Amendment: System Settings icon
    document.getElementById('settings-gear').onclick = () => showScreen('settings-screen');
    document.getElementById('save-settings').onclick = () => showScreen('menu-screen');

    // Header Amendment: Location Name
    navigator.geolocation.watchPosition(async (p) => {
        liveLat = p.coords.latitude; liveLon = p.coords.longitude;
        document.getElementById('gps-status').innerText = "GPS: ON";
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${liveLat}&lon=${liveLon}&format=json`);
            const data = await res.json();
            const loc = data.address.suburb || data.address.city || data.address.road || "Site Located";
            document.getElementById('location-display').innerText = `🌐 ${loc}`;
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
        let val = document.getElementById('job-id-input').value.trim();
        activeJobID = (val === "") ? "Null" : val; 
        if (document.getElementById('pin-verification').value !== sessionPIN) { alert("Incorrect PIN"); return; }
        showScreen('camera-screen');
        startCamera("environment");
    };

    async function startCamera(facing) {
        if(stream) stream.getTracks().forEach(t => t.stop());
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } } 
        });
        document.getElementById('video-feed').srcObject = stream;
    }

    document.getElementById('shutter').onclick = () => {
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
            loader.style.display = 'block'; 
            ctx.putImageData(rearPhotoData, 0, 0); 
            
            const sWidth = canvas.width * 0.25;
            const sRatio = video.videoWidth / video.videoHeight;
            const sHeight = sWidth / sRatio;
            ctx.drawImage(video, 20, canvas.height - sHeight - 20, sWidth, sHeight);
            
            stream.getTracks().forEach(t => t.stop()); 

            const qrBox = document.getElementById('qrcode-temp');
            qrBox.innerHTML = "";
            const qrSize = Math.floor(canvas.width * 0.18);
            const masterData = `SiteVerify Job ID: ${activeJobID}\nPIN: ${sessionPIN}\nLoc: ${liveLat},${liveLon}`;
            
            new QRCode(qrBox, { text: masterData, width: qrSize, height: qrSize });

            setTimeout(() => {
                const img = qrBox.querySelector('img');
                ctx.drawImage(img, canvas.width - qrSize - 20, canvas.height - qrSize - 20, qrSize, qrSize);
                document.getElementById('final-document').src = canvas.toDataURL('image/jpeg', 0.9);
                document.getElementById('review-overlay').style.display = 'flex';
                loader.style.display = 'none';
            }, 800); 
        }
    };

    document.getElementById('save-to-device').onclick = () => {
        const a = document.createElement('a');
        a.href = document.getElementById('final-document').src;
        a.download = `SiteVerify_${activeJobID}.jpg`;
        a.click();
        
        // Gmail: Terminology Scrub
        window.location.href = `mailto:?subject=SiteVerify Job ID: ${activeJobID}&body=Attached verified data.`;
    };

    document.getElementById('discard-btn').onclick = () => location.reload();
});
