document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Live Clock Functionality
    function updateClock() {
        const now = new Date();
        const timeString = now.toLocaleString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
        document.getElementById('live-clock').innerText = timeString;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // 2. Button Functions
    document.getElementById('nav-capture').onclick = () => {
        alert("Capture function triggered!");
        // We will add the actual camera code in the next step
    };

    document.getElementById('nav-history').onclick = () => {
        alert("History function triggered!");
    };

    document.getElementById('settings-gear').onclick = () => {
        alert("Settings clicked!");
    };
});
