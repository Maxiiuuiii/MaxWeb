// StreamFlix - Modern Streaming Platform JavaScript

// Content data from the provided JSON
const contentData = {
    featuredContent: {
        id: "1078605",
        type: "movie",
        title: "Wicked",
        description: "Ein magisches Musical-Abenteuer über die unerzählte Geschichte der Hexen von Oz",
        poster: "https://image.tmdb.org/t/p/w500/c5Tqxeo1UpBvnAc3csUm7j3hlQl.jpg",
        backdrop: "https://image.tmdb.org/t/p/w1280/uKb22E0nlzGDqYj9wgS6dkJOo5Q.jpg",
        year: "2024",
        genre: "Musical, Fantasy"
    },
    movies: [
        {
            id: "1078605",
            title: "Wicked",
            description: "Ein magisches Musical-Abenteuer",
            poster: "https://image.tmdb.org/t/p/w300/c5Tqxeo1UpBvnAc3csUm7j3hlQl.jpg",
            year: "2024",
            genre: "Musical, Fantasy"
        },
        {
            id: "299534",
            title: "Avengers: Endgame", 
            description: "Das epische Finale der Infinity Saga",
            poster: "https://image.tmdb.org/t/p/w300/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
            year: "2019",
            genre: "Action, Adventure"
        },
        {
            id: "550",
            title: "Fight Club",
            description: "Ein dystopischer Thriller über Rebellion", 
            poster: "https://image.tmdb.org/t/p/w300/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
            year: "1999",
            genre: "Drama, Thriller"
        },
        {
            id: "157336",
            title: "Interstellar",
            description: "Eine Reise durch Raum und Zeit",
            poster: "https://image.tmdb.org/t/p/w300/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", 
            year: "2014",
            genre: "Sci-Fi, Drama"
        },
        {
            id: "27205",
            title: "Inception",
            description: "Ein Mind-Bending Heist-Thriller",
            poster: "https://image.tmdb.org/t/p/w300/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
            year: "2010", 
            genre: "Action, Sci-Fi"
        },
        {
            id: "238",
            title: "The Godfather",
            description: "Der ultimative Mafia-Klassiker",
            poster: "https://image.tmdb.org/t/p/w300/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
            year: "1972",
            genre: "Crime, Drama"
        }
    ],
    tvShows: [
        {
            id: "119051",
            title: "Wednesday", 
            description: "Addams Family Spin-off Serie",
            poster: "https://image.tmdb.org/t/p/w300/9PFonBhy4cQy7Jz20NpMygczOkv.jpg",
            year: "2022",
            genre: "Comedy, Crime",
            seasons: 1,
            episodes: 8,
            currentSeason: 1,
            currentEpisode: 8
        },
        {
            id: "1399",
            title: "Game of Thrones",
            description: "Episches Fantasy-Drama",
            poster: "https://image.tmdb.org/t/p/w300/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg", 
            year: "2011",
            genre: "Fantasy, Drama",
            seasons: 8,
            episodes: 73,
            currentSeason: 1,
            currentEpisode: 1
        },
        {
            id: "1396",
            title: "Breaking Bad",
            description: "Ein Chemiehrer wird zum Drogenbaron",
            poster: "https://image.tmdb.org/t/p/w300/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
            year: "2008", 
            genre: "Crime, Drama",
            seasons: 5,
            episodes: 62,
            currentSeason: 1,
            currentEpisode: 1
        },
        {
            id: "1418",
            title: "The Big Bang Theory",
            description: "Nerd-Comedy über Physiker",
            poster: "https://image.tmdb.org/t/p/w300/ooBGRQBdbGzBxAVfExiO8r7kloA.jpg",
            year: "2007",
            genre: "Comedy", 
            seasons: 12,
            episodes: 279,
            currentSeason: 1,
            currentEpisode: 1
        }
    ]
};

// Global state
let currentContent = contentData.featuredContent;
let playerSettings = {
    color: "e50914",
    autoPlay: false,
    nextEpisode: true,
    episodeSelector: true,
    progress: 0
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupProgressTracking();
    populateContentGrids();
    setupSearch();
    setupNavigation();
});

function initializeApp() {
    // Set up the featured content
    updateHeroContent(contentData.featuredContent);
    
    // Initialize settings
    const colorPicker = document.getElementById('colorPicker');
    const autoPlayToggle = document.getElementById('autoPlayToggle');
    
    colorPicker.value = '#' + playerSettings.color;
    autoPlayToggle.checked = playerSettings.autoPlay;
    
    // Update color display
    document.getElementById('colorDisplay').textContent = '#' + playerSettings.color;
}

function setupEventListeners() {
    // Color picker
    const colorPicker = document.getElementById('colorPicker');
    colorPicker.addEventListener('input', function(e) {
        const color = e.target.value.replace('#', '');
        playerSettings.color = color;
        document.getElementById('colorDisplay').textContent = e.target.value;
        updatePlayerSettings();
    });
    
    // Auto-play toggle
    const autoPlayToggle = document.getElementById('autoPlayToggle');
    autoPlayToggle.addEventListener('change', function(e) {
        playerSettings.autoPlay = e.target.checked;
        updatePlayerSettings();
    });
    
    // Next episode toggle
    const nextEpisodeToggle = document.getElementById('nextEpisodeToggle');
    nextEpisodeToggle.addEventListener('change', function(e) {
        playerSettings.nextEpisode = e.target.checked;
        updatePlayerSettings();
    });
    
    // Episode selector
    const episodeSelect = document.getElementById('episodeSelect');
    episodeSelect.addEventListener('change', function(e) {
        if (currentContent.type === 'tv') {
            currentContent.currentEpisode = parseInt(e.target.value);
            updatePlayerSettings();
        }
    });
}

function setupProgressTracking() {
    // Listen for messages from the iframe player
    window.addEventListener("message", function(event) {
        try {
            if (typeof event.data === "string") {
                const data = JSON.parse(event.data);
                
                if (data.type === "PLAYER_EVENT") {
                    handlePlayerEvent(data.data);
                }
            }
        } catch (error) {
            console.log("Non-JSON message received:", event.data);
        }
    });
}

function handlePlayerEvent(eventData) {
    const progressDisplay = document.getElementById('progressDisplay');
    const currentTimeEl = document.getElementById('currentTime');
    const durationEl = document.getElementById('duration');
    const progressFill = document.getElementById('progressFill');
    const progressEvents = document.getElementById('progressEvents');
    
    // Update progress bar
    if (eventData.duration && eventData.currentTime) {
        const progressPercent = (eventData.currentTime / eventData.duration) * 100;
        progressFill.style.width = progressPercent + '%';
        
        // Update time displays
        currentTimeEl.textContent = formatTime(eventData.currentTime);
        durationEl.textContent = formatTime(eventData.duration);
    }
    
    // Log event
    const eventMessage = `${new Date().toLocaleTimeString()}: ${eventData.event} - ${formatTime(eventData.currentTime || 0)}`;
    const eventElement = document.createElement('div');
    eventElement.textContent = eventMessage;
    progressEvents.appendChild(eventElement);
    
    // Keep only last 5 events
    while (progressEvents.children.length > 5) {
        progressEvents.removeChild(progressEvents.firstChild);
    }
    
    // Auto-scroll to bottom
    progressEvents.scrollTop = progressEvents.scrollHeight;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function populateContentGrids() {
    populateGrid('moviesGrid', contentData.movies, 'movie');
    populateGrid('seriesGrid', contentData.tvShows, 'tv');
    
    // Combine all content for the main grid
    const allContent = [...contentData.movies, ...contentData.tvShows];
    populateGrid('allContentGrid', allContent, 'all');
}

function populateGrid(gridId, content, type) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    
    grid.innerHTML = '';
    
    content.forEach((item, index) => {
        const card = createContentCard(item, type);
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in');
        grid.appendChild(card);
    });
}

function createContentCard(item, type) {
    const card = document.createElement('div');
    card.className = `content-card ${item.seasons ? 'content-card--tv' : 'content-card--movie'}`;
    
    const contentType = item.seasons ? 'Serie' : 'Film';
    const seasonInfo = item.seasons ? `${item.seasons} Staffel${item.seasons > 1 ? 'n' : ''}` : '';
    
    card.innerHTML = `
        <div class="content-card__type">${contentType}</div>
        <img src="${item.poster}" alt="${item.title}" class="content-card__poster" loading="lazy">
        <div class="content-card__info">
            <h3 class="content-card__title">${item.title}</h3>
            <div class="content-card__meta">
                <span>${item.year}</span>
                <span>${seasonInfo || item.genre}</span>
            </div>
            <p class="content-card__description">${item.description}</p>
        </div>
    `;
    
    card.addEventListener('click', () => {
        switchToContent(item);
        scrollToTop();
    });
    
    return card;
}

function switchToContent(content) {
    currentContent = content;
    updateHeroContent(content);
    updatePlayerSettings();
    
    // Show/hide TV-specific settings
    const tvSettings = document.getElementById('tvSettings');
    const tvEpisodeSelector = document.getElementById('tvEpisodeSelector');
    
    if (content.seasons) {
        tvSettings.style.display = 'block';
        tvEpisodeSelector.style.display = 'block';
        updateEpisodeSelector(content);
    } else {
        tvSettings.style.display = 'none';
        tvEpisodeSelector.style.display = 'none';
    }
}

function updateHeroContent(content) {
    document.getElementById('heroTitle').textContent = content.title;
    document.getElementById('heroDescription').textContent = content.description;
    document.getElementById('heroYear').textContent = content.year;
    document.getElementById('heroGenre').textContent = content.genre;
}

function updateEpisodeSelector(content) {
    const episodeSelect = document.getElementById('episodeSelect');
    episodeSelect.innerHTML = '';
    
    for (let i = 1; i <= content.episodes; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Episode ${i}`;
        if (i === content.currentEpisode) {
            option.selected = true;
        }
        episodeSelect.appendChild(option);
    }
}

function updatePlayerSettings() {
    const player = document.getElementById('videoPlayer');
    let src = 'https://www.vidking.net/embed/';
    
    if (currentContent.seasons) {
        // TV Show
        src += `tv/${currentContent.id}/${currentContent.currentSeason}/${currentContent.currentEpisode}`;
    } else {
        // Movie
        src += `movie/${currentContent.id}`;
    }
    
    // Add parameters
    const params = new URLSearchParams();
    params.append('color', playerSettings.color);
    params.append('autoPlay', playerSettings.autoPlay);
    
    if (currentContent.seasons) {
        params.append('nextEpisode', playerSettings.nextEpisode);
        params.append('episodeSelector', playerSettings.episodeSelector);
    }
    
    if (playerSettings.progress > 0) {
        params.append('progress', playerSettings.progress);
    }
    
    src += '?' + params.toString();
    player.src = src;
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.toLowerCase().trim();
        filterContent(query);
    });
}

function filterContent(query) {
    const allContent = [...contentData.movies, ...contentData.tvShows];
    const filtered = query ? 
        allContent.filter(item => 
            item.title.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.genre.toLowerCase().includes(query)
        ) : allContent;
    
    populateGrid('allContentGrid', filtered, 'all');
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav__link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            filterByType(filter);
        });
    });
}

function filterByType(type) {
    let content = [];
    
    switch(type) {
        case 'movie':
            content = contentData.movies;
            break;
        case 'tv':
            content = contentData.tvShows;
            break;
        case 'popular':
            // Show top rated content (first 4 of each)
            content = [...contentData.movies.slice(0, 4), ...contentData.tvShows.slice(0, 2)];
            break;
        default:
            content = [...contentData.movies, ...contentData.tvShows];
    }
    
    populateGrid('allContentGrid', content, type);
}

// Global functions for HTML onclick handlers
function playFeatured() {
    playerSettings.autoPlay = true;
    updatePlayerSettings();
    
    // Scroll to player
    const playerContainer = document.getElementById('playerContainer');
    playerContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function toggleSettings() {
    const settingsPanel = document.getElementById('settingsPanel');
    settingsPanel.classList.toggle('hidden');
}

function applySettings() {
    updatePlayerSettings();
    toggleSettings();
    
    // Show confirmation
    showNotification('Einstellungen wurden angewendet!');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #e50914, #ff1744);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 3000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    // Add animation keyframes
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Make functions globally available
window.playFeatured = playFeatured;
window.toggleSettings = toggleSettings;
window.applySettings = applySettings;

// Header scroll effect
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    const scrolled = window.scrollY > 50;
    
    if (scrolled) {
        header.style.background = 'rgba(31, 33, 33, 0.98)';
        header.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.3)';
    } else {
        header.style.background = 'rgba(31, 33, 33, 0.95)';
        header.style.boxShadow = 'none';
    }
});

// Intersection Observer for animations
const observeElements = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('slide-up');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // Observe content sections
    document.querySelectorAll('.content-section').forEach(section => {
        observer.observe(section);
    });
};

// Initialize animations when DOM is ready
document.addEventListener('DOMContentLoaded', observeElements);

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Space bar to play/pause (when not in input)
    if (e.code === 'Space' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        playerSettings.autoPlay = !playerSettings.autoPlay;
        updatePlayerSettings();
    }
    
    // Escape to close settings
    if (e.code === 'Escape') {
        const settingsPanel = document.getElementById('settingsPanel');
        if (!settingsPanel.classList.contains('hidden')) {
            toggleSettings();
        }
    }
    
    // Arrow keys for content navigation
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        const allContent = [...contentData.movies, ...contentData.tvShows];
        const currentIndex = allContent.findIndex(item => item.id === currentContent.id);
        
        if (currentIndex !== -1) {
            let newIndex;
            if (e.code === 'ArrowLeft') {
                newIndex = currentIndex > 0 ? currentIndex - 1 : allContent.length - 1;
            } else {
                newIndex = currentIndex < allContent.length - 1 ? currentIndex + 1 : 0;
            }
            
            switchToContent(allContent[newIndex]);
        }
    }
});

// Error handling for iframe loading
document.getElementById('videoPlayer').addEventListener('error', function() {
    console.warn('Player loading error - this is normal in development mode');
});

// Performance monitoring
if ('performance' in window) {
    window.addEventListener('load', function() {
        setTimeout(() => {
            const perfData = performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            console.log(`StreamFlix loaded in ${pageLoadTime}ms`);
        }, 0);
    });
}

// Console welcome message
console.log('%c🎬 StreamFlix - Modern Streaming Platform', 'color: #e50914; font-size: 16px; font-weight: bold;');
console.log('%cPowered by Vidking Player API', 'color: #ff6b35; font-size: 12px;');
console.log('%cKeyboard shortcuts: Space (play/pause), Esc (close settings), ← → (navigate)', 'color: #888;');
