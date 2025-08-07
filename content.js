console.log("Deadscroll Blocker: Content script loaded.");

// --- Configuration ---
let SHORT_LIMIT = 5; // We will load this from storage later

// --- State ---
let shortsWatchedCount = 0;

// --- Helper Functions ---
const formatTime = (ms) => {
  let seconds = Math.floor(ms / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);

  seconds = seconds % 60;
  minutes = minutes % 60;

  return `${hours}h ${minutes}m ${seconds}s`;
};

// --- DOM Elements ---
const showBlockScreen = (timeLeft) => {
  // If an overlay already exists, don't create another one
  if (document.getElementById('deadscroll-blocker-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'deadscroll-blocker-overlay';
  Object.assign(overlay.style, {
    position: 'fixed', top: '0', left: '0', width: '100%', height: '100vh',
    backgroundColor: 'rgba(25, 25, 25, 0.98)', zIndex: '9999', display: 'flex',
    flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    color: 'white', fontFamily: 'Arial, sans-serif', textAlign: 'center'
  });

  const heading = document.createElement('h1');
  heading.textContent = 'Time for a Break! 🛑';
  heading.style.fontSize = '48px';

  const message = document.createElement('p');
  // Show different message if on cooldown vs. just hitting the limit
  if (timeLeft) {
    message.textContent = `The feed is paused. Time remaining: ${formatTime(timeLeft)}`;
  } else {
    message.textContent = `You've watched ${SHORT_LIMIT} Shorts. The feed is now paused.`;
  }
  message.style.fontSize = '24px';

  overlay.append(heading, message);
  document.body.appendChild(overlay);
};

// --- Core Logic ---
const handleMutation = (mutationsList, observer) => {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1 && node.tagName === 'YTD-REEL-VIDEO-RENDERER') {
          shortsWatchedCount++;
          console.log(`Deadscroll Blocker: Shorts watched count is now ${shortsWatchedCount}`);

          if (shortsWatchedCount >= SHORT_LIMIT) {
            // Tell the background script to start the timer
            chrome.runtime.sendMessage({ action: 'startCooldown' }); // Will use default 2 hours
            showBlockScreen();
            observer.disconnect();
            console.log("Deadscroll Blocker: Observer disconnected.");
          }
        }
      });
    }
  }
};

const initObserver = () => {
  const targetNode = document.getElementById('shorts-container');
  if (targetNode) {
    console.log("Deadscroll Blocker: Found shorts-container, attaching observer.");
    const observer = new MutationObserver(handleMutation);
    const config = { childList: true, subtree: true };
    observer.observe(targetNode, config);
  } else {
    // If the container isn't there, check again in a second
    setTimeout(initObserver, 1000);
  }
};

// --- SCRIPT ENTRY POINT ---
// 1. Check if we are currently in a cooldown period
chrome.runtime.sendMessage({ action: 'getCooldownState' }, (response) => {
  if (response.onCooldown) {
    console.log("Deadscroll Blocker: Cooldown is active.");
    showBlockScreen(response.timeLeft);
  } else {
    console.log("Deadscroll Blocker: No active cooldown, starting observer.");
    // 2. If not on cooldown, start watching for shorts
    initObserver();
  }
});