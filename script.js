document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('app-header');
    const locDisplay = document.getElementById('location-display');
    const liveClockText = document.getElementById('live-clock');
    const video = document.getElementById('video-feed');
    const canvas = document.getElementById('capture-canvas');
    const finalPreview = document.getElementById('final-preview');
    
    let stream = null;
    let currentCoords = { lat: 0, lon: 0 };
    let capturedPIN = "";

    // 1. NAVIGATION CONTROL (STRICT ISOLATION)
    function showScreen(id) {
        document.querySelectorAll('.app-screen').forEach(s => s.style.display = 'none');
        document.getElementById(id).style.display = 'block';
        header.style.display = (id === 'camera-screen') ? 'none' : 'block';
    }

    // 2. LIVE CLOCK & GPS
    setInterval(() => {
        const now = new Date();
        liveClockText.innerText = now.toLocaleString('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        }).replace(',', '');
    }, 1000);

    function initGPS() {
        navigator.geolocation.getCurrentPosition((p) => {
            currentCoords = { lat: p.coords.latitude, lon: p.coords.longitude };
            document.getElementById('gps-status').innerText = "GPS: ON";
            document.getElementById('gps-status').style.color = "black";
            // Mocking town name for Phase 2 focus
            locDisplay.innerText = "🌐 Gelang Patah";
        }, () => {
            document.getElementById('gps-status').innerText = "GPS: OFF";
            document.getElementById('gps-status').style.color = "red";
        }, { enableHighAccuracy: true });
    }
    initGPS();

    // 3. CAPTURE LOGIC (Double-Snap)
    document.getElementById('nav-capture').onclick = async () => {
        if (document.getElementById('gps-status').innerText === "GPS: OFF") {
            alert("Please turn on GPS and refresh.");
            return;
        }
        showScreen('camera-screen');
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = stream;
    };

    document.getElementById('shutter').onclick = async () => {
        const ctx = canvas.getContext('2d');
        canvas.width = 1280; canvas.height = 720;
        ctx.drawImage(video, 0, 0, 1280, 720); // Rear Snap

        // Instant Flip to Front
        stream.getTracks().forEach(t => t.stop());
        const frontStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        video.srcObject = frontStream;

        setTimeout(() => {
            ctx.drawImage(video, 20, 500, 200, 200); // Overlay Selfie
            frontStream.getTracks().forEach(t => t.stop());
            
            // Calculate 4-digit PIN (Sum of decimals)
            const latD = currentCoords.lat.toString().split('.')[1] || "0";
            const lonD = currentCoords.lon.toString().split('.')[1] || "0";
            capturedPIN = (latD + lonD).split('').reduce((a, b) => parseInt(a) + parseInt(b), 0).toString().padStart(4, '0').substring(0,4);
            
            document.getElementById('generated-pin').innerText = capturedPIN;
            document.getElementById('pin-overlay').style.display = 'flex';
            document.getElementById('camera-controls').style.display = 'none';
        }, 500);
    };

    // 4. PIN & STAMP
    document.getElementById('verify-pin-btn').onclick = () => {
        if (document.getElementById('pin-input').value === capturedPIN) {
            const ctx = canvas.getContext('2d');
            const stamp = `User: ${document.getElementById('set-username').value}\nLoc: Gelang Patah\n${currentCoords.lat}, ${currentCoords.lon}\n${liveClockText.innerText}`;
            
            const qrDiv = document.getElementById('qrcode');
            qrDiv.innerHTML = "";
            new QRCode(qrDiv, { text: stamp, width: 150, height: 150 });

            setTimeout(() => {
                ctx.drawImage(qrDiv.querySelector('img'), 1100, 540, 150, 150);
                finalPreview.src = canvas.toDataURL('image/jpeg');
                document.getElementById('pin-overlay').style.display = 'none';
                document.getElementById('review-overlay').style.display = 'flex';
            }, 300);
        } else { alert("Wrong PIN"); }
    };

    // 5. SHARING
    document.getElementById('save-to-device').onclick = () => {
        const link = document.createElement('a');
        link.download = `SiteVerify_${Date.now()}.jpg`;
        link.href = finalPreview.src;
        link.click();
        document.getElementById('save-controls').style.display = 'none';
        document.getElementById('share-controls').style.display = 'flex';
    };

    document.getElementById('share-whatsapp').onclick = () => {
        const phone = document.getElementById('set-recphone').value.replace(/\+/g, '');
        window.open(`https://wa.me/${phone}?text=Site%20Verified%20at%20Gelang%20Patah`);
        location.reload();
    };

    document.getElementById('share-gmail').onclick = () => {
        window.location.href = `mailto:${document.getElementById('set-recemail').value}?subject=SiteVerify%20Report`;
        location.reload();
    };

    // UI Navigation
    document.getElementById('settings-gear').onclick = () => showScreen('settings-screen');
    document.getElementById('save-settings').onclick = () => showScreen('menu-screen');
    document.getElementById('discard-btn').onclick = () => location.reload();
    document.getElementById('cam-back').onclick = () => location.reload();
    document.getElementById('final-back').onclick = () => location.reload();
});
