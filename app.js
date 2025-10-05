// Strichmännchen Kampf Arena - Hauptspiel-Logik
class StickmanBattleGame {
    constructor() {
        this.currentScreen = 'main-menu';
        this.currentPlayer = 1;
        this.weapons = { player1: null, player2: null };
        this.gameSettings = {
            drawingTime: 30,
            roundTime: 120,
            healthPerPlayer: 100,
            gravity: 0.8
        };
        this.gameStats = {
            totalGames: 0,
            p1Wins: 0,
            p2Wins: 0
        };
        this.battleStats = {
            p1Hits: 0,
            p2Hits: 0,
            startTime: null
        };

        // Matter.js Engine Setup
        this.engine = null;
        this.world = null;
        this.render = null;
        this.players = {};
        this.platforms = [];
        this.selectedArena = 0;

        // Timers
        this.drawingTimer = null;
        this.battleTimer = null;

        // Canvas Contexte
        this.drawingCtx = null;
        this.gameCtx = null;

        // Weapon-KI Daten
        this.weaponTypes = {
            sword: { baseSpeed: 70, baseDamage: 60, baseRange: 40, pattern: 'long_thin' },
            axe: { baseSpeed: 40, baseDamage: 80, baseRange: 35, pattern: 'wide_heavy' },
            spear: { baseSpeed: 60, baseDamage: 50, baseRange: 70, pattern: 'very_long' },
            gun: { baseSpeed: 90, baseDamage: 70, baseRange: 85, pattern: 'rectangular' },
            bow: { baseSpeed: 50, baseDamage: 55, baseRange: 90, pattern: 'curved' },
            hammer: { baseSpeed: 30, baseDamage: 95, baseRange: 30, pattern: 'heavy_top' },
            knife: { baseSpeed: 95, baseDamage: 35, baseRange: 25, pattern: 'small_sharp' }
        };

        this.arenas = [
            { name: "Klassische Arena", platforms: 3, hazards: 0 },
            { name: "Gefährlicher Turm", platforms: 5, hazards: 2 },
            { name: "Schwebende Inseln", platforms: 7, hazards: 1 },
            { name: "Lava-Grube", platforms: 4, hazards: 3 }
        ];

        this.controls = {
            player1: { left: 'a', right: 'd', jump: ' ', attack: 'f' },
            player2: { left: 'ArrowLeft', right: 'ArrowRight', jump: 'Enter', attack: 'Shift' }
        };

        this.keys = {};
        this.particles = [];
        this.gameRunning = false;

        this.init();
    }

    init() {
        this.loadGameStats();
        this.setupEventListeners();
        this.createParticleSystem();
        this.showScreen('main-menu');
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Hauptmenü
        document.getElementById('start-game').addEventListener('click', () => this.startGame());
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettings());
        document.getElementById('help-btn').addEventListener('click', () => this.showHelp());

        // Waffen-Design
        document.getElementById('clear-canvas').addEventListener('click', () => this.clearCanvas());
        document.getElementById('finish-drawing').addEventListener('click', () => this.finishDrawing());

        // KI-Analyse
        document.getElementById('continue-to-arena').addEventListener('click', () => this.showArenaSelection());

        // Arena-Auswahl
        document.querySelectorAll('.arena-card').forEach((card, index) => {
            card.addEventListener('click', () => this.selectArena(index));
        });

        // Kampf
        document.getElementById('pause-game').addEventListener('click', () => this.pauseGame());

        // Ergebnis
        document.getElementById('rematch-btn').addEventListener('click', () => this.startGame());
        document.getElementById('main-menu-btn').addEventListener('click', () => this.showScreen('main-menu'));

        // Modals
        document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());
        document.getElementById('close-settings').addEventListener('click', () => this.closeSettings());
        document.getElementById('close-help').addEventListener('click', () => this.closeHelp());

        // Einstellungen Slider
        document.getElementById('drawing-time').addEventListener('input', (e) => {
            document.getElementById('drawing-time-value').textContent = e.target.value + 's';
        });
        document.getElementById('round-time').addEventListener('input', (e) => {
            document.getElementById('round-time-value').textContent = e.target.value + 's';
        });
        document.getElementById('player-health').addEventListener('input', (e) => {
            document.getElementById('player-health-value').textContent = e.target.value;
        });

        // Tastatur-Events
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === ' ' || e.key === 'Enter') e.preventDefault();
        });
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Canvas Maus-Events für Zeichnen
        this.setupDrawingCanvas();
    }

    setupDrawingCanvas() {
        const canvas = document.getElementById('drawing-canvas');
        this.drawingCtx = canvas.getContext('2d');
        let isDrawing = false;
        let lastX = 0, lastY = 0;

        canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            [lastX, lastY] = [e.offsetX, e.offsetY];
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            this.drawingCtx.beginPath();
            this.drawingCtx.moveTo(lastX, lastY);
            this.drawingCtx.lineTo(e.offsetX, e.offsetY);
            this.drawingCtx.strokeStyle = '#32a087';
            this.drawingCtx.lineWidth = 3;
            this.drawingCtx.lineCap = 'round';
            this.drawingCtx.stroke();
            [lastX, lastY] = [e.offsetX, e.offsetY];
        });

        canvas.addEventListener('mouseup', () => isDrawing = false);
        canvas.addEventListener('mouseout', () => isDrawing = false);

        // Touch-Support
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            isDrawing = true;
            [lastX, lastY] = [touch.clientX - rect.left, touch.clientY - rect.top];
        });

        canvas.addEventListener('touchmove', (e) => {
            if (!isDrawing) return;
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            this.drawingCtx.beginPath();
            this.drawingCtx.moveTo(lastX, lastY);
            this.drawingCtx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
            this.drawingCtx.strokeStyle = '#32a087';
            this.drawingCtx.lineWidth = 3;
            this.drawingCtx.lineCap = 'round';
            this.drawingCtx.stroke();
            [lastX, lastY] = [touch.clientX - rect.left, touch.clientY - rect.top];
        });

        canvas.addEventListener('touchend', () => isDrawing = false);
    }

    // Screen Management
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
        this.currentScreen = screenId;
    }

    // Game Flow
    startGame() {
        this.currentPlayer = 1;
        this.weapons = { player1: null, player2: null };
        this.battleStats = { p1Hits: 0, p2Hits: 0, startTime: null };
        this.gameRunning = false;
        this.showWeaponDesign();
    }

    showWeaponDesign() {
        this.showScreen('weapon-design');
        document.getElementById('current-player-title').textContent = 
            `Spieler ${this.currentPlayer} - Zeichne deine Waffe!`;
        this.clearCanvas();
        this.startDrawingTimer();
    }

    startDrawingTimer() {
        let timeLeft = this.gameSettings.drawingTime;
        const timerElement = document.getElementById('timer');
        
        timerElement.textContent = timeLeft;
        
        this.drawingTimer = setInterval(() => {
            timeLeft--;
            timerElement.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                this.finishDrawing();
            }
        }, 1000);
    }

    clearCanvas() {
        const canvas = document.getElementById('drawing-canvas');
        this.drawingCtx.clearRect(0, 0, canvas.width, canvas.height);
        // Hintergrund setzen
        this.drawingCtx.fillStyle = '#f8f8f8';
        this.drawingCtx.fillRect(0, 0, canvas.width, canvas.height);
    }

    finishDrawing() {
        if (this.drawingTimer) {
            clearInterval(this.drawingTimer);
            this.drawingTimer = null;
        }

        // Zeichnung als Waffe speichern
        const canvas = document.getElementById('drawing-canvas');
        const weaponData = this.analyzeDrawing(canvas);
        this.weapons[`player${this.currentPlayer}`] = weaponData;

        if (this.currentPlayer === 1) {
            this.currentPlayer = 2;
            this.showWeaponDesign();
        } else {
            this.showAIAnalysis();
        }
    }

    // KI Waffen-Analyse
    analyzeDrawing(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Zeichnung analysieren
        let drawnPixels = [];
        for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] > 0 && !(pixels[i] === 248 && pixels[i+1] === 248 && pixels[i+2] === 248)) { // Nicht der Hintergrund
                const x = (i / 4) % canvas.width;
                const y = Math.floor((i / 4) / canvas.width);
                drawnPixels.push({ x, y });
            }
        }

        if (drawnPixels.length === 0) {
            // Fallback für leere Zeichnung
            return {
                type: 'sword',
                damage: 50,
                speed: 50,
                range: 50,
                imageData: ctx.getImageData(0, 0, canvas.width, canvas.height)
            };
        }

        // Bounding Box berechnen
        const minX = Math.min(...drawnPixels.map(p => p.x));
        const maxX = Math.max(...drawnPixels.map(p => p.x));
        const minY = Math.min(...drawnPixels.map(p => p.y));
        const maxY = Math.max(...drawnPixels.map(p => p.y));

        const width = maxX - minX;
        const height = maxY - minY;
        const aspectRatio = width / height;
        const complexity = drawnPixels.length;
        const area = width * height;

        // Waffentyp bestimmen
        let weaponType = this.determineWeaponType(aspectRatio, complexity, area, drawnPixels);
        let baseStats = this.weaponTypes[weaponType];

        // Modifikationen basierend auf Zeichnung
        const sizeModifier = Math.min(2, Math.max(0.5, area / 10000));
        const complexityModifier = Math.min(1.5, Math.max(0.7, complexity / 1000));

        const damage = Math.round(baseStats.baseDamage * sizeModifier * complexityModifier);
        const speed = Math.round(baseStats.baseSpeed * (2 - sizeModifier) * complexityModifier);
        const range = Math.round(baseStats.baseRange * (aspectRatio > 2 ? 1.3 : 1));

        return {
            type: weaponType,
            damage: Math.min(100, Math.max(10, damage)),
            speed: Math.min(100, Math.max(10, speed)),
            range: Math.min(100, Math.max(10, range)),
            imageData: ctx.getImageData(0, 0, canvas.width, canvas.height)
        };
    }

    determineWeaponType(aspectRatio, complexity, area, pixels) {
        // Regelbasierte Waffentyp-Erkennung
        if (aspectRatio > 4) return 'spear';
        if (aspectRatio > 2.5 && complexity < 500) return 'sword';
        if (aspectRatio < 0.8 && area > 8000) return 'hammer';
        if (aspectRatio > 2 && complexity > 800) return 'gun';
        if (aspectRatio > 1.5 && this.hasCurvedPattern(pixels)) return 'bow';
        if (aspectRatio < 1.2 && area > 5000) return 'axe';
        if (area < 3000) return 'knife';
        
        return 'sword'; // Fallback
    }

    hasCurvedPattern(pixels) {
        // Vereinfachte Kurven-Erkennung
        if (pixels.length < 100) return false;
        
        const sortedPixels = pixels.sort((a, b) => a.x - b.x);
        let curveChanges = 0;
        let lastDirection = 0;
        
        for (let i = 1; i < sortedPixels.length - 1; i++) {
            const direction = sortedPixels[i + 1].y - sortedPixels[i].y;
            if (direction !== 0 && lastDirection !== 0 && Math.sign(direction) !== Math.sign(lastDirection)) {
                curveChanges++;
            }
            lastDirection = direction;
        }
        
        return curveChanges > pixels.length / 20;
    }

    showAIAnalysis() {
        this.showScreen('ai-analysis');
        this.displayWeaponAnalysis();
    }

    displayWeaponAnalysis() {
        // Spieler 1 Waffe anzeigen
        this.displayPlayerWeapon(1, this.weapons.player1);
        // Spieler 2 Waffe anzeigen
        this.displayPlayerWeapon(2, this.weapons.player2);
    }

    displayPlayerWeapon(playerNum, weapon) {
        const prefix = `p${playerNum}`;
        
        // Typ anzeigen
        document.getElementById(`${prefix}-weapon-type`).textContent = 
            this.getGermanWeaponName(weapon.type);
        
        // Stats anzeigen und animieren
        this.animateStatBar(`${prefix}-damage-bar`, `${prefix}-damage-value`, weapon.damage);
        this.animateStatBar(`${prefix}-speed-bar`, `${prefix}-speed-value`, weapon.speed);
        this.animateStatBar(`${prefix}-range-bar`, `${prefix}-range-value`, weapon.range);
        
        // Waffen-Vorschau zeichnen
        const preview = document.querySelector(`#player${playerNum}-weapon .weapon-preview`);
        const ctx = preview.getContext('2d');
        
        // Hintergrund
        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(0, 0, preview.width, preview.height);
        
        // Skalierte Waffe zeichnen
        const scale = Math.min(preview.width / 400, preview.height / 300);
        ctx.scale(scale, scale);
        ctx.putImageData(weapon.imageData, 0, 0);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    getGermanWeaponName(type) {
        const names = {
            sword: 'Schwert',
            axe: 'Axt',
            spear: 'Speer',
            gun: 'Gewehr',
            bow: 'Bogen',
            hammer: 'Hammer',
            knife: 'Messer'
        };
        return names[type] || 'Unbekannt';
    }

    animateStatBar(barId, valueId, value) {
        setTimeout(() => {
            const bar = document.getElementById(barId);
            const valueElement = document.getElementById(valueId);
            bar.style.width = `${value}%`;
            valueElement.textContent = value;
        }, 300);
    }

    // Arena System
    showArenaSelection() {
        this.showScreen('arena-selection');
    }

    selectArena(arenaIndex) {
        // Alte Auswahl entfernen
        document.querySelectorAll('.arena-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Neue Auswahl setzen
        document.querySelector(`[data-arena="${arenaIndex}"]`).classList.add('selected');
        this.selectedArena = arenaIndex;
        
        // Kurze Verzögerung, dann Kampf starten
        setTimeout(() => {
            this.startBattle();
        }, 500);
    }

    // Battle System
    startBattle() {
        this.showScreen('battle');
        this.setupPhysicsEngine();
        this.createArena();
        this.createPlayers();
        this.startBattleTimer();
        this.battleStats.startTime = Date.now();
        this.gameRunning = true;
        this.gameLoop();
    }

    setupPhysicsEngine() {
        // Matter.js Engine erstellen
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
        this.engine.world.gravity.y = this.gameSettings.gravity;

        // Render Setup
        const canvas = document.getElementById('game-canvas');
        this.gameCtx = canvas.getContext('2d');
    }

    createArena() {
        this.platforms = [];
        const arena = this.arenas[this.selectedArena];
        const canvasWidth = 1200;
        const canvasHeight = 600;

        // Boden
        const ground = Matter.Bodies.rectangle(canvasWidth / 2, canvasHeight - 20, canvasWidth, 40, {
            isStatic: true,
            label: 'ground'
        });
        Matter.World.add(this.world, ground);
        this.platforms.push(ground);

        // Wände
        const leftWall = Matter.Bodies.rectangle(-20, canvasHeight / 2, 40, canvasHeight, { isStatic: true });
        const rightWall = Matter.Bodies.rectangle(canvasWidth + 20, canvasHeight / 2, 40, canvasHeight, { isStatic: true });
        Matter.World.add(this.world, [leftWall, rightWall]);

        // Arena-spezifische Plattformen
        this.createArenaPlatforms(arena, canvasWidth, canvasHeight);
    }

    createArenaPlatforms(arena, width, height) {
        const platformCount = arena.platforms;
        
        for (let i = 0; i < platformCount - 1; i++) {
            const x = (width / (platformCount)) * (i + 1);
            const y = height - 200 - (i % 2) * 80;
            const platformWidth = 120;
            const platformHeight = 20;
            
            const platform = Matter.Bodies.rectangle(x, y, platformWidth, platformHeight, {
                isStatic: true,
                label: 'platform'
            });
            
            Matter.World.add(this.world, platform);
            this.platforms.push(platform);
        }

        // Gefahren hinzufügen
        for (let i = 0; i < arena.hazards; i++) {
            const x = Math.random() * (width - 200) + 100;
            const y = height - 60;
            
            // Lava-Grube (als Sensor)
            const hazard = Matter.Bodies.rectangle(x, y, 80, 20, {
                isStatic: true,
                isSensor: true,
                label: 'hazard'
            });
            
            Matter.World.add(this.world, hazard);
            this.platforms.push(hazard);
        }
    }

    createPlayers() {
        // Alte Körper entfernen falls vorhanden
        if (this.players.player1 && this.players.player1.body) {
            Matter.World.remove(this.world, this.players.player1.body);
        }
        if (this.players.player2 && this.players.player2.body) {
            Matter.World.remove(this.world, this.players.player2.body);
        }

        // Spieler 1 (links)
        const player1Body = Matter.Bodies.rectangle(200, 300, 20, 40, {
            label: 'player1',
            frictionAir: 0.01,
            inertia: Infinity
        });
        
        // Spieler 2 (rechts)
        const player2Body = Matter.Bodies.rectangle(1000, 300, 20, 40, {
            label: 'player2',
            frictionAir: 0.01,
            inertia: Infinity
        });

        Matter.World.add(this.world, [player1Body, player2Body]);

        this.players = {
            player1: {
                body: player1Body,
                health: this.gameSettings.healthPerPlayer,
                stamina: 100,
                weapon: this.weapons.player1,
                onGround: false,
                attacking: false,
                attackCooldown: 0,
                facing: 1
            },
            player2: {
                body: player2Body,
                health: this.gameSettings.healthPerPlayer,
                stamina: 100,
                weapon: this.weapons.player2,
                onGround: false,
                attacking: false,
                attackCooldown: 0,
                facing: -1
            }
        };

        // UI aktualisieren
        this.updateHealthBar('player1');
        this.updateHealthBar('player2');

        // Kollisions-Events
        Matter.Events.on(this.engine, 'collisionStart', (event) => {
            this.handleCollision(event);
        });
    }

    handleCollision(event) {
        const pairs = event.pairs;
        
        for (let pair of pairs) {
            const { bodyA, bodyB } = pair;
            
            // Boden-Kollision prüfen
            if ((bodyA.label === 'ground' || bodyA.label === 'platform') && bodyB.label.startsWith('player')) {
                this.players[bodyB.label].onGround = true;
            }
            if ((bodyB.label === 'ground' || bodyB.label === 'platform') && bodyA.label.startsWith('player')) {
                this.players[bodyA.label].onGround = true;
            }
            
            // Gefahren-Kollision
            if (bodyA.label === 'hazard' && bodyB.label.startsWith('player')) {
                this.damagePlayer(bodyB.label, 20);
                this.createHitEffect(bodyB.position.x, bodyB.position.y);
            }
            if (bodyB.label === 'hazard' && bodyA.label.startsWith('player')) {
                this.damagePlayer(bodyA.label, 20);
                this.createHitEffect(bodyA.position.x, bodyA.position.y);
            }
        }
    }

    startBattleTimer() {
        let timeLeft = this.gameSettings.roundTime;
        const timerElement = document.getElementById('battle-time');
        
        this.battleTimer = setInterval(() => {
            timeLeft--;
            timerElement.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                this.endBattle('draw');
            }
        }, 1000);
    }

    gameLoop() {
        if (!this.gameRunning || this.currentScreen !== 'battle') return;
        
        // Physics Update
        Matter.Engine.update(this.engine, 16.67);
        
        // Input handling
        this.handlePlayerInput();
        
        // Update game state
        this.updatePlayers();
        
        // Render
        this.render();
        
        // Check win conditions
        this.checkWinConditions();
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }

    handlePlayerInput() {
        // Spieler 1 Steuerung
        const p1 = this.players.player1;
        if (p1.health > 0) {
            let force = 0;
            if (this.keys['a']) {
                force = -0.008;
                p1.facing = -1;
            }
            if (this.keys['d']) {
                force = 0.008;
                p1.facing = 1;
            }
            if (force !== 0) {
                Matter.Body.applyForce(p1.body, p1.body.position, { x: force, y: 0 });
            }
            
            if (this.keys[' '] && p1.onGround && p1.stamina > 20) {
                Matter.Body.applyForce(p1.body, p1.body.position, { x: 0, y: -0.2 });
                p1.stamina -= 20;
                p1.onGround = false;
            }
            if (this.keys['f'] && p1.attackCooldown <= 0) {
                this.performAttack('player1');
            }
        }

        // Spieler 2 Steuerung
        const p2 = this.players.player2;
        if (p2.health > 0) {
            let force = 0;
            if (this.keys['arrowleft']) {
                force = -0.008;
                p2.facing = -1;
            }
            if (this.keys['arrowright']) {
                force = 0.008;
                p2.facing = 1;
            }
            if (force !== 0) {
                Matter.Body.applyForce(p2.body, p2.body.position, { x: force, y: 0 });
            }
            
            if (this.keys['enter'] && p2.onGround && p2.stamina > 20) {
                Matter.Body.applyForce(p2.body, p2.body.position, { x: 0, y: -0.2 });
                p2.stamina -= 20;
                p2.onGround = false;
            }
            if (this.keys['shift'] && p2.attackCooldown <= 0) {
                this.performAttack('player2');
            }
        }
    }

    performAttack(playerId) {
        const attacker = this.players[playerId];
        const target = playerId === 'player1' ? this.players.player2 : this.players.player1;
        
        if (attacker.stamina < 15) return;
        
        attacker.attacking = true;
        attacker.stamina -= 15;
        attacker.attackCooldown = Math.max(20, 80 - attacker.weapon.speed); // Cooldown basierend auf Waffen-Geschwindigkeit
        
        // Reichweite prüfen
        const distance = Math.abs(attacker.body.position.x - target.body.position.x);
        const attackRange = 50 + (attacker.weapon.range * 1.5); // Skalierung für Pixel
        
        if (distance <= attackRange && target.health > 0) {
            const baseDamage = attacker.weapon.damage * 0.3; // Basis-Schaden reduziert für längere Kämpfe
            const damage = Math.random() * baseDamage * 0.5 + baseDamage * 0.5;
            this.damagePlayer(target.body.label, Math.round(damage));
            this.createHitEffect(target.body.position.x, target.body.position.y);
            
            // Knockback
            const knockbackForce = damage / 1000;
            const direction = attacker.body.position.x < target.body.position.x ? 1 : -1;
            Matter.Body.applyForce(target.body, target.body.position, { 
                x: knockbackForce * direction, 
                y: -knockbackForce * 0.3 
            });
            
            // Statistiken
            if (playerId === 'player1') {
                this.battleStats.p1Hits++;
            } else {
                this.battleStats.p2Hits++;
            }
        }
        
        setTimeout(() => {
            attacker.attacking = false;
        }, 200);
    }

    damagePlayer(playerId, damage) {
        if (this.players[playerId]) {
            this.players[playerId].health = Math.max(0, this.players[playerId].health - damage);
            this.updateHealthBar(playerId);
        }
    }

    updatePlayers() {
        // Reset ground status (wird durch Kollisionen wieder gesetzt)
        Object.values(this.players).forEach(player => {
            player.onGround = false;
        });
        
        // Update cooldowns and stamina
        Object.values(this.players).forEach(player => {
            if (player.attackCooldown > 0) {
                player.attackCooldown--;
            }
            
            // Stamina regeneration
            if (player.stamina < 100) {
                player.stamina = Math.min(100, player.stamina + 0.8);
            }
            
            // Geschwindigkeit begrenzen
            if (Math.abs(player.body.velocity.x) > 8) {
                Matter.Body.setVelocity(player.body, {
                    x: Math.sign(player.body.velocity.x) * 8,
                    y: player.body.velocity.y
                });
            }
        });
        
        // Update UI
        this.updateStaminaBars();
    }

    updateHealthBar(playerId) {
        const playerNum = playerId === 'player1' ? '1' : '2';
        const healthBar = document.getElementById(`p${playerNum}-health`);
        const healthPercent = (this.players[playerId].health / this.gameSettings.healthPerPlayer) * 100;
        healthBar.style.width = `${Math.max(0, healthPercent)}%`;
    }

    updateStaminaBars() {
        const p1StaminaBar = document.getElementById('p1-stamina');
        const p2StaminaBar = document.getElementById('p2-stamina');
        
        p1StaminaBar.style.width = `${this.players.player1.stamina}%`;
        p2StaminaBar.style.width = `${this.players.player2.stamina}%`;
    }

    render() {
        const ctx = this.gameCtx;
        const canvas = document.getElementById('game-canvas');
        
        // Canvas leeren
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Hintergrund
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1e293b');
        gradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Plattformen rendern
        this.platforms.forEach(platform => {
            const pos = platform.position;
            const bounds = platform.bounds;
            const width = bounds.max.x - bounds.min.x;
            const height = bounds.max.y - bounds.min.y;
            
            if (platform.label === 'hazard') {
                ctx.fillStyle = '#ff4444';
                ctx.shadowColor = '#ff4444';
                ctx.shadowBlur = 10;
            } else if (platform.label === 'ground') {
                ctx.fillStyle = '#2d4a22';
                ctx.shadowBlur = 0;
            } else {
                ctx.fillStyle = '#32a087';
                ctx.shadowBlur = 0;
            }
            
            ctx.fillRect(pos.x - width/2, pos.y - height/2, width, height);
            
            // Platform-Details
            if (platform.label === 'platform') {
                ctx.strokeStyle = '#4ade80';
                ctx.lineWidth = 2;
                ctx.strokeRect(pos.x - width/2, pos.y - height/2, width, height);
            }
        });
        
        ctx.shadowBlur = 0;
        
        // Strichmännchen rendern
        this.renderPlayer(ctx, this.players.player1, '#32a087');
        this.renderPlayer(ctx, this.players.player2, '#ff6b6b');
        
        // Partikel rendern
        this.renderParticles(ctx);
    }

    renderPlayer(ctx, player, color) {
        const pos = player.body.position;
        
        // Körper
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        // Kopf
        ctx.beginPath();
        ctx.arc(pos.x, pos.y - 15, 8, 0, Math.PI * 2);
        ctx.stroke();
        
        // Körper (Linie)
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y - 7);
        ctx.lineTo(pos.x, pos.y + 10);
        ctx.stroke();
        
        // Arme
        const armAngle = player.attacking ? 0.5 : 0;
        const armLength = 12;
        ctx.beginPath();
        // Linker Arm
        ctx.moveTo(pos.x, pos.y - 2);
        ctx.lineTo(pos.x - armLength * Math.cos(armAngle), pos.y - 2 + armLength * Math.sin(armAngle));
        // Rechter Arm
        ctx.moveTo(pos.x, pos.y - 2);
        ctx.lineTo(pos.x + armLength * Math.cos(armAngle) * player.facing, pos.y - 2 + armLength * Math.sin(armAngle));
        ctx.stroke();
        
        // Beine
        const legOffset = Math.abs(player.body.velocity.x) > 1 ? 5 : 8;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y + 10);
        ctx.lineTo(pos.x - legOffset, pos.y + 25);
        ctx.moveTo(pos.x, pos.y + 10);
        ctx.lineTo(pos.x + legOffset, pos.y + 25);
        ctx.stroke();
        
        // Waffe (vereinfacht)
        if (player.attacking || player.weapon) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            const weaponLength = 15 + (player.weapon.range / 10);
            ctx.beginPath();
            ctx.moveTo(pos.x + 12 * player.facing, pos.y - 2);
            ctx.lineTo(pos.x + (12 + weaponLength) * player.facing, pos.y - 12);
            ctx.stroke();
        }
        
        // Gesundheits-Indikator über dem Kopf
        const healthPercent = player.health / this.gameSettings.healthPerPlayer;
        ctx.fillStyle = healthPercent > 0.5 ? '#4ade80' : healthPercent > 0.25 ? '#fbbf24' : '#ef4444';
        ctx.fillRect(pos.x - 15, pos.y - 35, 30 * healthPercent, 4);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(pos.x - 15, pos.y - 35, 30, 4);
    }

    checkWinConditions() {
        if (this.players.player1.health <= 0) {
            this.endBattle('player2');
        } else if (this.players.player2.health <= 0) {
            this.endBattle('player1');
        }
    }

    endBattle(winner) {
        this.gameRunning = false;
        
        if (this.battleTimer) {
            clearInterval(this.battleTimer);
            this.battleTimer = null;
        }
        
        // Statistiken aktualisieren
        this.gameStats.totalGames++;
        if (winner === 'player1') {
            this.gameStats.p1Wins++;
        } else if (winner === 'player2') {
            this.gameStats.p2Wins++;
        }
        
        this.saveGameStats();
        this.showGameResult(winner);
    }

    showGameResult(winner) {
        this.showScreen('game-result');
        
        const winnerText = document.getElementById('winner-text');
        if (winner === 'draw') {
            winnerText.textContent = 'Unentschieden!';
        } else {
            const playerNum = winner === 'player1' ? '1' : '2';
            winnerText.textContent = `Spieler ${playerNum} Gewinnt!`;
        }
        
        // Kampf-Statistiken anzeigen
        const duration = Math.round((Date.now() - this.battleStats.startTime) / 1000);
        document.getElementById('fight-duration').textContent = `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
        document.getElementById('p1-hits').textContent = this.battleStats.p1Hits;
        document.getElementById('p2-hits').textContent = this.battleStats.p2Hits;
        
        // Gesamt-Statistiken aktualisieren
        this.updateGameStatsDisplay();
    }

    // Particle System
    createParticleSystem() {
        setInterval(() => {
            this.createBackgroundParticle();
        }, 200);
        
        setInterval(() => {
            this.updateParticles();
        }, 16);
    }

    createBackgroundParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * window.innerWidth + 'px';
        particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
        document.getElementById('particles').appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 5000);
    }

    createHitEffect(x, y) {
        // Hit-Partikel für das Canvas
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 30,
                y: y + (Math.random() - 0.5) * 30,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 40,
                maxLife: 40,
                color: '#ffd700'
            });
        }
    }

    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            particle.life--;
            return particle.life > 0;
        });
    }

    renderParticles(ctx) {
        this.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = particle.color || '#ffd700';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    // Settings und Modals
    showSettings() {
        document.getElementById('settings-modal').classList.remove('hidden');
        
        // Aktuelle Werte setzen
        document.getElementById('drawing-time').value = this.gameSettings.drawingTime;
        document.getElementById('round-time').value = this.gameSettings.roundTime;
        document.getElementById('player-health').value = this.gameSettings.healthPerPlayer;
        
        document.getElementById('drawing-time-value').textContent = this.gameSettings.drawingTime + 's';
        document.getElementById('round-time-value').textContent = this.gameSettings.roundTime + 's';
        document.getElementById('player-health-value').textContent = this.gameSettings.healthPerPlayer;
    }

    saveSettings() {
        this.gameSettings.drawingTime = parseInt(document.getElementById('drawing-time').value);
        this.gameSettings.roundTime = parseInt(document.getElementById('round-time').value);
        this.gameSettings.healthPerPlayer = parseInt(document.getElementById('player-health').value);
        
        localStorage.setItem('gameSettings', JSON.stringify(this.gameSettings));
        this.closeSettings();
    }

    closeSettings() {
        document.getElementById('settings-modal').classList.add('hidden');
    }

    showHelp() {
        document.getElementById('help-modal').classList.remove('hidden');
    }

    closeHelp() {
        document.getElementById('help-modal').classList.add('hidden');
    }

    pauseGame() {
        if (this.currentScreen === 'battle') {
            this.gameRunning = false;
            alert('Spiel pausiert. Drücke OK um fortzufahren.');
            this.gameRunning = true;
            this.gameLoop();
        }
    }

    // Local Storage
    loadGameStats() {
        const saved = localStorage.getItem('gameStats');
        if (saved) {
            this.gameStats = JSON.parse(saved);
        }
        
        const savedSettings = localStorage.getItem('gameSettings');
        if (savedSettings) {
            this.gameSettings = { ...this.gameSettings, ...JSON.parse(savedSettings) };
        }
        
        this.updateGameStatsDisplay();
    }

    saveGameStats() {
        localStorage.setItem('gameStats', JSON.stringify(this.gameStats));
    }

    updateGameStatsDisplay() {
        document.getElementById('total-games').textContent = this.gameStats.totalGames;
        document.getElementById('p1-wins').textContent = this.gameStats.p1Wins;
        document.getElementById('p2-wins').textContent = this.gameStats.p2Wins;
    }
}

// Game starten wenn DOM geladen ist
document.addEventListener('DOMContentLoaded', () => {
    window.game = new StickmanBattleGame();
});
