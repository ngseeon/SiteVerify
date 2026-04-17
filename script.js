document.addEventListener('DOMContentLoaded', () => {
    let stream = null;
    const canvas = document.createElement('canvas');

    // 1. LIVE CLOCK: Forced 1-second interval
    function startClock() {
        const clockEl = document.getElementById('live-clock');
        setInterval(() => {
            const now = new Date();
            clockEl.innerText = now.toLocaleString('en-GB', { 
                day: '2-digit', month: 'long', year: 'numeric', 
                hour: '2-digit', minute: '2-digit', second: '2-digit', 
                hour12: false 
            });
        }, 1000);
    }
    startClock();

    // 2. LIVE GPS: Constant Monitor
    navigator.geolocation.watchPosition(
        (p) => {
            const gps = document.getElementById('gps-status');
            gps.innerText = "GPS : ON";
            gps.classList.remove('gps-off');
        },
        () => {
            const gps = document.getElementById('gps-status');
            gps.innerText = "GPS : OFF";
            gps.classList.add('gps-off');
        },
        { enableHighAccuracy: true }
    );

    // 3. CAPTURE BUTTON RE-WIRING
    const shutterBtn = document.getElementById('shutter-btn');
    if (shutterBtn) {
        shutterBtn.addEventListener('click', () => {
            const video = document.getElementById('video-feed');
            if (video.readyState === 4) { // Ensure video is playing
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d').drawImage(video, 0, 0);
                
                // Set the preview and move to PIN screen
                document.getElementById('pin-preview').src = canvas.toDataURL('image/jpeg');
                document.getElementById('display-pin').innerText = Math.floor(1000 + Math.random() * 9000);
                
                document.querySelectorAll('section').forEach(s => s.style.display = 'none');
                document.getElementById('pin-screen').style.display = 'flex';
                
                if (stream) {
                    stream.getTracks().forEach(t => t.stop());
                }
            }
        });
    }

    // Standard Navigation
    document.getElementById('nav-capture').onclick = async () => {
        document.querySelectorAll('section').forEach(s => s.style.display = 'none');
        document.getElementById('camera-screen').style.display = 'flex';
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        document.getElementById('video-feed').srcObject = stream;
    };

    document.getElementById('camera-back').onclick = () => {
        if (stream) stream.getTracks().forEach(t => t.stop());
        document.querySelectorAll('section').forEach(s => s.style.display = 'none');
        document.getElementById('menu-screen').style.display = 'block';
    };
});
