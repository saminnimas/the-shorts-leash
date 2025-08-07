console.log("Deadscroll Blocker: Content script loaded.");

// --- Configuration ---
const SHORT_LIMIT = 5;

// --- State ---
let shortsWatchedCount = 0;

// --- DOM Elements ---

// This function creates and displays the block screen overlay
const showBlockScreen = () => {
  console.log("Deadscroll Blocker: Limit reached. Showing block screen.");

  // Create the main overlay div
  const overlay = document.createElement('div');
  overlay.id = 'deadscroll-blocker-overlay'; // Give it an ID for styling

  // Style the overlay using CSS
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100vh',
    backgroundColor: 'rgba(25, 25, 25, 0.98)', // Dark, semi-transparent background
    zIndex: '9999', // Ensure it's on top of everything
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center'
  });

  // Create the heading
  const heading = document.createElement('h1');
  heading.textContent = 'Time for a Break! 🛑';
  Object.assign(heading.style, {
    fontSize: '48px',
    marginBottom: '20px'
  });
  
  // Create the message paragraph
  const message = document.createElement('p');
  message.textContent = `You've watched ${SHORT_LIMIT} Shorts. The feed is now paused.`;
  Object.assign(message.style, {
    fontSize: '24px',
    maxWidth: '500px'
  });

  // Add the heading and message to the overlay
  overlay.appendChild(heading);
  overlay.appendChild(message);

  // Add the overlay to the page's body
  document.body.appendChild(overlay);
};


// --- Core Logic: The Observer ---

const handleMutation = (mutationsList, observer) => {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1 && node.tagName === 'YTD-REEL-VIDEO-RENDERER') {
          shortsWatchedCount++;
          console.log(`Deadscroll Blocker: Shorts watched count is now ${shortsWatchedCount}`);

          // --- NEW: Check the limit and block if necessary ---
          if (shortsWatchedCount >= SHORT_LIMIT) {
            showBlockScreen();
            // Stop observing once the limit is reached to prevent further execution
            observer.disconnect(); 
            console.log("Deadscroll Blocker: Observer disconnected.");
          }
        }
      });
    }
  }
};


// --- Initializing the Observer ---

const initObserver = setInterval(() => {
  const targetNode = document.getElementById('shorts-container');
  
  if (targetNode) {
    clearInterval(initObserver); 
    console.log("Deadscroll Blocker: Found shorts-container, attaching observer.");
    const observer = new MutationObserver(handleMutation);
    const config = { childList: true, subtree: true };
    observer.observe(targetNode, config);
  }
}, 1000);