// Online Multiplayer Strichmännchen Kampf Arena - Text-Based Weapon System
class TextBasedMultiplayerGame {
    constructor() {
        // Game State
        this.currentScreen = 'main-menu';
        this.gameMode = 'menu'; // menu, lobby, description, battle
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
            descriptionTime: 30,
            battleTime: 120,
            healthPerPlayer: 100,
            gravity: 0.8
        };
        
        // Weapon Generation Data
        this.weaponData = {
            weaponTypes: {
                sword: {name: "Schwert", baseSpeed: 70, baseDamage: 60, baseRange: 40, icon: "⚔️"},
                axe: {name: "Streitaxt", baseSpeed: 40, baseDamage: 80, baseRange: 35, icon: "🪓"},
                spear: {name: "Speer", baseSpeed: 60, baseDamage: 50, baseRange: 70, icon: "🗡️"},
                pistol: {name: "Pistole", baseSpeed: 90, baseDamage: 70, baseRange: 85, icon: "🔫"},
                rifle: {name: "Gewehr", baseSpeed: 50, baseDamage: 90, baseRange: 95, icon: "🏹"},
                bow: {name: "Bogen", baseSpeed: 50, baseDamage: 55, baseRange: 90, icon: "🏹"},
                hammer: {name: "Kriegshammer", baseSpeed: 30, baseDamage: 95, baseRange: 30, icon: "🔨"},
                dagger: {name: "Dolch", baseSpeed: 95, baseDamage: 35, baseRange: 25, icon: "🗡️"},
                laser: {name: "Laserkanone", baseSpeed: 95, baseDamage: 80, baseRange: 90, icon: "⚡"},
                wand: {name: "Zauberstab", baseSpeed: 60, baseDamage: 75, baseRange: 80, icon: "🪄"}
            },
            materials: {
                steel: {name: "Stahl", multiplier: 1.1, color: "#C0C0C0"},
                gold: {name: "Gold", multiplier: 1.2, color: "#FFD700"},
                diamond: {name: "Diamant", multiplier: 1.4, color: "#B9F2FF"},
                wood: {name: "Holz", multiplier: 0.9, color: "#8B4513"},
                magic: {name: "Magie", multiplier: 1.3, color: "#9932CC"},
                plasma: {name: "Plasma", multiplier: 1.5, color: "#00FFFF"},
                crystal: {name: "Kristall", multiplier: 1.2, color: "#FF69B4"}
            },
            effects: {
                fire: {name: "Feuer", damageBuff: 15, color: "#FF4500", icon: "🔥"},
                ice: {name: "Eis", speedBuff: 10, color: "#87CEEB", icon: "❄️"},
                lightning: {name: "Blitz", speedBuff: 20, color: "#FFFF00", icon: "⚡"},
                poison: {name: "Gift", damageBuff: 10, color: "#9ACD32", icon: "☠️"},
                heal: {name: "Heilung", special: "heal", color: "#32CD32", icon: "💚"},
                explosive: {name: "Explosiv", damageBuff: 25, color: "#FF6347", icon: "💥"}
            },
            keywordPatterns: {
                weaponTypes: {
                    "schwert|sword|blade|klinge": "sword",
                    "axt|axe|beil": "axe",
                    "speer|lance|pike|lanze": "spear", 
                    "pistol|pistole|gun|schuss": "pistol",
                    "gewehr|rifle|sniper": "rifle",
                    "bogen|bow|pfeil": "bow",
                    "hammer|mace|keule": "hammer",
                    "dolch|dagger|messer": "dagger",
                    "laser|beam|strahl": "laser",
                    "stab|wand|zauberstab": "wand"
                },
                materials: {
                    "stahl|steel|eisen": "steel",
                    "gold|golden": "gold",
                    "diamant|diamond": "diamond",
                    "holz|wood": "wood",
                    "magie|magic|magisch": "magic",
                    "laser|plasma": "plasma",
                    "kristall|crystal": "crystal"
                },
                effects: {
                    "feuer|fire|flamm": "fire",
                    "eis|ice|frost": "ice", 
                    "blitz|lightning|elektro": "lightning",
                    "gift|poison|toxic": "poison",
                    "heil|heal|leben": "heal",
                    "explosiv|bomb|boom": "explosive"
                }
            },
            inspirationExamples: [
                "Explosive Plasmaaxt mit Blitzeffekt",
                "Magischer Diamantbogen der Heilung",
                "Giftiger Stahldolch mit Eisschaden",
                "Flammendes Kristallschwert",
                "Goldener Zauberstab des Feuers",
                "Eisiger Kriegshammer aus Diamant"
            ]
        };
        
        // Physics Engine
        this.engine = null;
        this.world = null;
        this.players = {};
        this.platforms = [];
        this.gameRunning = false;

        // Game Context
        this.gameCtx = null;

        // Timers
        this.descriptionTimer = null;
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
        console.log('Initializing text-based weapon game...');
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
        
        // Main Menu
        this.bindButton('create-lobby-btn', () => this.createLobby());
        this.bindButton('join-lobby-btn', () => this.showJoinLobby());
        this.bindButton('local-game-btn', () => this.startLocalGame());
        this.bindButton('help-btn', () => this.showHelp());

        // Lobby Creation
        this.bindButton('copy-code', () => this.copyLobbyCode());
        this.bindButton('cancel-lobby', () => this.cancelLobby());

        // Lobby Joining
        this.bindButton('connect-lobby', () => this.connectToLobby());
        this.bindButton('back-to-menu', () => this.backToMainMenu());

        // Lobby Room
        this.bindButton('start-game', () => this.startOnlineGame());
        this.bindButton('leave-lobby', () => this.leaveLobby());
        this.bindButton('send-chat', () => this.sendChatMessage());
        
        const chatMessageInput = document.getElementById('chat-message');
        if (chatMessageInput) {
            chatMessageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendChatMessage();
            });
        }

        // Weapon Description
        this.bindButton('generate-weapon', () => this.generateWeapon());
        this.bindButton('back-from-description', () => this.handleBackFromDescription());
        this.bindButton('random-weapon', () => this.generateRandomWeaponDescription());

        // Setup text input
        this.setupTextInput();

        // Setup example tags
        this.setupExampleTags();

        // AI Analysis
        this.bindButton('continue-to-battle', () => this.startBattle());
        this.bindButton('back-from-analysis', () => this.handleBackFromAnalysis());

        // Battle Results
        this.bindButton('rematch-btn', () => this.requestRematch());
        this.bindButton('new-game-btn', () => this.backToLobby());
        this.bindButton('main-menu-btn', () => this.backToMainMenu());

        // Modals
        this.bindButton('close-help', () => this.closeHelp());
        this.bindButton('retry-connection', () => this.retryConnection());
        this.bindButton('close-error', () => this.closeError());

        // Keyboard Events
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === ' ' || e.key === 'Enter') e.preventDefault();
            
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        window.addEventListener('beforeunload', () => this.cleanup());
        
        console.log('Event listeners setup complete');
    }

    bindButton(id, handler) {
        const button = document.getElementById(id);
        if (button) {
            button.removeEventListener('click', handler);
            button.addEventListener('click', handler);
            console.log(`Bound handler for button: ${id}`);
        } else {
            console.warn(`Button not found: ${id}`);
        }
    }

    setupTextInput() {
        const textInput = document.getElementById('weapon-text');
        const charCount = document.getElementById('char-count');
        
        if (textInput && charCount) {
            textInput.addEventListener('input', (e) => {
                const length = e.target.value.length;
                charCount.textContent = length;
                
                if (length > 200) {
                    charCount.classList.add('over-limit');
                } else {
                    charCount.classList.remove('over-limit');
                }
            });
        }
    }

    setupExampleTags() {
        const exampleTags = document.getElementById('example-tags');
        if (exampleTags) {
            exampleTags.addEventListener('click', (e) => {
                if (e.target.classList.contains('tag')) {
                    const text = e.target.getAttribute('data-text');
                    const textInput = document.getElementById('weapon-text');
                    if (textInput && text) {
                        textInput.value = text;
                        textInput.dispatchEvent(new Event('input'));
                        textInput.focus();
                    }
                }
            });
        }
    }

    handleEscapeKey() {
        console.log('Escape key pressed, current screen:', this.currentScreen);
        
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
        
        switch (this.currentScreen) {
            case 'create-lobby':
            case 'join-lobby':
                this.backToMainMenu();
                break;
            case 'lobby-room':
                this.leaveLobby();
                break;
            case 'weapon-description':
                this.handleBackFromDescription();
                break;
            case 'ai-analysis':
                this.handleBackFromAnalysis();
                break;
            case 'battle':
                break;
            case 'game-result':
                this.backToMainMenu();
                break;
        }
    }

    handleBackFromDescription() {
        if (this.descriptionTimer) {
            clearInterval(this.descriptionTimer);
            this.descriptionTimer = null;
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
        
        this.addChatMessage('system', 'Verbunden! Beschreibt eure Waffen mit Text!');
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
                this.showCopiedFeedback();
            }).catch(err => {
                console.error('Failed to copy: ', err);
                this.showCopiedFeedback();
            });
        } else {
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
        return true;
    }

    startHeartbeat() {
        console.log('Starting heartbeat...');
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
        this.startWeaponDescription();
    }

    startLocalGame() {
        console.log('Starting local game...');
        this.gameMode = 'local';
        this.isConnected = false;
        this.startWeaponDescription();
    }

    startWeaponDescription() {
        console.log('Starting weapon description phase...');
        this.gameMode = 'description';
        this.currentPlayer = 1;
        this.showScreen('weapon-description');
        
        const titleElement = document.getElementById('current-player-title');
        if (titleElement) {
            if (this.gameMode === 'local') {
                titleElement.textContent = 'Spieler 1 - Beschreibe deine Waffe!';
            } else {
                titleElement.textContent = 'Du - Beschreibe deine Waffe!';
            }
        }
        
        this.clearTextInput();
        this.startDescriptionTimer();
        
        const syncText = document.getElementById('sync-text');
        const opponentProgress = document.getElementById('opponent-progress');
        
        if (syncText) {
            syncText.textContent = this.isConnected ? 'Synchronisiert' : 'Lokal';
        }
        
        if (opponentProgress) {
            opponentProgress.textContent = this.isConnected ? 'Wartet...' : 'Lokales Spiel';
        }
    }

    clearTextInput() {
        const textInput = document.getElementById('weapon-text');
        const charCount = document.getElementById('char-count');
        
        if (textInput) {
            textInput.value = '';
            textInput.focus();
        }
        
        if (charCount) {
            charCount.textContent = '0';
            charCount.classList.remove('over-limit');
        }
    }

    startDescriptionTimer() {
        console.log('Starting description timer...');
        let timeLeft = this.gameSettings.descriptionTime;
        const timerElement = document.getElementById('timer');
        
        if (timerElement) {
            timerElement.textContent = timeLeft;
        }
        
        if (this.descriptionTimer) {
            clearInterval(this.descriptionTimer);
        }
        
        this.descriptionTimer = setInterval(() => {
            timeLeft--;
            if (timerElement) {
                timerElement.textContent = timeLeft;
            }
            
            const timerCircle = document.querySelector('.timer-circle');
            if (timerCircle) {
                const progress = ((this.gameSettings.descriptionTime - timeLeft) / this.gameSettings.descriptionTime) * 360;
                timerCircle.style.background = `conic-gradient(var(--color-primary) ${progress}deg, transparent ${progress}deg)`;
            }
            
            if (timeLeft <= 0) {
                console.log('Description timer expired, generating weapon automatically');
                this.generateWeapon();
            }
        }, 1000);
    }

    generateRandomWeaponDescription() {
        const examples = this.weaponData.inspirationExamples;
        const randomExample = examples[Math.floor(Math.random() * examples.length)];
        
        const textInput = document.getElementById('weapon-text');
        if (textInput) {
            textInput.value = randomExample;
            textInput.dispatchEvent(new Event('input'));
        }
    }

    generateWeapon() {
        console.log('Generating weapon for player', this.currentPlayer);
        
        if (this.descriptionTimer) {
            clearInterval(this.descriptionTimer);
            this.descriptionTimer = null;
        }

        const textInput = document.getElementById('weapon-text');
        const description = textInput ? textInput.value.trim() : '';
        
        if (description.length < 3) {
            this.showError('Beschreibung zu kurz! Mindestens 3 Zeichen erforderlich.');
            return;
        }

        const weaponData = this.analyzeWeaponText(description);
        this.weapons[`player${this.currentPlayer}`] = weaponData;
        
        console.log(`Weapon data for player ${this.currentPlayer}:`, weaponData);
        
        if (this.gameMode === 'local') {
            if (this.currentPlayer === 1) {
                this.currentPlayer = 2;
                
                const titleElement = document.getElementById('current-player-title');
                if (titleElement) {
                    titleElement.textContent = 'Spieler 2 - Beschreibe deine Waffe!';
                }
                
                this.clearTextInput();
                this.startDescriptionTimer();
                console.log('Switched to player 2 in local mode');
            } else {
                console.log('Both players finished describing in local mode');
                this.showAIAnalysis();
            }
        } else {
            if (!this.weapons.player2) {
                this.weapons.player2 = this.createDummyWeaponData();
            }
            console.log('Online mode - proceeding to analysis');
            this.showAIAnalysis();
        }
    }

    createDummyWeaponData() {
        console.log('Creating dummy weapon data');
        return this.analyzeWeaponText("Explosive Plasmaaxt mit Blitzeffekt");
    }

    // AI Weapon Text Analysis
    analyzeWeaponText(description) {
        console.log('Analyzing weapon text:', description);
        
        const lowerDescription = description.toLowerCase();
        
        // Detect weapon type
        let detectedType = 'sword'; // default
        for (const [pattern, type] of Object.entries(this.weaponData.keywordPatterns.weaponTypes)) {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(description)) {
                detectedType = type;
                break;
            }
        }
        
        // Detect material
        let detectedMaterial = null;
        for (const [pattern, material] of Object.entries(this.weaponData.keywordPatterns.materials)) {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(description)) {
                detectedMaterial = material;
                break;
            }
        }
        
        // Detect effects
        let detectedEffects = [];
        for (const [pattern, effect] of Object.entries(this.weaponData.keywordPatterns.effects)) {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(description)) {
                detectedEffects.push(effect);
            }
        }
        
        // Calculate stats
        const baseWeapon = this.weaponData.weaponTypes[detectedType];
        let finalDamage = baseWeapon.baseDamage;
        let finalSpeed = baseWeapon.baseSpeed;
        let finalRange = baseWeapon.baseRange;
        
        // Apply material bonus
        if (detectedMaterial) {
            const material = this.weaponData.materials[detectedMaterial];
            finalDamage = Math.round(finalDamage * material.multiplier);
            finalSpeed = Math.round(finalSpeed * material.multiplier);
            finalRange = Math.round(finalRange * material.multiplier);
        }
        
        // Apply effect bonuses
        for (const effectKey of detectedEffects) {
            const effect = this.weaponData.effects[effectKey];
            if (effect.damageBuff) {
                finalDamage += effect.damageBuff;
            }
            if (effect.speedBuff) {
                finalSpeed += effect.speedBuff;
            }
        }
        
        // Length bonus (creativity bonus)
        const lengthBonus = Math.min(1.2, 1 + (description.length / 500));
        finalDamage = Math.round(finalDamage * lengthBonus);
        
        // Creativity bonus for rare combinations
        if (detectedMaterial && detectedEffects.length > 0) {
            finalDamage += 5;
            finalSpeed += 5;
        }
        
        // Cap values
        finalDamage = Math.min(100, Math.max(10, finalDamage));
        finalSpeed = Math.min(100, Math.max(10, finalSpeed));
        finalRange = Math.min(100, Math.max(10, finalRange));
        
        // Generate insights
        const insights = [];
        insights.push(`✓ Waffentyp: ${baseWeapon.name} erkannt`);
        
        if (detectedMaterial) {
            const materialData = this.weaponData.materials[detectedMaterial];
            const bonus = Math.round((materialData.multiplier - 1) * 100);
            insights.push(`✓ Material: ${materialData.name} (+${bonus}% Bonus)`);
        }
        
        if (detectedEffects.length > 0) {
            const effectNames = detectedEffects.map(e => this.weaponData.effects[e].name);
            insights.push(`✓ Effekte: ${effectNames.join(', ')} entdeckt`);
        }
        
        if (description.length > 50) {
            insights.push(`✓ Längen-Bonus: +${Math.round((lengthBonus - 1) * 100)}%`);
        }
        
        if (detectedMaterial && detectedEffects.length > 0) {
            insights.push(`✓ Kreativitäts-Bonus: +10%`);
        }
        
        const result = {
            description: description,
            type: detectedType,
            typeName: baseWeapon.name,
            material: detectedMaterial,
            materialName: detectedMaterial ? this.weaponData.materials[detectedMaterial].name : 'Standard',
            effects: detectedEffects,
            damage: finalDamage,
            speed: finalSpeed,
            range: finalRange,
            icon: baseWeapon.icon,
            insights: insights
        };

        console.log('Weapon analysis result:', result);
        return result;
    }

    showAIAnalysis() {
        console.log('Showing AI analysis...');
        this.showScreen('ai-analysis');
        
        setTimeout(() => {
            this.displayWeaponAnalysis();
        }, 100);
    }

    displayWeaponAnalysis() {
        console.log('Displaying weapon analysis...');
        
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
        
        // Update weapon name
        const weaponNameElement = document.getElementById(`${prefix}-weapon-name`);
        if (weaponNameElement) {
            weaponNameElement.textContent = this.generateWeaponName(weapon);
        }
        
        // Update description
        const descriptionElement = document.getElementById(`${prefix}-weapon-description`);
        if (descriptionElement) {
            descriptionElement.textContent = `"${weapon.description}"`;
        }
        
        // Update weapon icon
        const weaponIconElement = document.getElementById(`${prefix}-weapon-icon`);
        if (weaponIconElement) {
            weaponIconElement.textContent = weapon.icon;
        }
        
        // Update weapon effects
        const weaponEffectsElement = document.getElementById(`${prefix}-weapon-effects`);
        if (weaponEffectsElement) {
            weaponEffectsElement.innerHTML = '';
            weapon.effects.forEach(effectKey => {
                const effect = this.weaponData.effects[effectKey];
                const effectSpan = document.createElement('span');
                effectSpan.className = 'weapon-effect';
                effectSpan.textContent = effect.icon;
                effectSpan.style.color = effect.color;
                weaponEffectsElement.appendChild(effectSpan);
            });
        }
        
        // Update stats
        const weaponTypeElement = document.getElementById(`${prefix}-weapon-type`);
        if (weaponTypeElement) {
            weaponTypeElement.textContent = weapon.typeName;
        }
        
        const weaponMaterialElement = document.getElementById(`${prefix}-weapon-material`);
        if (weaponMaterialElement) {
            weaponMaterialElement.textContent = weapon.materialName;
        }
        
        this.animateStatBar(`${prefix}-damage-bar`, `${prefix}-damage-value`, weapon.damage);
        this.animateStatBar(`${prefix}-speed-bar`, `${prefix}-speed-value`, weapon.speed);
        this.animateStatBar(`${prefix}-range-bar`, `${prefix}-range-value`, weapon.range);
        
        // Update AI insights
        const insightsElement = document.getElementById(`${prefix}-ai-insights`);
        if (insightsElement) {
            insightsElement.innerHTML = '';
            weapon.insights.forEach(insight => {
                const li = document.createElement('li');
                li.textContent = insight;
                insightsElement.appendChild(li);
            });
        }
    }

    generateWeaponName(weapon) {
        let name = '';
        
        if (weapon.effects.length > 0) {
            const effectNames = weapon.effects.map(e => this.weaponData.effects[e].name);
            name += effectNames[0] + 'es ';
        }
        
        if (weapon.material) {
            name += this.weaponData.materials[weapon.material].name + '-';
        }
        
        name += weapon.typeName;
        
        return name;
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
        
        const p1Health = document.getElementById('p1-health');
        const p2Health = document.getElementById('p2-health');
        const p1Stamina = document.getElementById('p1-stamina');
        const p2Stamina = document.getElementById('p2-stamina');
        
        if (p1Health) p1Health.style.width = '100%';
        if (p2Health) p2Health.style.width = '100%';
        if (p1Stamina) p1Stamina.style.width = '100%';
        if (p2Stamina) p2Stamina.style.width = '100%';
        
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
        
        // Show best weapon
        const bestWeaponElement = document.getElementById('best-weapon');
        if (bestWeaponElement && this.weapons.player1) {
            const weaponEmoji = bestWeaponElement.querySelector('.weapon-emoji');
            const weaponTitle = bestWeaponElement.querySelector('.weapon-title');
            
            if (weaponEmoji) weaponEmoji.textContent = this.weapons.player1.icon;
            if (weaponTitle) weaponTitle.textContent = this.generateWeaponName(this.weapons.player1);
        }
        
        const duration = Math.floor(Math.random() * 90 + 30);
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
        
        this.saveStats(result);
    }

    // UI Actions
    requestRematch() {
        console.log('Requesting rematch...');
        this.battleStats = { myHits: 0, opponentHits: 0, startTime: null };
        this.weapons = { player1: null, player2: null };
        
        if (this.isConnected) {
            this.sendMessage({ type: 'rematch_request' });
            this.startWeaponDescription();
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
            this.loadStats();
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
        
        if (this.descriptionTimer) {
            clearInterval(this.descriptionTimer);
            this.descriptionTimer = null;
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
    console.log('DOM loaded, initializing text-based weapon game...');
    try {
        window.game = new TextBasedMultiplayerGame();
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Error initializing game:', error);
    }
});
