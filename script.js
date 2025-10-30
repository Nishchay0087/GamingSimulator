// Game Configuration
const PLAYERS = 4;
const UPDATES_PER_PLAYER = 10;
const MAX_UPDATES = PLAYERS * UPDATES_PER_PLAYER;
const BONUS_THRESHOLD = 50;
const PENALTY_CHANCE = 15;

// Game State
let players = [
    { id: 0, name: 'Alpha', score: 0, totalAttempts: 0, successfulScores: 0, penalties: 0, bonuses: 0, avgScore: 0, color: '#3b82f6' },
    { id: 1, name: 'Beta', score: 0, totalAttempts: 0, successfulScores: 0, penalties: 0, bonuses: 0, avgScore: 0, color: '#10b981' },
    { id: 2, name: 'Gamma', score: 0, totalAttempts: 0, successfulScores: 0, penalties: 0, bonuses: 0, avgScore: 0, color: '#a855f7' },
    { id: 3, name: 'Delta', score: 0, totalAttempts: 0, successfulScores: 0, penalties: 0, bonuses: 0, avgScore: 0, color: '#f97316' }
];
let gameState = 'idle';
let logs = [];
let totalUpdates = 0;
let gameStartTime = null;
let gameEndTime = null;
let updateInterval = null;

// Initialization (moved to the end of the script to ensure functions are defined)
document.addEventListener('DOMContentLoaded', () => {
    // Initial render is done here since the functions are defined globally
    renderPlayers();
    updateUI();
});

function addLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 3 });
    logs.push({ timestamp, message, type });
    if (logs.length > 50) logs.shift();
    renderLogs();
}

function calculateBonus(currentScore) {
    if (currentScore >= BONUS_THRESHOLD && currentScore < BONUS_THRESHOLD + 10) {
        return 10;
    } else if (currentScore >= BONUS_THRESHOLD * 2) {
        return 15;
    }
    return 0;
}

function updatePlayerScore(playerId) {
    const player = players[playerId];
    player.totalAttempts++;

    // Check for penalty
    if (Math.random() * 100 < PENALTY_CHANCE) {
        const penalty = Math.floor(Math.random() * 5) + 1;
        player.score = Math.max(0, player.score - penalty);
        player.penalties++;
        addLog(`⚠️ PENALTY - Player ${player.name}: -${penalty} points (Total: ${player.score})`, 'penalty');
    } else {
        const points = Math.floor(Math.random() * 10);
        player.score += points;
        player.successfulScores++;

        // Check for bonus
        const bonus = calculateBonus(player.score);
        if (bonus > 0) {
            player.score += bonus;
            player.bonuses++;
            addLog(`🎁 BONUS EARNED - Player ${player.name}: +${bonus} points (Total: ${player.score})`, 'bonus');
        } else {
            addLog(`✓ SCORE UPDATE - Player ${player.name}: +${points} points (Total: ${player.score})`, 'score');
        }
    }
    player.avgScore = player.score / player.totalAttempts;
    totalUpdates++;
    updateUI();
}

function startGame() {
    if (gameState === 'running') return;

    // 1. Reset state
    gameState = 'running';
    totalUpdates = 0;
    gameStartTime = Date.now();
    logs = [];

    // 2. Reset UI elements and players
    document.getElementById('startBtn').disabled = true;
    document.getElementById('startBtnText').textContent = 'Game Running...';
    document.getElementById('winnerBanner').style.display = 'none';
    document.getElementById('durationRow').style.display = 'none';
    
    players.forEach(p => {
        p.score = 0;
        p.totalAttempts = 0;
        p.successfulScores = 0;
        p.penalties = 0;
        p.bonuses = 0;
        p.avgScore = 0;
    });

    addLog('🎮 GAME STARTED - All players initialized', 'start');
    renderPlayers();
    updateUI();

    // 3. Start Simulation
    let updateCounts = [0, 0, 0, 0];
    updateInterval = setInterval(() => {
        const availablePlayers = [];
        for (let i = 0; i < PLAYERS; i++) {
            if (updateCounts[i] < UPDATES_PER_PLAYER) {
                availablePlayers.push(i);
            }
        }

        if (availablePlayers.length === 0) {
            clearInterval(updateInterval);
            endGame();
            return;
        }

        const randomPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
        updatePlayerScore(randomPlayer);
        updateCounts[randomPlayer]++;
    }, 500 + Math.random() * 1000);
}

function endGame() {
    gameState = 'finished';
    gameEndTime = Date.now();

    document.getElementById('startBtn').disabled = false;
    document.getElementById('startBtnText').textContent = 'Start Simulation';

    addLog('🏁 GAME OVER - All updates completed', 'end');

    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];

    document.getElementById('winnerBanner').style.display = 'block';
    document.getElementById('winnerName').textContent = winner.name;
    document.getElementById('winnerScore').textContent = `with ${winner.score} points!`;

    const duration = ((gameEndTime - gameStartTime) / 1000).toFixed(2);
    document.getElementById('duration').textContent = duration + 's';
    document.getElementById('durationRow').style.display = 'flex';

    updateUI();
}

function resetGame() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    gameState = 'idle';
    totalUpdates = 0;
    logs = [];
    gameStartTime = null;
    gameEndTime = null;
    
    // Reset player data
    players.forEach(p => {
        p.score = 0;
        p.totalAttempts = 0;
        p.successfulScores = 0;
        p.penalties = 0;
        p.bonuses = 0;
        p.avgScore = 0;
    });

    // Reset UI
    document.getElementById('startBtn').disabled = false;
    document.getElementById('startBtnText').textContent = 'Start Simulation';
    document.getElementById('winnerBanner').style.display = 'none';
    document.getElementById('durationRow').style.display = 'none';
    
    renderPlayers();
    renderLogs();
    updateUI();
}

function renderPlayers() {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const maxScore = sortedPlayers[0]?.score || 1; 
    
    const html = sortedPlayers.map((player, index) => {
        const barWidth = (player.score / maxScore) * 100;
        const successRate = player.totalAttempts > 0 ? ((player.successfulScores / player.totalAttempts) * 100).toFixed(0) : 0;
        
        // Use color property directly in style attribute instead of rank-N classes
        // Note: The original CSS relies on rank-1, rank-2, etc. This is a compromise to keep the JS simple.
        const rankColor = players.find(p => p.id === player.id)?.color || '#fff';

        return `
            <div class="player-card">
                <div class="player-header">
                    <div class="player-info">
                        <div class="player-rank" style="background: ${rankColor};">${index + 1}</div>
                        <div class="player-name">
                            <h3>${player.name}</h3>
                            <div class="player-attempts">Attempts: ${player.totalAttempts} • Success: ${player.successfulScores}</div>
                        </div>
                    </div>
                    <div class="player-score-display">
                        <div class="score">${player.score}</div>
                        <div class="avg">Avg: ${player.avgScore.toFixed(2)}</div>
                    </div>
                </div>
                <div class="score-bar">
                    <div class="score-bar-fill" style="width: ${barWidth}%; background: ${rankColor};"></div>
                </div>
                <div class="player-stats">
                    <div class="stat-badge bonuses">
                        🏅 Bonuses: ${player.bonuses}
                    </div>
                    <div class="stat-badge penalties">
                        ⚠️ Penalties: ${player.penalties}
                    </div>
                    <div class="stat-badge rate">
                        📈 Rate: ${successRate}%
                    </div>
                </div>
            </div>
        `;
    }).join('');
    document.getElementById('playersContainer').innerHTML = html;
}

function renderLogs() {
    const container = document.getElementById('logsContainer');

    if (logs.length === 0) {
        container.innerHTML = '<div class="empty-logs">No activity yet. Start the simulation!</div>';
        return;
    }
    // Reverse logs array for rendering new entries at the top of the list (while keeping original logic)
    const reversedLogs = [...logs].reverse(); 
    const html = reversedLogs.map(log => `
        <div class="log-entry ${log.type}">
            <span class="log-timestamp">[${log.timestamp}]</span>
            <span>${log.message}</span>
        </div>
    `).join('');
    
    container.innerHTML = html;
    container.scrollTop = 0; // Scroll to the top to see the newest (first) log entry
}

function updateUI() {
    renderPlayers();
    
    // Update progress
    const progress = (totalUpdates / MAX_UPDATES) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
    document.getElementById('progressPercent').textContent = progress.toFixed(1) + '%';
    document.getElementById('updateCount').textContent = `${totalUpdates}/${MAX_UPDATES}`;

    // Update statistics
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const totalScore = players.reduce((sum, p) => sum + p.score, 0);
    const avgScore = totalScore / PLAYERS;
    
    document.getElementById('totalPoints').textContent = totalScore;
    document.getElementById('avgScore').textContent = avgScore.toFixed(2);
    document.getElementById('highScore').textContent = sortedPlayers[0]?.score || 0;
    document.getElementById('lowScore').textContent = sortedPlayers[sortedPlayers.length - 1]?.score || 0;
}