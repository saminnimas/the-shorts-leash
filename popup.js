const shortsLimitInput = document.getElementById('shortsLimit');
const cooldownHoursInput = document.getElementById('cooldownHours');
const saveButton = document.getElementById('saveButton');
const statusMessage = document.getElementById('status');


// For customized limit
const saveSettings = () => {
    statusMessage.textContent = '';
    statusMessage.classList.remove('status-success', 'status-error');

    const shortsLimit = parseInt(shortsLimitInput.value, 10);
    const cooldownHours = parseInt(cooldownHoursInput.value, 10);

    if (isNaN(shortsLimit) || shortsLimit < 1 || shortsLimit > 20) {
        statusMessage.textContent = 'Shorts limit must be between 1 and 20.';
        statusMessage.classList.add('status-error'); 
        return;
    }
    if (isNaN(cooldownHours) || cooldownHours < 1 || cooldownHours > 12) {
        statusMessage.textContent = 'Cooldown must be between 1 and 12 hours.';
        statusMessage.classList.add('status-error'); 
        return;
    }

    const settings = {
        shortsLimit: shortsLimit,
        cooldownHours: cooldownHours
    };

    chrome.storage.sync.set({ settings }, () => {
        console.log('Settings saved:', settings);
        statusMessage.textContent = 'Settings saved! Reload YouTube for changes to take effect.';
        statusMessage.classList.add('status-success'); 
    });
};


// Loads the settings from chrome.storage.sync
const loadSettings = () => {
    chrome.storage.sync.get('settings', (data) => {
        if (data.settings) {
            shortsLimitInput.value = data.settings.shortsLimit;
            cooldownHoursInput.value = data.settings.cooldownHours;
        } else {
            shortsLimitInput.value = 5;
            cooldownHoursInput.value = 2;
        }
    });
};


document.addEventListener('DOMContentLoaded', loadSettings);

saveButton.addEventListener('click', saveSettings);