document.addEventListener('DOMContentLoaded', () => {
    // 1. Clock
    setInterval(() => {
        const now = new Date();
        document.getElementById('live-clock').innerText = now.toLocaleString('en-GB');
    }, 1000);

    // 2. Navigation
    document.getElementById('nav-capture').onclick = () => alert("Capture mode starting...");
    document.getElementById('nav-history').onclick = () => alert("Opening History...");
    document.getElementById('settings-gear').onclick = () => alert("Opening Settings...");
});
