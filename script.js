document.addEventListener('DOMContentLoaded', () => {
    // LIVE CLOCK
    function startClock() {
        setInterval(() => {
            const now = new Date();
            document.getElementById('live-clock').innerText = now.toLocaleString('en-GB', {
                day: '2-digit', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            });
        }, 1000);
    }
    startClock();

    // NAVIGATION
    document.getElementById('nav-capture').onclick = () => {
        console.log("Opening Camera Screen...");
    };
    
    document.getElementById('settings-gear').onclick = () => {
        console.log("Opening Settings Screen...");
    };
});
