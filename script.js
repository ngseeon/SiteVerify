document.addEventListener('DOMContentLoaded', () => {
    const screens = ['menu-screen', 'settings-screen', 'camera-screen'];

    function showScreen(id) {
        screens.forEach(s => document.getElementById(s).style.display = 'none');
        document.getElementById(id).style.display = 'block';
    }

    // Settings Gear
    document.getElementById('settings-gear').onclick = () => showScreen('settings-screen');

    // Save Button
    document.getElementById('save-settings').onclick = () => showScreen('menu-screen');

    // Capture Navigation
    document.getElementById('nav-capture').onclick = () => {
        showScreen('camera-screen');
        // Actual camera activation logic will go here next!
    };

    document.getElementById('camera-back').onclick = () => showScreen('menu-screen');

    // Live Clock Logic
    setInterval(() => {
        const now = new Date();
        document.getElementById('live-clock').innerText = now.toLocaleString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
    }, 1000);
});
