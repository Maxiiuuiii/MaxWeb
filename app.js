// JavaScript for the football match streaming website with dual streams

// Stream configuration
const streamConfig = {
    stream1: {
        id: 'stream1',
        name: 'Stream 1',
        title: 'Alpha Stream',
        url: 'https://embedsports.top/embed/alpha/vfb-stuttgart-vs-1-fc-heidenheim-1846/2'
    },
    stream2: {
        id: 'stream2',
        name: 'Stream 2', 
        title: 'Echo Stream',
        url: 'https://embedsports.top/embed/echo/vfb-stuttgart-vs-1-fc-heidenheim-football-1388360/2'
    }
};

// Application state
let currentStream = 'stream1';
let loadedStreams = new Set(['stream1']); // Stream 1 is loaded by default

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeApp();
});

function initializeApp() {
    // Set up stream tabs
    setupStreamTabs();
    
    // Set up iframe loading handlers
    setupIframeLoading();
    
    // Set up responsive handler
    setupResponsiveHandling();
    
    // Set up keyboard navigation
    setupKeyboardNavigation();
    
    // Update match status
    updateMatchStatus();
    
    // Initialize current stream display
    updateStreamStatus();
    
    console.log('Football streaming app initialized with dual streams');
}

function setupStreamTabs() {
    const tabs = document.querySelectorAll('.stream-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const streamId = this.getAttribute('data-stream');
            switchToStream(streamId);
        });
        
        // Add keyboard support
        tab.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                const streamId = this.getAttribute('data-stream');
                switchToStream(streamId);
            }
        });
    });
}

function switchToStream(streamId) {
    if (streamId === currentStream) return; // Already on this stream
    
    // Update current stream
    currentStream = streamId;
    
    // Update tab appearance
    updateActiveTab(streamId);
    
    // Show/hide stream content
    updateStreamContent(streamId);
    
    // Load stream if not already loaded
    if (!loadedStreams.has(streamId)) {
        loadStream(streamId);
        loadedStreams.add(streamId);
    }
    
    // Update stream status display
    updateStreamStatus();
    
    console.log(`Switched to ${streamId}`);
}

function updateActiveTab(activeStreamId) {
    const tabs = document.querySelectorAll('.stream-tab');
    
    tabs.forEach(tab => {
        const streamId = tab.getAttribute('data-stream');
        if (streamId === activeStreamId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

function updateStreamContent(activeStreamId) {
    const streamContents = document.querySelectorAll('.stream-content');
    
    streamContents.forEach(content => {
        if (content.id === activeStreamId) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

function loadStream(streamId) {
    const streamContent = document.getElementById(streamId);
    const videoWrapper = streamContent.querySelector('.video-wrapper');
    const config = streamConfig[streamId];
    
    if (!config || !videoWrapper) return;
    
    // Create iframe element
    const iframe = document.createElement('iframe');
    iframe.title = `Stuttgart vs FC Heidenheim Player (${config.title})`;
    iframe.marginHeight = '0';
    iframe.marginWidth = '0';
    iframe.src = config.url;
    iframe.scrolling = 'no';
    iframe.allowFullscreen = true;
    iframe.allow = 'encrypted-media; picture-in-picture;';
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.frameBorder = '0';
    iframe.loading = 'lazy';
    
    // Add loading handler
    iframe.addEventListener('load', function() {
        videoWrapper.classList.add('loaded');
        console.log(`${streamId} loaded successfully`);
    });
    
    iframe.addEventListener('error', function() {
        showStreamError(streamId);
        console.error(`Error loading ${streamId}`);
    });
    
    // Clear existing content and add iframe
    videoWrapper.innerHTML = '';
    videoWrapper.appendChild(iframe);
    
    console.log(`Loading ${streamId}: ${config.url}`);
}

function updateStreamStatus() {
    const streamNameElement = document.getElementById('current-stream-name');
    const config = streamConfig[currentStream];
    
    if (streamNameElement && config) {
        streamNameElement.textContent = `${config.name} - ${config.title}`;
    }
}

function setupIframeLoading() {
    // Handle the default loaded stream (stream1)
    const defaultIframe = document.querySelector('#stream1 iframe');
    const defaultWrapper = document.querySelector('#stream1 .video-wrapper');
    
    if (defaultIframe && defaultWrapper) {
        defaultIframe.addEventListener('load', function() {
            defaultWrapper.classList.add('loaded');
            console.log('Default stream loaded successfully');
        });
        
        defaultIframe.addEventListener('error', function() {
            showStreamError('stream1');
        });
    }
}

function setupResponsiveHandling() {
    let resizeTimeout;
    
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            adjustVideoLayout();
        }, 250);
    });
    
    // Initial layout adjustment
    adjustVideoLayout();
}

function adjustVideoLayout() {
    const videoContainer = document.querySelector('.video-container');
    const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
    };
    
    if (!videoContainer) return;
    
    // Adjust container based on viewport
    if (viewport.width < 768) {
        videoContainer.style.margin = '0';
    } else {
        videoContainer.style.margin = '';
    }
}

function setupKeyboardNavigation() {
    // Handle tab navigation between streams
    document.addEventListener('keydown', function(event) {
        // Switch streams with number keys
        if (event.key === '1') {
            event.preventDefault();
            switchToStream('stream1');
        } else if (event.key === '2') {
            event.preventDefault();
            switchToStream('stream2');
        }
        
        // Handle escape key for potential fullscreen exit
        if (event.key === 'Escape') {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => {
                    console.log('Error exiting fullscreen:', err);
                });
            }
        }
        
        // Handle F key for fullscreen
        if (event.key === 'f' || event.key === 'F') {
            const activeIframe = document.querySelector('.stream-content.active iframe');
            if (activeIframe && document.activeElement === activeIframe) {
                event.preventDefault();
                requestFullscreen();
            }
        }
    });
}

function updateMatchStatus() {
    const statusElement = document.querySelector('.status--info');
    
    if (!statusElement) return;
    
    // Update status text to show it's live
    statusElement.textContent = 'LIVE';
    
    // Add pulsing animation for live indicator
    statusElement.style.animation = 'pulse 2s infinite';
}

function requestFullscreen() {
    const videoContainer = document.querySelector('.video-container');
    
    if (!videoContainer) return;
    
    if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen();
    } else if (videoContainer.webkitRequestFullscreen) {
        videoContainer.webkitRequestFullscreen();
    } else if (videoContainer.msRequestFullscreen) {
        videoContainer.msRequestFullscreen();
    }
}

function showStreamError(streamId) {
    const streamContent = document.getElementById(streamId);
    const videoWrapper = streamContent.querySelector('.video-wrapper');
    
    if (!videoWrapper) return;
    
    // Create error message
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.innerHTML = `
        <div class="error-content">
            <h3>Stream nicht verfügbar</h3>
            <p>Der Live-Stream konnte nicht geladen werden. Bitte versuchen Sie es später erneut oder wechseln Sie zu einem anderen Stream.</p>
            <button class="btn btn--primary" onclick="reloadStream('${streamId}')">Erneut versuchen</button>
            ${streamId === 'stream1' ? 
                '<button class="btn btn--secondary" onclick="switchToStream(\'stream2\')">Zu Stream 2 wechseln</button>' :
                '<button class="btn btn--secondary" onclick="switchToStream(\'stream1\')">Zu Stream 1 wechseln</button>'
            }
        </div>
    `;
    
    videoWrapper.appendChild(errorMessage);
}

function reloadStream(streamId) {
    const streamContent = document.getElementById(streamId);
    const videoWrapper = streamContent.querySelector('.video-wrapper');
    const errorMessage = videoWrapper.querySelector('.error-message');
    
    if (errorMessage) {
        errorMessage.remove();
    }
    
    // Remove from loaded streams set to force reload
    loadedStreams.delete(streamId);
    
    // Clear wrapper
    videoWrapper.innerHTML = '';
    videoWrapper.classList.remove('loaded');
    
    // Reload the stream
    loadStream(streamId);
    loadedStreams.add(streamId);
    
    console.log(`Reloading ${streamId}`);
}

// Handle visibility change (pause/play when tab becomes inactive/active)
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('Tab hidden - streams may pause');
    } else {
        console.log('Tab visible - streams should resume');
    }
});

// Utility functions
function getViewportSize() {
    return {
        width: window.innerWidth,
        height: window.innerHeight
    };
}

function isMobile() {
    return window.innerWidth < 768;
}

function getCurrentStream() {
    return currentStream;
}

function getLoadedStreams() {
    return Array.from(loadedStreams);
}

// Expose functions globally for debugging and external access
window.footballStream = {
    switchToStream,
    reloadStream,
    requestFullscreen,
    getViewportSize,
    isMobile,
    getCurrentStream,
    getLoadedStreams,
    streamConfig
};
