let shortsObserver = null;
let shortsWatchedCount = 0;       // Raw count of all videos loaded in this session
let initialVideoOffset = 0;       // How many videos were pre-loaded
let isInitialLoad = true;         // Flag to track if we've calculated the offset yet
let SHORT_LIMIT = 5;              // Default value
let currentPageState = 'none';


function formatTime(ms) {
  let seconds = Math.floor(ms / 1000); let minutes = Math.floor(seconds / 60); let hours = Math.floor(minutes / 60);
  seconds %= 60; minutes %= 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}
const blockScrollEvents = (e) => { e.preventDefault(); e.stopPropagation(); };


function showBlockScreen(timeLeft) {
  if (document.getElementById('deadscroll-blocker-overlay')) return;
  const tryPauseVideo = () => {
    const activeVideo = document.querySelector('ytd-reel-video-renderer[is-active] video');
    if (activeVideo) { activeVideo.pause(); } else { setTimeout(tryPauseVideo, 200); }
  };
  tryPauseVideo();
  window.addEventListener('wheel', blockScrollEvents, true); window.addEventListener('keydown', blockScrollEvents, true); window.addEventListener('touchmove', blockScrollEvents, true);
  const overlay = document.createElement('div');
  overlay.id = 'deadscroll-blocker-overlay';
  Object.assign(overlay.style, {
    position: 'fixed', top: '0', left: '0', width: '100%', height: '100vh', backgroundColor: 'rgba(25, 25, 25, 0.98)', zIndex: '9999', display: 'flex',
    flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', fontFamily: 'Arial, sans-serif', textAlign: 'center'
  });
  const heading = document.createElement('h1');
  heading.textContent = 'Time for a Break! 🛑';
  heading.style.fontSize = '48px';
  const message = document.createElement('p');
  if (timeLeft) { message.textContent = `The feed is paused. Time remaining: ${formatTime(timeLeft)}`; } else { message.textContent = `You've watched ${SHORT_LIMIT} Shorts. The feed is now paused.`; }
  message.style.fontSize = '24px'; message.style.marginBottom = '40px';
  const homeButton = document.createElement('button');
  homeButton.textContent = 'Go to YouTube Homepage';
  Object.assign(homeButton.style, {
    padding: '12px 24px', fontSize: '18px', color: '#0f0f0f', backgroundColor: '#f1f1f1', border: 'none', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit'
  });
  homeButton.onclick = () => { window.location.href = 'https://www.youtube.com'; };
  overlay.append(heading, message, homeButton);
  document.body.appendChild(overlay);
}

function handleShortsMutation(mutationsList) {
  let newShortsFound = false;
  for (const mutation of mutationsList) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === 1 && node.tagName === 'YTD-REEL-VIDEO-RENDERER') {
        newShortsFound = true;
        break;
      }
    }
    if (newShortsFound) break;
  }

  if (newShortsFound) {
    if (!hasCountedInitialLoad) {
      shortsWatchedCount = 1;
      hasCountedInitialLoad = true;
    } else {
      shortsWatchedCount++;
    }
    
    // console.log(`Deadscroll Blocker: Shorts count is now ${shortsWatchedCount}`);

    if (shortsWatchedCount >= SHORT_LIMIT) {
      chrome.runtime.sendMessage({ action: 'startCooldown' });
      showBlockScreen();
      if (shortsObserver) shortsObserver.disconnect();
    }
  }
}


function initializeShortsPage() {
  // console.log("Deadscroll Blocker: Initializing for Shorts page.");
  try {
    chrome.storage.sync.get('settings', (data) => {
        if (data.settings && data.settings.shortsLimit) {
            SHORT_LIMIT = data.settings.shortsLimit;
        }
    });

    chrome.runtime.sendMessage({ action: 'getCooldownState' }, response => {
      if (chrome.runtime.lastError) return;
      if (response && response.onCooldown) {
        showBlockScreen(response.timeLeft);
      } else {
        if (shortsObserver) shortsObserver.disconnect();
        shortsWatchedCount = 0;
        hasCountedInitialLoad = false; // Reset the flag for the new session
        
        const targetNode = document.getElementById('shorts-container');
        if (targetNode) {
          shortsObserver = new MutationObserver(handleShortsMutation);
          shortsObserver.observe(targetNode, { childList: true, subtree: true });
        } else {
          setTimeout(initializeShortsPage, 500);
        }
      }
    });
  } catch (e) { /* console.error("Deadscroll Blocker: Extension context invalidated."); */ }
}


function cleanupShortsPage() {
  // console.log("Deadscroll Blocker: Cleaning up from Shorts page.");
  if (shortsObserver) { shortsObserver.disconnect(); shortsObserver = null; }
  const overlay = document.getElementById('deadscroll-blocker-overlay');
  if (overlay) overlay.remove();
  window.removeEventListener('wheel', blockScrollEvents, true);
  window.removeEventListener('keydown', blockScrollEvents, true);
  window.removeEventListener('touchmove', blockScrollEvents, true);
}


function checkPageState() {
  const url = window.location.href;
  const newState = url.includes('/shorts/') ? 'shorts' : 'other';
  if (newState === currentPageState) return;
  // console.log(`Deadscroll Blocker: Page state changed from '${currentPageState}' to '${newState}'`);
  if (currentPageState === 'shorts') { cleanupShortsPage(); }
  if (newState === 'shorts') { initializeShortsPage(); }
  currentPageState = newState;
}

setInterval(checkPageState, 500);