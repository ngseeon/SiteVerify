document.addEventListener('DOMContentLoaded', () => {
    // 1. LIVE CLOCK
    setInterval(() => {
        const now = new Date();
        document.getElementById('live-clock').innerText = now.toLocaleString('en-GB', {
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
    }, 1000);

    // 2. GPS MONITOR
    navigator.geolocation.watchPosition(
        () => { document.getElementById('gps-status').innerText = "GPS : ON"; },
        () => { document.getElementById('gps-status').innerText = "GPS : OFF"; }
    );

    // 3. NAVIGATION
    document.getElementById('settings-gear').onclick = () => alert("Opening Settings...");
    document.getElementById('nav-capture').onclick = () => alert("Opening Camera...");
});
