document.addEventListener('DOMContentLoaded', () => {
    // 1. DATA PERSISTENCE CHECK
    const fields = ['userName', 'userEmail', 'userHandphone', 'recipientEmail', 'whatsappPhone'];
    
    function loadSavedData() {
        let hasData = true;
        fields.forEach(id => {
            const saved = localStorage.getItem(id);
            if (saved) {
                document.getElementById(id).value = saved;
            } else {
                hasData = false;
            }
        });
        
        // If data exists, go straight to Menu
        if (hasData) {
            document.getElementById('settings-screen').style.display = 'none';
            document.getElementById('menu-screen').style.display = 'block';
        }
    }

    // 2. SAVE SETTINGS LOGIC
    document.getElementById('save-settings').addEventListener('click', () => {
        let allFilled = true;
        fields.forEach(id => {
            const val = document.getElementById(id).value;
            if (!val) allFilled = false;
            localStorage.setItem(id, val);
        });

        if (allFilled) {
            document.getElementById('settings-screen').style.display = 'none';
            document.getElementById('menu-screen').style.display = 'block';
        } else {
            alert("Please fill all fields before saving.");
        }
    });

    // 3. LIVE CLOCK
    function updateClock() {
        const now = new Date();
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        const dateStr = now.toLocaleDateString('en-GB', options);
        const timeStr = now.toTimeString().split(' ')[0];
        document.getElementById('live-clock').innerText = `${dateStr} ${timeStr}`;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // 4. GPS STATUS MOCK (For Phase 1 Visuals)
    function checkGPS() {
        const gpsLabel = document.getElementById('gps-status');
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                () => {
                    gpsLabel.innerText = "GPS : ON";
                    gpsLabel.className = "gps-on";
                },
                () => {
                    gpsLabel.innerText = "GPS : OFF";
                    gpsLabel.className = "gps-off";
                }
            );
        }
    }
    checkGPS();

    // 5. LOCATION NAME (Static for Phase 1 per design)
    document.getElementById('location-name').innerText = "Horizon Hills";

    loadSavedData();
});
