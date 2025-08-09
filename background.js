chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'startCooldown') {
      chrome.storage.sync.get('settings', (data) => {
          const cooldownHours = (data.settings && data.settings.cooldownHours) ? data.settings.cooldownHours : 2;
          const duration = cooldownHours * 60 * 60 * 1000;
          const pauseUntil = Date.now() + duration;
  
          chrome.storage.sync.set({ pauseUntil: pauseUntil }, () => {
              console.log(`Deadscroll Blocker: Cooldown started. Paused until ${new Date(pauseUntil).toLocaleTimeString()}`);
          });
      });
      return true;
    }
  
    if (message.action === 'getCooldownState') {
      chrome.storage.sync.get(['pauseUntil'], (result) => {
        const now = Date.now();
        if (result.pauseUntil && now < result.pauseUntil) {
          // On cooldown
          sendResponse({ onCooldown: true, timeLeft: result.pauseUntil - now });
        } else {
          // Not on cooldown
          sendResponse({ onCooldown: false });
        }
      });
      return true;
    }
  });