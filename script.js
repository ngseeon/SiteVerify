document.addEventListener('DOMContentLoaded', () => {
    let currentLat = 0, currentLon = 0, generatedPin = "", stream = null;
    const canvas = document.createElement('canvas');

    const showScreen = (id) => {
        document.querySelectorAll('section').forEach(s => s.style.display = 'none');
        document.getElementById(id).style.display = (id.includes('screen')) ? 'flex' : 'block';
        if (id === 'settings-screen') document.getElementById(id).style.display = 'block';
        if (id !== 'camera-screen') stopCamera();
    };

    // SYSTEM SETTINGS PERSISTENCE
    document.getElementById('settings-gear').onclick = () => showScreen('settings-screen');
    document.getElementById('save-settings').onclick = () => {
        ['userName', 'userEmail', 'userHandphone', 'recipientEmail', 'whatsappPhone'].forEach(id => {
            localStorage.setItem(id, document.getElementById(id).value);
        });
        showScreen('menu-screen');
    };

    // CAMERA LOGIC
    async function startCamera(mode) {
        if (stream) stopCamera();
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode } });
        document.getElementById('video-feed').srcObject = stream;
    }
    function stopCamera() { if (stream) stream.getTracks().forEach(t => t.stop()); }

    document.getElementById('nav-capture').onclick = () => { showScreen('camera-screen'); startCamera('environment'); };
    document.getElementById('camera-back').onclick = () => showScreen('menu-screen');

    document.getElementById('shutter-btn').onclick = async () => {
        const video = document.getElementById('video-feed');
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        stopCamera();
        await startCamera('user'); // Selfie switch
        setTimeout(() => {
            ctx.drawImage(video, 20, canvas.height - 220, 300, 200); // Overlay selfie
            generatedPin = Math.floor(1000 + Math.random() * 9000).toString(); // PIN Logic
            document.getElementById('display-pin').innerText = generatedPin;
            document.getElementById('pin-preview').src = canvas.toDataURL('image/jpeg');
            showScreen('pin-screen');
        }, 500);
    };

    // PIN VERIFICATION
    document.getElementById('pin-input').oninput = (e) => {
        if (e.target.value === generatedPin) {
            document.getElementById('confirm-preview').src = canvas.toDataURL('image/jpeg');
            showScreen('confirm-screen');
            e.target.value = "";
        }
    };

    document.getElementById('verify-gen-btn').onclick = async () => {
        const qrText = `User: ${localStorage.getItem('userName')} | GPS: ${currentLat},${currentLon}`;
        const qrCanvas = document.createElement('canvas');
        await QRCode.toCanvas(qrCanvas, qrText, { width: 150 });
        canvas.getContext('2d').drawImage(qrCanvas, canvas.width - 170, canvas.height - 170);
        document.getElementById('final-preview').src = canvas.toDataURL('image/jpeg');
        showScreen('save-screen');
    };

    document.getElementById('save-device').onclick = () => {
        const link = document.createElement('a');
        link.download = 'siteverify_logo.png';
        link.href = document.getElementById('final-preview').src;
        link.click();
        showScreen('menu-screen');
    };

    // LIVE SERVICES
    setInterval(() => {
        document.getElementById('live-clock').innerText = new Date().toLocaleString('en-GB');
    }, 1000);

    navigator.geolocation.watchPosition(p => {
        currentLat = p.coords.latitude; currentLon = p.coords.longitude;
        document.getElementById('gps-status').className = 'gps-on';
        document.getElementById('gps-status').innerText = 'GPS : ON';
    }, () => {
        document.getElementById('gps-status').className = 'gps-off';
        document.getElementById('gps-status').innerText = 'GPS : OFF';
    });
});
