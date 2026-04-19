document.getElementById('shutter').onclick = async () => {
    // 1. Capture Back Camera Frame
    const backCanvas = document.createElement('canvas');
    backCanvas.width = video.videoWidth;
    backCanvas.height = video.videoHeight;
    backCanvas.getContext('2d').drawImage(video, 0, 0);
    const mainImageData = backCanvas.toDataURL('image/jpeg');

    // 2. Stop Back Camera and Instant Flip to Front
    stream.getTracks().forEach(t => t.stop());
    
    try {
        const frontStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user" } 
        });
        video.srcObject = frontStream;

        // Small delay to let front camera stabilize (<0.5s)
        setTimeout(() => {
            const frontCanvas = document.createElement('canvas');
            frontCanvas.width = video.videoWidth;
            frontCanvas.height = video.videoHeight;
            frontCanvas.getContext('2d').drawImage(video, 0, 0);
            const selfieData = frontCanvas.toDataURL('image/jpeg');

            // 3. Trigger PIN Logic (Next Update)
            console.log("Dual Snaps Complete");
            alert("Step 1 & 2 Complete: Photos Captured. Moving to PIN Verification.");
            
            // For now, return to back camera for live view or proceed to PIN
            frontStream.getTracks().forEach(t => t.stop());
        }, 400);

    } catch (e) {
        alert("Selfie Capture Failed: " + e.message);
    }
};
