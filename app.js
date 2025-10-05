// JavaScript for the football match streaming website

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeApp();
});

function initializeApp() {
    // Set up iframe loading handler
    setupIframeLoading();
    
    // Set up responsive handler
    setupResponsiveHandling();
    
    // Set up keyboard navigation
    setupKeyboardNavigation();
    
    // Update match status
    updateMatchStatus();
}

function setupIframeLoading() {
    const iframe = document.querySelector('iframe');
    const videoWrapper = document.querySelector('.video-wrapper');
    
    if (!iframe || !videoWrapper) return;
    
    // Add loading class initially
    videoWrapper.classList.add('loading');
    
    // Handle iframe load event
    iframe.addEventListener('load', function() {
        videoWrapper.classList.remove('loading');
        videoWrapper.classList.add('loaded');
        
        // Log successful load
        console.log('Video stream loaded successfully');
    });
    
    // Handle iframe error
    iframe.addEventListener('error', function() {
        videoWrapper.classList.remove('loading');
        videoWrapper.classList.add('error');
        
        // Show error message
        showErrorMessage();
    });
    
    // Set a timeout for loading
    setTimeout(function() {
        if (videoWrapper.classList.contains('loading')) {
            videoWrapper.classList.remove('loading');
            console.log('Stream loading timeout reached');
        }
    }, 10000); // 10 second timeout
}

function setupResponsiveHandling() {
    // Handle window resize
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
    // Allow keyboard navigation to iframe
    const iframe = document.querySelector('iframe');
    
    if (!iframe) return;
    
    // Make iframe focusable
    iframe.setAttribute('tabindex', '0');
    
    // Handle escape key for potential fullscreen exit
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            // If document is in fullscreen, exit
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => {
                    console.log('Error exiting fullscreen:', err);
                });
            }
        }
        
        // Handle F key for fullscreen (when iframe is focused)
        if (event.key === 'f' && event.target === iframe) {
            event.preventDefault();
            requestFullscreen();
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

function showErrorMessage() {
    const videoWrapper = document.querySelector('.video-wrapper');
    
    if (!videoWrapper) return;
    
    // Create error message
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.innerHTML = `
        <div class="error-content">
            <h3>Stream nicht verfügbar</h3>
            <p>Der Live-Stream konnte nicht geladen werden. Bitte versuchen Sie es später erneut.</p>
            <button class="btn btn--primary" onclick="reloadStream()">Erneut versuchen</button>
        </div>
    `;
    
    // Style the error message
    errorMessage.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--color-charcoal-800);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        border-radius: var(--radius-lg);
    `;
    
    const errorContent = errorMessage.querySelector('.error-content');
    errorContent.style.cssText = `
        text-align: center;
        padding: var(--space-24);
        color: var(--color-text);
    `;
    
    videoWrapper.appendChild(errorMessage);
}

function reloadStream() {
    const iframe = document.querySelector('iframe');
    const errorMessage = document.querySelector('.error-message');
    
    if (iframe) {
        // Reload the iframe
        const src = iframe.src;
        iframe.src = '';
        setTimeout(() => {
            iframe.src = src;
        }, 100);
    }
    
    if (errorMessage) {
        errorMessage.remove();
    }
    
    // Re-initialize loading state
    const videoWrapper = document.querySelector('.video-wrapper');
    if (videoWrapper) {
        videoWrapper.classList.remove('error', 'loaded');
        videoWrapper.classList.add('loading');
    }
}

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

// Handle visibility change (pause/play when tab becomes inactive/active)
document.addEventListener('visibilitychange', function() {
    const iframe = document.querySelector('iframe');
    
    if (!iframe) return;
    
    if (document.hidden) {
        // Tab is now hidden
        console.log('Tab hidden - stream may pause');
    } else {
        // Tab is now visible
        console.log('Tab visible - stream should resume');
    }
});

// Expose some functions globally for debugging
window.footballStream = {
    reloadStream,
    requestFullscreen,
    getViewportSize,
    isMobile
};
