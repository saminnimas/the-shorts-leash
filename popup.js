// Get references to the HTML elements
const shortsLimitInput = document.getElementById('shortsLimit');
const cooldownHoursInput = document.getElementById('cooldownHours');
const saveButton = document.getElementById('saveButton');
const statusMessage = document.getElementById('status');

// --- Functions ---

// 1. Saves the settings to chrome.storage.sync
const saveSettings = () => {
    const shortsLimit = parseInt(shortsLimitInput.value, 10);
    const cooldownHours = parseInt(cooldownHoursInput.value, 10);

    // Basic validation
    if (isNaN(shortsLimit) || shortsLimit < 1) {
        statusMessage.textContent = 'Invalid Short Limit.';
        return;
    }
    if (isNaN(cooldownHours) || cooldownHours < 1 || cooldownHours > 12) {
        statusMessage.textContent = 'Invalid Cooldown Hours.';
        return;
    }

    const settings = {
        shortsLimit: shortsLimit,
        cooldownHours: cooldownHours
    };

    chrome.storage.sync.set({ settings }, () => {
        console.log('Settings saved:', settings);
        statusMessage.textContent = 'Settings saved!';
        setTimeout(() => {
            statusMessage.textContent = '';
        }, 2000); // Clear message after 2 seconds
    });
};

// 2. Loads the settings from chrome.storage.sync
const loadSettings = () => {
    chrome.storage.sync.get('settings', (data) => {
        if (data.settings) {
            shortsLimitInput.value = data.settings.shortsLimit;
            cooldownHoursInput.value = data.settings.cooldownHours;
        } else {
            // No settings found, use default values
            shortsLimitInput.value = 5;
            cooldownHoursInput.value = 2;
        }
    });
};

// --- Event Listeners ---

// Run loadSettings when the popup is opened
document.addEventListener('DOMContentLoaded', loadSettings);

// Run saveSettings when the save button is clicked
saveButton.addEventListener('click', saveSettings);