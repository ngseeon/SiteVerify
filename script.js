document.addEventListener('DOMContentLoaded', () => {
    const fields = ['userName', 'userEmail', 'userHandphone', 'recipientEmail', 'whatsappPhone'];
    const settingsScreen = document.getElementById('settings-screen');
    const menuScreen = document.getElementById('menu-screen');
    const gearIcon = document.getElementById('settings-gear');

    // 1. DATA PERSISTENCE
    function loadData() {
        let completed = true;
        fields.forEach(id => {
            const val = localStorage.getItem(id);
            if (val) {
                document.getElementById(id).value = val;
            } else {
                completed = false;
            }
        });
        if (completed) toggleScreen(false);
    }

    function toggleScreen(showSettings) {
        settingsScreen.style.display = showSettings ? 'block' : 'none';
        menuScreen.style.display = showSettings ? 'none' : 'block';
    }

    // 2. GEAR ICON LOGIC (Unlock Settings)
    gearIcon.addEventListener('click', () => toggleScreen(true));

    // 3. SAVE LOGIC
    document.getElementById('save-settings').addEventListener('click', () => {
        let allValid = true;
        fields.forEach(id => {
            const val = document.getElementById(id).value;
            if (!val) allValid = false;
            localStorage.setItem(id, val);
        });

        if (allValid) {
            toggleScreen(false);
        } else {
            alert("Please fill in all five system setting fields.");
        }
    });

    // 4. CLOCK LOGIC
    function startClock() {
        const clockEl = document.getElementById('live-clock');
        const update = () => {
            const now = new Date();
            const dateParts = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
            const timeParts = now.toTimeString().split(' ')[0];
            clockEl.innerText = `${dateParts} ${timeParts}`;
        };
        setInterval(update, 1000);
        update();
    }

    // 5. GPS STATUS SENSOR
    function initGPS() {
        const gpsEl = document.getElementById('gps-status');
        if ("geolocation" in navigator) {
            navigator.geolocation.watchPosition(
                () => { 
                    gpsEl.innerText = "GPS : ON"; 
                    gpsEl.className = "gps-on"; 
                },
                () => { 
                    gpsEl.innerText = "GPS : OFF"; 
                    gpsEl.className = "gps-off"; 
                },
                { enableHighAccuracy: true }
            );
        }
    }

    startClock();
    initGPS();
    loadData();
});
