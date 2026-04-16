// SiteVerify Master Blueprint - Phase 1 & 2 Logic
document.addEventListener('DOMContentLoaded', () => {
    // 1. Identify Elements
    const saveSettingsBtn = document.getElementById('save-settings');
    const settingsScreen = document.getElementById('settings-screen');
    const mainScreen = document.getElementById('main-screen');

    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userHandphone = document.getElementById('userHandphone');
    const recipientEmail = document.getElementById('recipientEmail');
    const whatsappPhone = document.getElementById('whatsappPhone');

    // 2. Logic to Save Settings and Switch Screen
    saveSettingsBtn.addEventListener('click', () => {
        // Validation: Ensure all 5 fields are filled
        if (!userName.value || !userEmail.value || !userHandphone.value || !recipientEmail.value || !whatsappPhone.value) {
            alert("Error: All five system setting fields must be completed before proceeding.");
            return;
        }

        // Lock data in memory (Phase 1)
        const userSettings = {
            name: userName.value,
            email: userEmail.value,
            phone: userHandphone.value,
            targetEmail: recipientEmail.value,
            targetWhatsApp: whatsappPhone.value
        };
        
        console.log("System Settings Saved:", userSettings);

        // Transition: Hide Settings, Show Camera/Save buttons
        settingsScreen.style.display = 'none';
        mainScreen.style.display = 'block';
    });

    // 3. Phase 2: Camera Logic Placeholder
    document.getElementById('open-camera').addEventListener('click', () => {
        alert("Workflow Step 1: Opening Site Camera...");
        // Future code for QR scanning & Camera capture will be placed here
    });

    // 4. Phase 2: Save to Device Logic Placeholder
    document.getElementById('save-device').addEventListener('click', () => {
        alert("Workflow Step 5: Saving Locked Data to Device...");
    });
});
