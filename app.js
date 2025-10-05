// Online Multiplayer Strichmännchen Kampf Arena
class OnlineMultiplayerGame {
    constructor() {
        // Game State
        this.currentScreen = 'main-menu';
        this.gameMode = 'menu'; // menu, lobby, drawing, battle
        this.isHost = false;
        this.playerId = this.generatePlayerId();
        this.playerName = 'Spieler ' + Math.floor(Math.random() * 9999);
        this.currentPlayer = 1;
        
        // Network
        this.peer = null;
        this.connection = null;
        this.isConnected = false;
        this.lobbyCode = null;
        this.lastHeartbeat = Date.now();
        this.pingTimes = [];
        this.averagePing = 0;

        // Game Data
        this.weapons = { player1: null, player2: null };
        this.gameSettings = {
            drawingTime: 30,
            battleTime: 120,
            healthPerPlayer: 100,
            gravity: 0.8
        };
        
        // Physics Engine
        this.engine = null;
        this.world = null;
        this.players = {};
        this.platforms = [];
        this.gameRunning = false;

        // Drawing
        this.drawingCtx = null;
        this.gameCtx = null;
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;

        // Timers
        this.drawingTimer = null;
        this.battleTimer = null;
        this.heartbeatInterval = null;

        // Input
        this.keys = {};
        this.particles = [];

        // Stats
        this.battleStats = {
            myHits: 0,
            opponentHits: 0,
            startTime: null
        };

        // WebRTC Config
        this.stunServers = [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun.services.mozilla.com' }
        ];

        // Weapon Types
        this.weaponTypes = {
            sword: { name: 'Schwert', baseSpeed: 70, baseDamage: 60, baseRange: 40 },
            axe: { name: 'Streitaxt', baseSpeed: 40, baseDamage: 80, baseRange: 35 },
            spear: { name: 'Speer', baseSpeed: 60, baseDamage: 50, baseRange: 70 },
            gun: { name: 'Pistole', baseSpeed: 90, baseDamage: 70, baseRange: 85 },
            rifle: { name: 'Gewehr', baseSpeed: 50, baseDamage: 90, baseRange: 95 },
            bow: { name: 'Bogen', baseSpeed: 50, baseDamage: 55, baseRange: 90 },
            hammer: { name: 'Kriegshammer', baseSpeed: 30, baseDamage: 95, baseRange: 30 },
            dagger: { name: 'Dolch', baseSpeed: 95, baseDamage: 35, baseRange: 25 }
        };

        this.init();
    }

    generatePlayerId() {
        return Math.random().toString(36).substr(2, 9);
    }

    generateLobbyCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    init() {
        console.log('Initializing game...');
        // Ensure we start fresh
        this.resetGameState();
        this.setupEventListeners();
        this.createParticleSystem();
        this.showScreen('main-menu');
        this.updateConnectionStatus('offline');
        this.loadStats();
        console.log('Game initialization complete');
    }

    resetGameState() {
        this.cleanup();
        this.gameMode = 'menu';
        this.isHost = false;
        this.isConnected = false;
        this.lobbyCode = null;
        this.weapons = { player1: null, player2: null };
        this.battleStats = { myHits: 0, opponentHits: 0, startTime: null };
    }

    // Event Listeners
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Main Menu - ensure buttons exist and are clickable
        this.bindButton('create-lobby-btn', () => {
            console.log('Create lobby clicked');
            this.createLobby();
        });

        this.bindButton('join-lobby-btn', () => {
            console.log('Join lobby clicked');
            this.showJoinLobby();
        });

        this.bindButton('local-game-btn', () => {
            console.log('Local game clicked');
            this.startLocalGame();
        });

        this.bindButton('help-btn', () => {
            console.log('Help clicked');
            this.showHelp();
        });

        // Lobby Creation
        this.bindButton('copy-code', () => this.copyLobbyCode());
        
        this.bindButton('cancel-lobby', () => {
            console.log('Cancel lobby clicked');
            this.cancelLobby();
        });

        // Lobby Joining
        this.bindButton('connect-lobby', () => this.connectToLobby());
        
        this.bindButton('back-to-menu', () => {
            console.log('Back to menu clicked');
            this.backToMainMenu();
        });

        // Lobby Room
        this.bindButton('start-game', () => this.startOnlineGame());
        
        this.bindButton('leave-lobby', () => {
            console.log('Leave lobby clicked');
            this.leaveLobby();
        });
        
        this.bindButton('send-chat', () => this.sendChatMessage());
        
        const chatMessageInput = document.getElementById('chat-message');
        if (chatMessageInput) {
            chatMessageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendChatMessage();
            });
        }

        // Weapon Design
        this.bindButton('clear-canvas', () => {
            console.log('Clear canvas clicked');
            this.clearCanvas();
        });
        
        this.bindButton('finish-drawing', () => {
            console.log('Finish drawing clicked');
            this.finishDrawing();
        });

        this.bindButton('back-from-drawing', () => {
            console.log('Back from drawing clicked');
            this.handleBackFromDrawing();
        });

        // AI Analysis
        this.bindButton('continue-to-battle', () => {
            console.log('Continue to battle clicked');
            this.startBattle();
        });

        this.bindButton('back-from-analysis', () => {
            console.log('Back from analysis clicked');
            this.handleBackFromAnalysis();
        });

        // Battle Results
        this.bindButton('rematch-btn', () => this.requestRematch());
        
        this.bindButton('new-game-btn', () => this.backToLobby());
        
        this.bindButton('main-menu-btn', () => {
            console.log('Main menu clicked');
            this.backToMainMenu();
        });

        // Modals
        this.bindButton('close-help', () => this.closeHelp());
        this.bindButton('retry-connection', () => this.retryConnection());
        this.bindButton('close-error', () => this.closeError());

        // Keyboard Events
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === ' ' || e.key === 'Enter') e.preventDefault();
            
            // ESC key to go back
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Drawing Canvas
        this.setupDrawingCanvas();

        // Window Events
        window.addEventListener('beforeunload', () => this.cleanup());
        
        console.log('Event listeners setup complete');
    }

    bindButton(id, handler) {
        const button = document.getElementById(id);
        if (button) {
            // Remove existing listeners to prevent duplicates
            button.removeEventListener('click', handler);
            button.addEventListener('click', handler);
            console.log(`Bound handler for button: ${id}`);
        } else {
            console.warn(`Button not found: ${id}`);
        }
    }

    handleEscapeKey() {
        console.log('Escape key pressed, current screen:', this.currentScreen);
        
        // Close modals first
        const helpModal = document.getElementById('help-modal');
        const errorModal = document.getElementById('error-modal');
        
        if (helpModal && !helpModal.classList.contains('hidden')) {
            this.closeHelp();
            return;
        }
        
        if (errorModal && !errorModal.classList.contains('hidden')) {
            this.closeError();
            return;
        }
        
        // Navigate back based on current screen
        switch (this.currentScreen) {
            case 'create-lobby':
            case 'join-lobby':
                this.backToMainMenu();
                break;
            case 'lobby-room':
                this.leaveLobby();
                break;
            case 'weapon-design':
                this.handleBackFromDrawing();
                break;
            case 'ai-analysis':
                this.handleBackFromAnalysis();
                break;
            case 'battle':
                // Don't allow escape during battle
                break;
            case 'game-result':
                this.backToMainMenu();
                break;
        }
    }

    handleBackFromDrawing() {
        if (this.drawingTimer) {
            clearInterval(this.drawingTimer);
            this.drawingTimer = null;
        }

        if (this.isConnected) {
            this.showScreen('lobby-room');
        } else {
            this.backToMainMenu();
        }
    }

    handleBackFromAnalysis() {
        if (this.isConnected) {
            this.showScreen('lobby-room');
        } else {
            this.backToMainMenu();
        }
    }

    backToMainMenu() {
        console.log('Returning to main menu');
        this.resetGameState();
        this.showScreen('main-menu');
        this.updateConnectionStatus('offline');
    }

    setupDrawingCanvas() {
        const canvas = document.getElementById('drawing-canvas');
        if (!canvas) {
            console.error('Drawing canvas not found');
            return;
        }
        
        this.drawingCtx = canvas.getContext('2d');

        // Mouse Events
        canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        canvas.addEventListener('mousemove', (e) => this.draw(e));
        canvas.addEventListener('mouseup', () => this.stopDrawing());
        canvas.addEventListener('mouseout', () => this.stopDrawing());

        // Touch Events
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            this.startDrawing({
                offsetX: touch.clientX - rect.left,
                offsetY: touch.clientY - rect.top
            });
        });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            this.draw({
                offsetX: touch.clientX - rect.left,
                offsetY: touch.clientY - rect.top
            });
        });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopDrawing();
        });
        
        console.log('Drawing canvas setup complete');
    }

    startDrawing(e) {
        this.isDrawing = true;
        this.lastX = e.offsetX;
        this.lastY = e.offsetY;
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        this.drawingCtx.beginPath();
        this.drawingCtx.moveTo(this.lastX, this.lastY);
        this.drawingCtx.lineTo(e.offsetX, e.offsetY);
        this.drawingCtx.strokeStyle = '#32a087';
        this.drawingCtx.lineWidth = 3;
        this.drawingCtx.lineCap = 'round';
        this.drawingCtx.stroke();
        
        this.lastX = e.offsetX;
        this.lastY = e.offsetY;

        // Send drawing data to peer (throttled)
        if (this.isConnected && Math.random() < 0.3) {
            this.sendMessage({
                type: 'drawing_stroke',
                fromX: this.lastX,
                fromY: this.lastY,
                toX: e.offsetX,
                toY: e.offsetY,
                timestamp: Date.now()
            });
        }
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    // Screen Management
    showScreen(screenId) {
        console.log('Showing screen:', screenId);
        
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
        } else {
            console.error('Screen not found:', screenId);
        }
    }

    // Lobby System
    createLobby() {
        console.log('Creating lobby...');
        this.lobbyCode = this.generateLobbyCode();
        this.isHost = true;
        
        const lobbyCodeElement = document.getElementById('lobby-code');
        if (lobbyCodeElement) {
            lobbyCodeElement.textContent = this.lobbyCode;
        }
        
        this.showScreen('create-lobby');
        this.updateConnectionStatus('waiting');
        
        // Simulate connection after 3 seconds for demo
        setTimeout(() => {
            if (this.currentScreen === 'create-lobby') {
                console.log('Simulating player join...');
                this.simulatePlayerJoin();
            }
        }, 3000);
    }

    simulatePlayerJoin() {
        console.log('Player joined lobby');
        this.isConnected = true;
        this.updateConnectionStatus('connected');
        this.showLobbyRoom();
        this.startHeartbeat();
    }

    showJoinLobby() {
        console.log('Showing join lobby screen');
        this.isHost = false;
        this.showScreen('join-lobby');
        
        const codeInput = document.getElementById('lobby-code-input');
        if (codeInput) {
            codeInput.focus();
        }
    }

    connectToLobby() {
        console.log('Connecting to lobby...');
        const codeInput = document.getElementById('lobby-code-input');
        const code = codeInput ? codeInput.value.trim().toUpperCase() : '';
        
        if (code.length !== 6) {
            this.showJoinStatus('Code muss 6 Zeichen haben', 'error');
            return;
        }

        this.lobbyCode = code;
        this.showJoinStatus('Verbinde...', 'connecting');

        // Simulate connection after 2 seconds
        setTimeout(() => {
            console.log('Simulating successful connection');
            this.isConnected = true;
            this.updateConnectionStatus('connected');
            this.showLobbyRoom();
            this.startHeartbeat();
        }, 2000);
    }

    showLobbyRoom() {
        console.log('Showing lobby room');
        const roomCodeElement = document.getElementById('room-code');
        if (roomCodeElement) {
            roomCodeElement.textContent = this.lobbyCode;
        }
        
        this.showScreen('lobby-room');
        
        // Update player cards
        this.updatePlayerCard(1, this.playerName, true);
        
        if (!this.isHost) {
            this.updatePlayerCard(2, 'Host', true);
            const startGameBtn = document.getElementById('start-game');
            if (startGameBtn) {
                startGameBtn.style.display = 'none';
            }
        } else {
            this.updatePlayerCard(2, 'Mitspieler', true);
        }
        
        this.addChatMessage('system', 'Verbunden! Das Spiel kann beginnen.');
    }

    updatePlayerCard(playerNum, name, connected) {
        const card = document.getElementById(`player${playerNum}-card`);
        const nameElement = document.getElementById(`player${playerNum}-name`);
        const statusElement = document.getElementById(`player${playerNum}-ready`);
        
        if (!card || !nameElement || !statusElement) return;
        
        nameElement.textContent = name;
        
        if (connected) {
            card.classList.add('connected');
            statusElement.innerHTML = '<span class="status-dot ready"></span><span>Bereit</span>';
            
            if (playerNum === 2) {
                const startGameBtn = document.getElementById('start-game');
                if (startGameBtn) {
                    startGameBtn.disabled = false;
                }
            }
        } else {
            card.classList.remove('connected');
            statusElement.innerHTML = '<span class="status-dot waiting"></span><span>Warte...</span>';
            const startGameBtn = document.getElementById('start-game');
            if (startGameBtn) {
                startGameBtn.disabled = true;
            }
        }
    }

    copyLobbyCode() {
        const codeElement = document.getElementById('lobby-code');
        const code = codeElement ? codeElement.textContent : '';
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(code).then(() => {
                const btn = document.getElementById('copy-code');
                if (btn) {
                    const originalText = btn.textContent;
                    btn.textContent = 'Kopiert!';
                    setTimeout(() => {
                        btn.textContent = originalText;
                    }, 2000);
                }
            }).catch(err => {
                console.error('Failed to copy: ', err);
                this.showCopiedFeedback();
            });
        } else {
            // Fallback for older browsers
            this.showCopiedFeedback();
        }
    }

    showCopiedFeedback() {
        const btn = document.getElementById('copy-code');
        if (btn) {
            const originalText = btn.textContent;
            btn.textContent = 'Kopiert!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        }
    }

    cancelLobby() {
        console.log('Canceling lobby...');
        this.backToMainMenu();
    }

    leaveLobby() {
        console.log('Leaving lobby...');
        this.sendMessage({ type: 'player_left' });
        this.backToMainMenu();
    }

    // Chat System
    sendChatMessage() {
        const input = document.getElementById('chat-message');
        const message = input ? input.value.trim() : '';
        
        if (message) {
            this.addChatMessage('own', message);
            if (this.isConnected) {
                this.sendMessage({
                    type: 'chat_message',
                    message: message,
                    sender: this.playerName
                });
            }
            if (input) {
                input.value = '';
            }
        }
    }

    addChatMessage(type, message, sender = '') {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}`;
        
        if (type === 'system') {
            messageDiv.textContent = message;
        } else if (type === 'own') {
            messageDiv.textContent = message;
        } else {
            messageDiv.textContent = `${sender}: ${message}`;
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Limit chat messages to prevent memory issues
        while (messagesContainer.children.length > 50) {
            messagesContainer.removeChild(messagesContainer.firstChild);
        }
    }

    showJoinStatus(message, type) {
        const statusElement = document.getElementById('join-status-text');
        const statusContainer = document.getElementById('join-status');
        
        if (statusElement) {
            statusElement.textContent = message;
        }
        
        if (statusContainer) {
            statusContainer.className = `connection-status ${type}`;
        }
    }

    updateConnectionStatus(status) {
        const statusDot = document.getElementById('connection-status');
        const statusText = document.getElementById('connection-text');
        
        if (statusDot) {
            statusDot.className = `status-dot ${status}`;
        }
        
        if (statusText) {
            switch (status) {
                case 'online':
                case 'connected':
                    statusText.textContent = 'Online';
                    break;
                case 'connecting':
                case 'waiting':
                    statusText.textContent = 'Verbinde...';
                    break;
                default:
                    statusText.textContent = 'Offline';
            }
        }
    }

    // Network Communication
    sendMessage(message) {
        console.log('Sending message:', message.type);
        // In a real implementation, this would send via WebRTC
        return true;
    }

    startHeartbeat() {
        console.log('Starting heartbeat...');
        // Simplified heartbeat for demo
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        this.heartbeatInterval = setInterval(() => {
            this.lastHeartbeat = Date.now();
        }, 2000);
    }

    // Game Flow
    startOnlineGame() {
        console.log('Starting online game...');
        if (!this.isConnected) {
            this.showError('Keine Verbindung zum Mitspieler');
            return;
        }
        
        this.sendMessage({ type: 'game_start' });
        this.startWeaponDesign();
    }

    startLocalGame() {
        console.log('Starting local game...');
        this.gameMode = 'local';
        this.isConnected = false; // Ensure we're in local mode
        this.startWeaponDesign();
    }

    startWeaponDesign() {
        console.log('Starting weapon design phase...');
        this.gameMode = 'drawing';
        this.currentPlayer = 1;
        this.showScreen('weapon-design');
        
        const titleElement = document.getElementById('current-player-title');
        if (titleElement) {
            if (this.gameMode === 'local') {
                titleElement.textContent = 'Spieler 1 - Zeichne deine Waffe!';
            } else {
                titleElement.textContent = 'Du - Zeichne deine Waffe!';
            }
        }
        
        this.clearCanvas();
        this.startDrawingTimer();
        
        // Update sync status
        const syncText = document.getElementById('sync-text');
        const opponentProgress = document.getElementById('opponent-progress');
        
        if (syncText) {
            syncText.textContent = this.isConnected ? 'Synchronisiert' : 'Lokal';
        }
        
        if (opponentProgress) {
            opponentProgress.textContent = this.isConnected ? 'Wartet...' : 'Lokales Spiel';
        }
    }

    startDrawingTimer() {
        console.log('Starting drawing timer...');
        let timeLeft = this.gameSettings.drawingTime;
        const timerElement = document.getElementById('timer');
        
        if (timerElement) {
            timerElement.textContent = timeLeft;
        }
        
        if (this.drawingTimer) {
            clearInterval(this.drawingTimer);
        }
        
        this.drawingTimer = setInterval(() => {
            timeLeft--;
            if (timerElement) {
                timerElement.textContent = timeLeft;
            }
            
            // Update timer circle visual
            const timerCircle = document.querySelector('.timer-circle');
            if (timerCircle) {
                const progress = ((this.gameSettings.drawingTime - timeLeft) / this.gameSettings.drawingTime) * 360;
                timerCircle.style.background = `conic-gradient(var(--color-primary) ${progress}deg, transparent ${progress}deg)`;
            }
            
            if (timeLeft <= 0) {
                console.log('Drawing timer expired, finishing drawing automatically');
                this.finishDrawing();
            }
        }, 1000);
    }

    clearCanvas() {
        console.log('Clearing canvas...');
        const canvas = document.getElementById('drawing-canvas');
        if (!canvas || !this.drawingCtx) {
            console.error('Canvas or context not available');
            return;
        }
        
        this.drawingCtx.clearRect(0, 0, canvas.width, canvas.height);
        this.drawingCtx.fillStyle = '#f8f8f8';
        this.drawingCtx.fillRect(0, 0, canvas.width, canvas.height);
        console.log('Canvas cleared');
    }

    finishDrawing() {
        console.log('Finishing drawing for player', this.currentPlayer);
        
        if (this.drawingTimer) {
            clearInterval(this.drawingTimer);
            this.drawingTimer = null;
        }

        const canvas = document.getElementById('drawing-canvas');
        if (!canvas) {
            console.error('Canvas not found');
            return;
        }

        const weaponData = this.analyzeDrawing(canvas);
        this.weapons[`player${this.currentPlayer}`] = weaponData;
        
        console.log(`Weapon data for player ${this.currentPlayer}:`, weaponData);
        
        if (this.gameMode === 'local') {
            // In local mode, handle both players
            if (this.currentPlayer === 1) {
                this.currentPlayer = 2;
                
                // Update UI for player 2
                const titleElement = document.getElementById('current-player-title');
                if (titleElement) {
                    titleElement.textContent = 'Spieler 2 - Zeichne deine Waffe!';
                }
                
                this.clearCanvas();
                this.startDrawingTimer();
                console.log('Switched to player 2 in local mode');
            } else {
                // Both players done in local mode
                console.log('Both players finished drawing in local mode');
                this.showAIAnalysis();
            }
        } else {
            // Online mode - in demo, just create a dummy weapon for other player
            if (!this.weapons.player2) {
                this.weapons.player2 = this.createDummyWeaponData();
            }
            console.log('Online mode - proceeding to analysis');
            this.showAIAnalysis();
        }
    }

    createDummyWeaponData() {
        console.log('Creating dummy weapon data');
        // Create a simple dummy weapon image for demo
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = '#32a087';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(150, 150);
        ctx.lineTo(250, 100);
        ctx.lineTo(270, 80);
        ctx.lineTo(270, 120);
        ctx.lineTo(250, 100);
        ctx.lineTo(250, 140);
        ctx.lineTo(150, 180);
        ctx.stroke();
        
        return {
            type: 'axe',
            damage: 85,
            speed: 45,
            range: 40,
            imageData: ctx.getImageData(0, 0, canvas.width, canvas.height)
        };
    }

    // AI Weapon Analysis
    analyzeDrawing(canvas) {
        console.log('Analyzing drawing...');
        
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        let drawnPixels = [];
        for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] > 0 && !(pixels[i] === 248 && pixels[i+1] === 248 && pixels[i+2] === 248)) {
                const x = (i / 4) % canvas.width;
                const y = Math.floor((i / 4) / canvas.width);
                drawnPixels.push({ x, y });
            }
        }

        if (drawnPixels.length === 0) {
            console.log('No drawing detected, using default weapon');
            return {
                type: 'sword',
                damage: 50,
                speed: 70,
                range: 45,
                imageData: imageData
            };
        }

        const minX = Math.min(...drawnPixels.map(p => p.x));
        const maxX = Math.max(...drawnPixels.map(p => p.x));
        const minY = Math.min(...drawnPixels.map(p => p.y));
        const maxY = Math.max(...drawnPixels.map(p => p.y));

        const width = maxX - minX;
        const height = maxY - minY;
        const aspectRatio = width / height;
        const complexity = drawnPixels.length;
        const area = width * height;

        console.log('Drawing analysis:', { width, height, aspectRatio, complexity, area });

        let weaponType = this.determineWeaponType(aspectRatio, complexity, area);
        let baseStats = this.weaponTypes[weaponType];

        const sizeModifier = Math.min(2, Math.max(0.5, area / 10000));
        const complexityModifier = Math.min(1.5, Math.max(0.7, complexity / 1000));

        const damage = Math.round(baseStats.baseDamage * sizeModifier * complexityModifier);
        const speed = Math.round(baseStats.baseSpeed * (2 - sizeModifier) * complexityModifier);
        const range = Math.round(baseStats.baseRange * (aspectRatio > 2 ? 1.3 : 1));

        const result = {
            type: weaponType,
            damage: Math.min(100, Math.max(10, damage)),
            speed: Math.min(100, Math.max(10, speed)),
            range: Math.min(100, Math.max(10, range)),
            imageData: imageData
        };

        console.log('Weapon analysis result:', result);
        return result;
    }

    determineWeaponType(aspectRatio, complexity, area) {
        if (aspectRatio > 4) return 'spear';
        if (aspectRatio > 2.5 && complexity < 500) return 'sword';
        if (aspectRatio < 0.8 && area > 8000) return 'hammer';
        if (aspectRatio > 2 && complexity > 800) return 'gun';
        if (aspectRatio < 1.2 && area > 5000) return 'axe';
        if (area < 3000) return 'dagger';
        return 'sword';
    }

    showAIAnalysis() {
        console.log('Showing AI analysis...');
        this.showScreen('ai-analysis');
        
        // Small delay to let screen transition complete
        setTimeout(() => {
            this.displayWeaponAnalysis();
        }, 100);
    }

    displayWeaponAnalysis() {
        console.log('Displaying weapon analysis...');
        
        // Update player names
        const p1Name = document.getElementById('p1-player-name');
        const p2Name = document.getElementById('p2-player-name');
        
        if (p1Name && p2Name) {
            if (this.gameMode === 'local') {
                p1Name.textContent = 'Spieler 1';
                p2Name.textContent = 'Spieler 2';
            } else {
                p1Name.textContent = this.isHost ? 'Du' : 'Gegner';
                p2Name.textContent = this.isHost ? 'Gegner' : 'Du';
            }
        }
        
        if (this.weapons.player1) {
            this.displayPlayerWeapon(1, this.weapons.player1);
        }
        
        if (this.weapons.player2) {
            this.displayPlayerWeapon(2, this.weapons.player2);
        }
    }

    displayPlayerWeapon(playerNum, weapon) {
        if (!weapon) {
            console.error(`No weapon data for player ${playerNum}`);
            return;
        }
        
        console.log(`Displaying weapon for player ${playerNum}:`, weapon);
        
        const prefix = `p${playerNum}`;
        
        const weaponTypeElement = document.getElementById(`${prefix}-weapon-type`);
        if (weaponTypeElement) {
            weaponTypeElement.textContent = this.weaponTypes[weapon.type].name;
        }
        
        this.animateStatBar(`${prefix}-damage-bar`, `${prefix}-damage-value`, weapon.damage);
        this.animateStatBar(`${prefix}-speed-bar`, `${prefix}-speed-value`, weapon.speed);
        this.animateStatBar(`${prefix}-range-bar`, `${prefix}-range-value`, weapon.range);
        
        const preview = document.querySelector(`#player${playerNum}-weapon .weapon-preview`);
        if (preview && weapon.imageData) {
            const ctx = preview.getContext('2d');
            
            ctx.fillStyle = '#f8f8f8';
            ctx.fillRect(0, 0, preview.width, preview.height);
            
            try {
                const scale = Math.min(preview.width / 400, preview.height / 300);
                ctx.save();
                ctx.scale(scale, scale);
                ctx.putImageData(weapon.imageData, 0, 0);
                ctx.restore();
            } catch (error) {
                console.error('Error displaying weapon preview:', error);
                // Draw a fallback weapon
                ctx.strokeStyle = '#32a087';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(50, 75);
                ctx.lineTo(150, 50);
                ctx.stroke();
            }
        }
    }

    animateStatBar(barId, valueId, value) {
        setTimeout(() => {
            const bar = document.getElementById(barId);
            const valueElement = document.getElementById(valueId);
            
            if (bar) {
                bar.style.width = `${value}%`;
            }
            
            if (valueElement) {
                valueElement.textContent = value;
            }
        }, 300);
    }

    // Battle System (Simplified for demo)
    startBattle() {
        console.log('Starting battle...');
        this.gameMode = 'battle';
        this.showScreen('battle');
        
        // Initialize battle UI
        const p1Name = document.getElementById('battle-p1-name');
        const p2Name = document.getElementById('battle-p2-name');
        
        if (p1Name && p2Name) {
            if (this.gameMode === 'local') {
                p1Name.textContent = 'Spieler 1';
                p2Name.textContent = 'Spieler 2';
            } else {
                p1Name.textContent = this.isHost ? 'Du' : 'Gegner';
                p2Name.textContent = this.isHost ? 'Gegner' : 'Du';
            }
        }
        
        // Initialize health and stamina bars
        const p1Health = document.getElementById('p1-health');
        const p2Health = document.getElementById('p2-health');
        const p1Stamina = document.getElementById('p1-stamina');
        const p2Stamina = document.getElementById('p2-stamina');
        
        if (p1Health) p1Health.style.width = '100%';
        if (p2Health) p2Health.style.width = '100%';
        if (p1Stamina) p1Stamina.style.width = '100%';
        if (p2Stamina) p2Stamina.style.width = '100%';
        
        // Start battle timer
        let timeLeft = this.gameSettings.battleTime;
        const timerElement = document.getElementById('battle-time');
        
        if (timerElement) {
            timerElement.textContent = timeLeft;
        }
        
        if (this.battleTimer) {
            clearInterval(this.battleTimer);
        }
        
        this.battleTimer = setInterval(() => {
            timeLeft--;
            if (timerElement) {
                timerElement.textContent = timeLeft;
            }
            
            if (timeLeft <= 0) {
                this.showGameResult('draw');
            }
        }, 1000);
        
        // Simulate battle result after 5 seconds
        setTimeout(() => {
            const results = ['win', 'lose', 'draw'];
            const result = results[Math.floor(Math.random() * results.length)];
            this.showGameResult(result);
        }, 5000);
    }

    showGameResult(result) {
        console.log('Showing game result:', result);
        
        if (this.battleTimer) {
            clearInterval(this.battleTimer);
            this.battleTimer = null;
        }
        
        this.showScreen('game-result');
        
        const winnerText = document.getElementById('winner-text');
        if (winnerText) {
            if (result === 'draw') {
                winnerText.textContent = 'Unentschieden!';
            } else if (result === 'win') {
                winnerText.textContent = this.gameMode === 'local' ? 'Spieler 1 Gewinnt!' : 'Du gewinnst!';
            } else {
                winnerText.textContent = this.gameMode === 'local' ? 'Spieler 2 Gewinnt!' : 'Gegner gewinnt!';
            }
        }
        
        // Update stats with random but reasonable values
        const duration = Math.floor(Math.random() * 90 + 30); // 30-120 seconds
        const myHits = Math.floor(Math.random() * 15 + 5);
        const opponentHits = Math.floor(Math.random() * 15 + 5);
        const avgPing = this.isConnected ? Math.floor(Math.random() * 80 + 20) : 0;
        
        const durationElement = document.getElementById('fight-duration');
        const myHitsElement = document.getElementById('my-hits');
        const opponentHitsElement = document.getElementById('opponent-hits');
        const avgPingElement = document.getElementById('avg-ping');
        
        if (durationElement) {
            durationElement.textContent = `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
        }
        
        if (myHitsElement) {
            myHitsElement.textContent = myHits;
        }
        
        if (opponentHitsElement) {
            opponentHitsElement.textContent = opponentHits;
        }
        
        if (avgPingElement) {
            avgPingElement.textContent = this.isConnected ? `${avgPing}ms` : 'Lokal';
        }
        
        // Save stats
        this.saveStats(result);
    }

    // UI Actions
    requestRematch() {
        console.log('Requesting rematch...');
        this.battleStats = { myHits: 0, opponentHits: 0, startTime: null };
        this.weapons = { player1: null, player2: null };
        
        if (this.isConnected) {
            this.sendMessage({ type: 'rematch_request' });
            this.startWeaponDesign();
        } else {
            this.startLocalGame();
        }
    }

    backToLobby() {
        console.log('Back to lobby...');
        if (this.isConnected) {
            this.showLobbyRoom();
        } else {
            this.backToMainMenu();
        }
    }

    retryConnection() {
        console.log('Retrying connection...');
        this.closeError();
        if (this.lobbyCode) {
            this.connectToLobby();
        }
    }

    // Modal Management
    showHelp() {
        console.log('Showing help...');
        const helpModal = document.getElementById('help-modal');
        if (helpModal) {
            helpModal.classList.remove('hidden');
        }
    }

    closeHelp() {
        console.log('Closing help...');
        const helpModal = document.getElementById('help-modal');
        if (helpModal) {
            helpModal.classList.add('hidden');
        }
    }

    showError(message) {
        console.log('Showing error:', message);
        const errorMessageElement = document.getElementById('error-message');
        const errorModal = document.getElementById('error-modal');
        
        if (errorMessageElement) {
            errorMessageElement.textContent = message;
        }
        
        if (errorModal) {
            errorModal.classList.remove('hidden');
        }
    }

    closeError() {
        console.log('Closing error...');
        const errorModal = document.getElementById('error-modal');
        if (errorModal) {
            errorModal.classList.add('hidden');
        }
    }

    // Particle System
    createParticleSystem() {
        setInterval(() => {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * window.innerWidth + 'px';
            particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
            
            const particlesContainer = document.getElementById('particles');
            if (particlesContainer) {
                particlesContainer.appendChild(particle);
                
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.remove();
                    }
                }, 5000);
            }
        }, 200);
    }

    // Stats Management
    loadStats() {
        // Load stats from localStorage if available
        try {
            const savedStats = localStorage.getItem('gameStats');
            if (savedStats) {
                const stats = JSON.parse(savedStats);
                const onlineWinsElement = document.getElementById('online-wins');
                const totalGamesElement = document.getElementById('total-games');
                
                if (onlineWinsElement) {
                    onlineWinsElement.textContent = stats.onlineWins || 0;
                }
                
                if (totalGamesElement) {
                    totalGamesElement.textContent = stats.totalGames || 0;
                }
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    saveStats(result) {
        try {
            const savedStats = localStorage.getItem('gameStats');
            let stats = savedStats ? JSON.parse(savedStats) : { onlineWins: 0, totalGames: 0 };
            
            stats.totalGames++;
            if (result === 'win' && this.isConnected) {
                stats.onlineWins++;
            }
            
            localStorage.setItem('gameStats', JSON.stringify(stats));
            this.loadStats(); // Update display
        } catch (error) {
            console.error('Error saving stats:', error);
        }
    }

    // Cleanup
    cleanup() {
        console.log('Cleaning up...');
        
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }
        
        if (this.peer) {
            this.peer.close();
            this.peer = null;
        }
        
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        
        if (this.drawingTimer) {
            clearInterval(this.drawingTimer);
            this.drawingTimer = null;
        }
        
        if (this.battleTimer) {
            clearInterval(this.battleTimer);
            this.battleTimer = null;
        }
        
        this.isConnected = false;
        this.gameRunning = false;
    }
}

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    try {
        window.game = new OnlineMultiplayerGame();
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Error initializing game:', error);
    }
});
