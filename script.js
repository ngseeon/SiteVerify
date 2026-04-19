document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const header = document.getElementById('app-header');
    const gpsStatusText = document.getElementById('gps-status');
    const locDisplay = document.getElementById('location-display');
    const liveClockText = document.getElementById('live-clock');
    const video = document.getElementById('video-feed');
    const canvas = document.getElementById('capture-canvas');
    const finalPreview = document.getElementById('final-preview');
    
    let stream = null;
    let currentCoords = { lat: 0, lon: 0 };
    let capturedPIN = "";

    // 1. LIVE CLOCK
    setInterval(() => {
        const now = new Date();
        liveClockText.innerText = now.toLocaleString('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        }).replace(',', '');
    }, 1000);

    // 2. REFINED LOCATION & PIN LOGIC
    function calculatePIN(lat, lon) {
        const latStr = lat.toString().split('.')[1] || "0";
        const lonStr = lon.toString().split('.')[1] || "0";
        const total = (latStr + lonStr).split('').reduce((a, b) => parseInt(a) + parseInt(b), 0);
        return total.toString().padStart(4, '0').substring(0, 4);
    }

    async function updateTownOnly(lat, lon) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
            const data = await response.json();
            const town = data.address.village || data.address.town || data.address.suburb || "Gelang Patah";
            locDisplay.innerText = `🌐 ${town}`;
        } catch (e) { locDisplay.innerText = "🌐 Gelang Patah"; }
    }

    function initGPS() {
        navigator.geolocation.getCurrentPosition((p) => {
            currentCoords = { lat: p.coords.latitude, lon: p.coords.longitude };
            gpsStatusText.innerText = "GPS: ON";
            gpsStatusText.style.color = "black";
            updateTownOnly(p.coords.latitude, p.coords.longitude);
        }, () => {
            gpsStatusText.innerText = "GPS: OFF";
            gpsStatusText.style.color = "red";
        }, { enableHighAccuracy: true });
    }
    initGPS();

    // 3. PHASE 2 CAPTURE ENGINE
    document.getElementById('nav-capture').onclick = async () => {
        if (gpsStatusText.innerText === "GPS: OFF") {
            alert("Please turn on GPS to proceed.");
            return;
        }
        document.getElementById('camera-screen').style.display = 'block';
        header.style.display = 'none';
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = stream;
    };

    document.getElementById('shutter').onclick = async () => {
        const ctx = canvas.getContext('2d');
        canvas.width = 1280; canvas.height = 720; // 16:9

        // 1. Primary Snap (Rear)
        ctx.drawImage(video, 0, 0, 1280, 720);
        
        // 2. Instant Flip to Front (Selfie)
        stream.getTracks().forEach(t => t.stop());
        const frontStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        video.srcObject = frontStream;

        setTimeout(() => {
            // Draw Selfie at Bottom Left
            ctx.strokeStyle = "white"; ctx.lineWidth = 5;
            ctx.strokeRect(20, 500, 200, 200);
            ctx.drawImage(video, 20, 500, 200, 200);
            
            frontStream.getTracks().forEach(t => t.stop());
            
            // Show PIN Verification
            capturedPIN = calculatePIN(currentCoords.lat, currentCoords.lon);
            document.getElementById('generated-pin').innerText = capturedPIN;
            document.getElementById('pin-overlay').style.display = 'flex';
            document.getElementById('camera-controls').style.display = 'none';
        }, 500);
    };

    // 4. PIN VERIFICATION & QR STAMP
    document.getElementById('verify-pin-btn').onclick = () => {
        if (document.getElementById('pin-input').value === capturedPIN) {
            applySiteStamp();
            document.getElementById('pin-overlay').style.display = 'none';
            document.getElementById('review-overlay').style.display = 'flex';
        } else {
            alert("Incorrect PIN.");
        }
    };

    function applySiteStamp() {
        const ctx = canvas.getContext('2d');
        const town = locDisplay.innerText.replace('🌐 ', '');
        const stampText = `User: ${document.getElementById('set-username').value}\nLoc: ${town}\nCoord: ${currentCoords.lat.toFixed(4)}, ${currentCoords.lon.toFixed(4)}\nTime: ${liveClockText.innerText}`;

        // Generate QR
        const qrDiv = document.getElementById('qrcode');
        qrDiv.innerHTML = "";
        new QRCode(qrDiv, { text: stampText, width: 150, height: 150 });

        setTimeout(() => {
            const qrImg = qrDiv.querySelector('img');
            ctx.drawImage(qrImg, 1100, 540, 150, 150); // Bottom Right
            finalPreview.src = canvas.toDataURL('image/jpeg');
        }, 300);
    }

    // 5. SHARING & FINALIZATION
    document.getElementById('save-to-device').onclick = () => {
        document.getElementById('save-controls').style.display = 'none';
        document.getElementById('share-controls').style.display = 'flex';
        const link = document.createElement('a');
        link.download = `SiteVerify_${Date.now()}.jpg`;
        link.href = finalPreview.src;
        link.click();
    };

    document.getElementById('share-whatsapp').onclick = () => {
        const phone = document.getElementById('set-recphone').value;
        const msg = encodeURIComponent(`Site Verified! At: ${locDisplay.innerText} on ${liveClockText.innerText}`);
        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${msg}`);
        location.reload();
    };

    document.getElementById('share-gmail').onclick = () => {
        const email = document.getElementById('set-recemail').value;
        const subject = encodeURIComponent("Site Verification Capture");
        window.location.href = `mailto:${email}?subject=${subject}`;
        location.reload();
    };

    document.getElementById('discard-btn').onclick = () => location.reload();
    document.getElementById('cam-back').onclick = () => location.reload();
    document.getElementById('final-back').onclick = () => location.reload();
    document.getElementById('settings-gear').onclick = () => document.getElementById('settings-screen').style.display = 'block';
    document.getElementById('save-settings').onclick = () => document.getElementById('settings-screen').style.display = 'none';
});
