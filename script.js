document.addEventListener('DOMContentLoaded', () => {
    const fields = ['userName', 'userEmail', 'userHandphone', 'recipientEmail', 'whatsappPhone'];
    let currentLat = 0, currentLon = 0, generatedPin = "", stream = null;

    const showScreen = (id) => {
        document.querySelectorAll('section').forEach(s => s.style.display = 'none');
        document.getElementById(id).style.display = (id === 'menu-screen' || id === 'settings-screen') ? 'block' : 'flex';
        // Header visibility logic
        document.getElementById('main-header').style.display = (['menu-screen', 'settings-screen'].includes(id)) ? 'block' : 'none';
        if (id !== 'camera-screen') stopCamera();
    };

    // Camera Logic
    async function startCamera(mode) {
        if (stream) stopCamera();
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode, width: 1280, height: 720 } });
        document.getElementById('video-feed').srcObject = stream;
    }

    function stopCamera() {
        if (stream) stream.getTracks().forEach(t => t.stop());
    }

    // Capture Logic
    document.getElementById('nav-capture').addEventListener('click', () => { showScreen('camera-screen'); startCamera('environment'); });
    document.getElementById('camera-back').addEventListener('click', () => showScreen('menu-screen'));

    document.getElementById('shutter-btn').addEventListener('click', async () => {
        const video = document.getElementById('video-feed');
        const canvas = document.getElementById('capture-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        
        // 1. Rear Snap
        ctx.drawImage(video, 0, 0);
        
        // 2. Front Snap Flip (<0.5s)
        stopCamera();
        await startCamera('user');
        setTimeout(() => {
            const sWidth = canvas.width * 0.3;
            const sHeight = (video.videoHeight / video.videoWidth) * sWidth;
            ctx.drawImage(video, 20, canvas.height - sHeight - 20, sWidth, sHeight);
            
            // Calculate PIN from GPS
            const latF = currentLat.toString().split('.')[1] || "0";
            const lonF = currentLon.toString().split('.')[1] || "0";
            generatedPin = (latF + lonF).split('').reduce((a,b) => parseInt(a) + parseInt(b), 0).toString().slice(-4).padStart(4, '0');
            
            document.getElementById('display-pin').innerText = generatedPin;
            document.getElementById('verify-preview').src = canvas.toDataURL('image/jpeg');
            showScreen('pin-screen');
        }, 400);
    });

    document.getElementById('verify-pin-btn').addEventListener('click', async () => {
        if (document.getElementById('pin-input').value === generatedPin) {
            const canvas = document.getElementById('capture-canvas');
            const ctx = canvas.getContext('2d');
            const qrText = `User: ${localStorage.getItem('userName')}\nGPS: ${currentLat},${currentLon}\nTime: ${new Date().toISOString()}`;
            
            const qrCanvas = document.createElement('canvas');
            await QRCode.toCanvas(qrCanvas, qrText, { width: canvas.width * 0.2 });
            ctx.drawImage(qrCanvas, canvas.width - qrCanvas.width - 20, canvas.height - qrCanvas.height - 20);
            
            document.getElementById('final-image-preview').src = canvas.toDataURL('image/jpeg');
            showScreen('preview-screen');
        } else {
            alert("PIN mismatch.");
        }
    });

    document.getElementById('save-to-device').addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = document.getElementById('final-image-preview').src;
        a.download = `SiteVerify_${Date.now()}.jpg`;
        a.click();
        showScreen('menu-screen');
    });

    // Phase 1 Foundations (Init)
    function init() {
        fields.forEach(f => { if(localStorage.getItem(f)) document.getElementById(f).value = localStorage.getItem(f); });
        if(localStorage.getItem('userName')) showScreen('menu-screen');
        
        navigator.geolocation.watchPosition(p => {
            currentLat = p.coords.latitude; currentLon = p.coords.longitude;
            document.getElementById('gps-status').className = "gps-on";
            document.getElementById('gps-status').innerText = "GPS : ON";
        }, () => {
            document.getElementById('gps-status').className = "gps-off";
            document.getElementById('gps-status').innerText = "GPS : OFF";
        });
    }

    document.getElementById('save-settings').addEventListener('click', () => {
        fields.forEach(f => localStorage.setItem(f, document.getElementById(f).value));
        showScreen('menu-screen');
    });

    init();
});
