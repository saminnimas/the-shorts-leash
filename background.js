// Listen for messages from other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Check the action specified in the message
    if (message.action === 'startCooldown') {
      // Load the user's custom settings first
      chrome.storage.sync.get('settings', (data) => {
          // Use the saved cooldown hours, or default to 2
          const cooldownHours = (data.settings && data.settings.cooldownHours) ? data.settings.cooldownHours : 2;
          const duration = cooldownHours * 60 * 60 * 1000;
          const pauseUntil = Date.now() + duration;
  
          chrome.storage.sync.set({ pauseUntil: pauseUntil }, () => {
              console.log(`Deadscroll Blocker: Cooldown started. Paused until ${new Date(pauseUntil).toLocaleTimeString()}`);
          });
      });
      return true; // Keep the message channel open for async response
    }
  
    if (message.action === 'getCooldownState') {
      chrome.storage.sync.get(['pauseUntil'], (result) => {
        const now = Date.now();
        if (result.pauseUntil && now < result.pauseUntil) {
          // We are on cooldown
          sendResponse({ onCooldown: true, timeLeft: result.pauseUntil - now });
        } else {
          // Not on cooldown
          sendResponse({ onCooldown: false });
        }
      });
      return true; // Indicates that the response is sent asynchronously
    }
  });