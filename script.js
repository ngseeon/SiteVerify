document.addEventListener('DOMContentLoaded', () => {
    // 1. Live Clock
    setInterval(() => {
        const now = new Date();
        document.getElementById('live-clock').innerText = now.toLocaleString('en-GB', {
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
    }, 1000);

    // 2. Navigation
    document.getElementById('settings-gear').onclick = () => {
        document.getElementById('menu-screen').style.display = 'none';
        document.getElementById('settings-screen').style.display = 'block';
    };

    document.getElementById('save-settings').onclick = () => {
        document.getElementById('settings-screen').style.display = 'none';
        document.getElementById('menu-screen').style.display = 'block';
    };
});
