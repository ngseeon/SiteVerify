document.addEventListener('DOMContentLoaded', () => {
    // 1. LIVE CLOCK
    setInterval(() => {
        const now = new Date();
        document.getElementById('live-clock').innerText = now.toLocaleString('en-GB');
    }, 1000);

    // 2. SCREEN NAVIGATION
    const menu = document.getElementById('menu-screen');
    const settings = document.getElementById('settings-screen');
    const camera = document.getElementById('camera-screen');

    function openScreen(target) {
        menu.style.display = 'none';
        settings.style.display = 'none';
        camera.style.display = 'none';
        target.style.display = 'block';
    }

    // BUTTON ACTIONS
    document.getElementById('settings-gear').onclick = () => openScreen(settings);
    document.getElementById('save-settings').onclick = () => openScreen(menu);
    document.getElementById('nav-capture').onclick = () => openScreen(camera);
    document.getElementById('cam-back').onclick = () => openScreen(menu);
    
    document.getElementById('nav-history').onclick = () => alert("History not yet implemented");
});
