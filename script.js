// --- PRELOADER & INITIALIZATION ---
window.addEventListener('DOMContentLoaded', () => {
    let progress = 0;
    const bar = document.getElementById('loading-bar');
    const percent = document.getElementById('loading-percent');
    const status = document.getElementById('loading-status');
    const preloader = document.getElementById('preloader');
    const modeScreen = document.getElementById('mode-screen');

    const statuses = [
        "Loading local audio files...",
        "Calibrating neon graphics...",
        "Initializing cybernetic grid...",
        "Ready for deployment..."
    ];

    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 12) + 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                preloader.classList.add('opacity-0', 'pointer-events-none');
                modeScreen.classList.remove('opacity-0', 'pointer-events-none');
                updateDashboardStats();
                document.body.addEventListener('click', startBGMOnce, { once: true });
            }, 400);
        }
        bar.style.width = progress + '%';
        percent.innerText = progress + '%';
        if (progress > 75) status.innerText = statuses[3];
        else if (progress > 50) status.innerText = statuses[2];
        else if (progress > 25) status.innerText = statuses[1];
    }, 50);
});

// --- LOCAL AUDIO ENGINE ---
let audioConfig = { sfxVol: 0.8, bgmVol: 0.5 };
let bgmStarted = false;

function startBGMOnce() {
    if (!bgmStarted) {
        const bgm = document.getElementById('audio-bgm');
        if (bgm) {
            bgm.volume = audioConfig.bgmVol;
            bgm.play().catch(() => { });
            bgmStarted = true;
        }
    }
}

function playLocalAudio(elementId) {
    const audioEl = document.getElementById(elementId);
    if (audioEl) {
        audioEl.volume = audioConfig.sfxVol;
        audioEl.currentTime = 0;
        audioEl.play().catch(() => { });
    }
}

function playBtnSound() { playLocalAudio('audio-button'); }
function playSingSound() { playLocalAudio('audio-sing'); }
function playGameOverSound() { playLocalAudio('audio-gameover'); }
function playGamewinSound() { playLocalAudio('audio-gamewin'); }
function playGameDrawSound() { playLocalAudio('audio-gamedraw'); }

function updateVolume(type, val) {
    const num = val / 100;
    if (type === 'sfx') {
        audioConfig.sfxVol = num;
        document.getElementById('sfx-val').innerText = val + '%';
    } else {
        audioConfig.bgmVol = num;
        document.getElementById('bgm-val').innerText = val + '%';
        const bgm = document.getElementById('audio-bgm');
        if (bgm) bgm.volume = num;
    }
}

// --- STATS, STREAKS & GRAPH SYSTEM (PvE Only) ---
let userStats = JSON.parse(localStorage.getItem('tic_tac_toe_stats')) || {
    winStreak: 0,
    loseStreak: 0,
    history: [1, 0, 1, 1, 0]
};

function saveStats() {
    localStorage.setItem('tic_tac_toe_stats', JSON.stringify(userStats));
}

function updateDashboardStats() {
    document.getElementById('stat-win-streak').innerText = userStats.winStreak;
    document.getElementById('stat-lose-streak').innerText = userStats.loseStreak;
    document.getElementById('badge-streak').innerText = userStats.winStreak > 0 ? `STREAK: +${userStats.winStreak}` : `STREAK: ${userStats.winStreak}`;

    const graphEl = document.getElementById('perf-graph');
    graphEl.innerHTML = '';
    const recent = userStats.history.slice(-8);
    recent.forEach(result => {
        const bar = document.createElement('div');
        bar.className = `flex-1 rounded-sm transition-all duration-300 ${result === 1 ? 'bg-cyan-400 h-full shadow-[0_0_8px_rgba(0,240,255,0.5)]' : 'bg-rose-500 h-1/3'}`;
        graphEl.appendChild(bar);
    });
}

// --- SMACK-TALK & MOTIVATION TOAST ---
const insults = [
    "Wkwk, mental tempe baru gitu aja udah kalah!",
    "Udah jangan main game, mending cuci piring sana!",
    "AI-nya ketawa ngejekin lu di background lho wkwk.",
    "Lose streak mulu, jempolnya kesleo ya bro?"
];

const motivations = [
    "Gokil! Win streak beruntun, lu emang Grandmaster!",
    "Pertahankan performa ini, AI aja minder sama lu!",
    "Mantap jiwa! Dominasi mutlak di tangan lu!"
];

function showToast(isWin) {
    const toast = document.getElementById('toast-notif');
    const title = document.getElementById('toast-title');
    const msg = document.getElementById('toast-message');
    const icon = document.getElementById('toast-icon');

    if (isWin) {
        icon.innerText = '⚡';
        title.innerText = 'MOTIVASI SYSTEM';
        msg.innerText = motivations[Math.floor(Math.random() * motivations.length)];
    } else {
        icon.innerText = '💀';
        title.innerText = 'AI SMACK-TALK';
        msg.innerText = insults[Math.floor(Math.random() * insults.length)];
    }

    toast.classList.remove('-translate-y-20', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('-translate-y-20', 'opacity-0');
    }, 4000);
}

// --- GAME LOGIC & NAVIGATION ---
let boardState = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;
let gameMode = 'pvp';
let aiDifficulty = 'wni';
let playerSymbol = 'X';
let aiSymbol = 'O';
let score = { X: 0, O: 0 };
let isAiThinking = false;

const winningConditions = [
    { combo: [0, 1, 2], lineClass: 'line-row-0' },
    { combo: [3, 4, 5], lineClass: 'line-row-1' },
    { combo: [6, 7, 8], lineClass: 'line-row-2' },
    { combo: [0, 3, 6], lineClass: 'line-col-0' },
    { combo: [1, 4, 7], lineClass: 'line-col-1' },
    { combo: [2, 5, 8], lineClass: 'line-col-2' },
    { combo: [0, 4, 8], lineClass: 'line-diag-0' },
    { combo: [2, 4, 6], lineClass: 'line-diag-1' }
];

const cells = document.querySelectorAll('.board-cell');
const winLine = document.getElementById('win-line');
const scoreXEl = document.getElementById('scoreX');
const scoreOEl = document.getElementById('scoreO');
const playerXCard = document.getElementById('playerX-card');
const playerOCard = document.getElementById('playerO-card');
const labelX = document.getElementById('label-x');
const labelO = document.getElementById('label-o');

const modeScreen = document.getElementById('mode-screen');
const difficultyScreen = document.getElementById('difficulty-screen');
const symbolScreen = document.getElementById('symbol-screen');
const settingsScreen = document.getElementById('settings-screen');
const gameContainer = document.getElementById('game-container');
const modeIndicator = document.getElementById('mode-indicator');

const resultModal = document.getElementById('result-modal');
const modalContent = document.getElementById('modal-content');
const resultMessage = document.getElementById('result-message');
const resultSubmessage = document.getElementById('result-submessage');

function startGameMode(mode) {
    gameMode = mode;
    playerSymbol = 'X';
    aiSymbol = 'O';
    modeScreen.classList.add('opacity-0', 'pointer-events-none');
    gameContainer.classList.remove('opacity-0', 'pointer-events-none');
    modeIndicator.innerText = 'MODE: PVP';
    labelX.innerText = 'Blue (X)';
    labelO.innerText = 'Red (O)';
    resetGame();
}

function showDifficultyMenu() {
    modeScreen.classList.add('opacity-0', 'pointer-events-none');
    difficultyScreen.classList.remove('opacity-0', 'pointer-events-none');
}

function selectDifficulty(level) {
    aiDifficulty = level;
    difficultyScreen.classList.add('opacity-0', 'pointer-events-none');
    symbolScreen.classList.remove('opacity-0', 'pointer-events-none');
}

function backToDifficultyMenu() {
    symbolScreen.classList.add('opacity-0', 'pointer-events-none');
    difficultyScreen.classList.remove('opacity-0', 'pointer-events-none');
}

function showSettingsMenu() {
    modeScreen.classList.add('opacity-0', 'pointer-events-none');
    settingsScreen.classList.remove('opacity-0', 'pointer-events-none');
}

function closeSettingsMenu() {
    settingsScreen.classList.add('opacity-0', 'pointer-events-none');
    modeScreen.classList.remove('opacity-0', 'pointer-events-none');
}

function backToModeMenu() {
    difficultyScreen.classList.add('opacity-0', 'pointer-events-none');
    modeScreen.classList.remove('opacity-0', 'pointer-events-none');
}

function startAiGameWithSymbol(symbol) {
    gameMode = 'pve';
    playerSymbol = symbol;
    aiSymbol = symbol === 'X' ? 'O' : 'X';

    symbolScreen.classList.add('opacity-0', 'pointer-events-none');
    gameContainer.classList.remove('opacity-0', 'pointer-events-none');

    let labelText = 'VS AI (Normal)';
    if (aiDifficulty === 'hard') labelText = 'VS AI (Hard)';
    if (aiDifficulty === 'wni') labelText = 'VS AI (WNI)';

    modeIndicator.innerText = `MODE: ${labelText}`;

    if (playerSymbol === 'X') {
        labelX.innerText = 'Player (X)';
        labelO.innerText = `System (${aiDifficulty.toUpperCase()}) (O)`;
    } else {
        labelX.innerText = `System (${aiDifficulty.toUpperCase()}) (X)`;
        labelO.innerText = 'Player (O)';
    }

    resetGame();

    if (playerSymbol === 'O') {
        isAiThinking = true;
        setTimeout(() => {
            aiMove();
            isAiThinking = false;
        }, 500);
    }
}

function backToMenu() {
    gameContainer.classList.add('opacity-0', 'pointer-events-none');
    modeScreen.classList.remove('opacity-0', 'pointer-events-none');
    score = { X: 0, O: 0 };
    scoreXEl.innerText = '0';
    scoreOEl.innerText = '0';
    updateDashboardStats();
}

function handleCellClick(e) {
    if (!gameActive || isAiThinking) return;
    const cell = e.target;
    const cellIndex = parseInt(cell.getAttribute('data-index'));
    if (boardState[cellIndex] !== '') return;

    if (gameMode === 'pve' && currentPlayer !== playerSymbol) return;

    playBtnSound();
    makeMove(cellIndex, currentPlayer);

    if (gameActive && gameMode === 'pve' && currentPlayer === aiSymbol) {
        isAiThinking = true;
        setTimeout(() => {
            aiMove();
            isAiThinking = false;
        }, 500);
    }
}

function makeMove(index, player) {
    boardState[index] = player;
    const cell = cells[index];
    cell.innerText = player;
    cell.classList.add('occupied', 'animate-pop');

    if (player === 'X') cell.classList.add('glow-x');
    else cell.classList.add('glow-o');

    cell.style.transform = "scale(0.95)";
    setTimeout(() => { cell.style.transform = ""; }, 100);

    checkResult();
}

function aiMove() {
    if (!gameActive) return;
    let bestMove;

    let emptyCells = [];
    boardState.forEach((val, idx) => { if (val === '') emptyCells.push(idx); });

    if (emptyCells.length === 9) {
        bestMove = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    } else {
        if (aiDifficulty === 'normal') {
            if (Math.random() < 0.5) {
                bestMove = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            } else {
                bestMove = getMinimaxBestMove();
            }
        } else if (aiDifficulty === 'hard') {
            if (Math.random() < 0.15) {
                bestMove = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            } else {
                bestMove = getMinimaxBestMove();
            }
        } else {
            bestMove = getMinimaxBestMove();
        }
    }

    if (bestMove !== undefined) {
        makeMove(bestMove, aiSymbol);
    }
}

function getMinimaxBestMove() {
    let bestScore = -Infinity;
    let bestMove;
    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] === '') {
            boardState[i] = aiSymbol;
            let score = minimax(boardState, 0, false);
            boardState[i] = '';
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    return bestMove;
}

function minimax(board, depth, isMaximizing) {
    let result = checkWinnerForMinimax(board);
    if (result !== null) {
        if (result === aiSymbol) return 10 - depth;
        if (result === playerSymbol) return depth - 10;
        return 0;
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = aiSymbol;
                let score = minimax(board, depth + 1, false);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = playerSymbol;
                let score = minimax(board, depth + 1, true);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function checkWinnerForMinimax(board) {
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i].combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    if (!board.includes('')) return 'tie';
    return null;
}

function checkResult() {
    let roundWon = false;
    let winningClass = '';
    let winningPlayer = '';

    for (let i = 0; i < winningConditions.length; i++) {
        const winCondition = winningConditions[i].combo;
        let a = boardState[winCondition[0]];
        let b = boardState[winCondition[1]];
        let c = boardState[winCondition[2]];

        if (a === '' || b === '' || c === '') continue;

        if (a === b && b === c) {
            roundWon = true;
            winningClass = winningConditions[i].lineClass;
            winningPlayer = a;
            winCondition.forEach(index => {
                cells[index].style.background = a === 'X' ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 0, 60, 0.2)';
            });
            break;
        }
    }

    if (roundWon) {
        gameActive = false;
        showWinLine(winningClass, winningPlayer);
        updateScore(winningPlayer);

        playSingSound();

        if (gameMode === 'pve') {
            let isPlayerWin = (winningPlayer === playerSymbol);
            if (isPlayerWin) {
                playGamewinSound();
                userStats.winStreak++;
                userStats.loseStreak = 0;
                userStats.history.push(1);
                showToast(true);
            } else {
                playGameOverSound();
                userStats.loseStreak++;
                userStats.winStreak = 0;
                userStats.history.push(0);
                showToast(false);
            }
            saveStats();
        } else {
            if (winningPlayer === 'X') {
                playGamewinSound();
            } else {
                playGameOverSound();
            }
        }

        setTimeout(() => {
            showModal(winningPlayer);
        }, 600);
        return;
    }

    if (!boardState.includes('')) {
        gameActive = false;
        playGameDrawSound();
        setTimeout(() => showModal('Draw'), 400);
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateActivePlayerUI();
}

function showWinLine(lineClass, player) {
    winLine.className = 'win-line';
    winLine.classList.add(lineClass, 'active');
    if (player === 'X') {
        winLine.style.boxShadow = '0 0 15px #00f0ff, 0 0 30px #00f0ff';
        winLine.style.background = '#00f0ff';
    } else {
        winLine.style.boxShadow = '0 0 15px #ff003c, 0 0 30px #ff003c';
        winLine.style.background = '#ff003c';
    }
}

function updateScore(winner) {
    score[winner]++;
    if (winner === 'X') {
        scoreXEl.innerText = score.X;
        scoreXEl.classList.add('animate-pop');
        setTimeout(() => scoreXEl.classList.remove('animate-pop'), 400);
    } else {
        scoreOEl.innerText = score.O;
        scoreOEl.classList.add('animate-pop');
        setTimeout(() => scoreOEl.classList.remove('animate-pop'), 400);
    }
}

function updateActivePlayerUI() {
    if (currentPlayer === 'X') {
        playerXCard.classList.remove('opacity-50', 'scale-95');
        playerXCard.classList.add('scale-105');
        playerOCard.classList.add('opacity-50', 'scale-95');
        playerOCard.classList.remove('scale-105');
    } else {
        playerOCard.classList.remove('opacity-50', 'scale-95');
        playerOCard.classList.add('scale-105');
        playerXCard.classList.add('opacity-50', 'scale-95');
        playerXCard.classList.remove('scale-105');
    }
}

function showModal(result) {
    if (result === 'Draw') {
        resultMessage.innerHTML = `<span class="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">SYSTEM DRAW</span>`;
        resultSubmessage.innerText = aiDifficulty === 'wni' ? "Aman, lu berhasil nahan imbang WNI. Gak emosi kan?" : "Masih draw, kalem aja bro.";
    } else {
        const colorClass = result === 'X' ? 'glow-x' : 'glow-o';
        let winnerText = result;

        if (gameMode === 'pve') {
            let isPlayerWin = (result === playerSymbol);
            if (isPlayerWin) {
                winnerText = 'PLAYER';
                resultMessage.innerHTML = `<span class="${colorClass}">${winnerText} WINS!</span>`;
                resultSubmessage.innerText = "Anjayy, boleh-boleh lu";
            } else {
                winnerText = aiDifficulty === 'wni' ? 'AI WNI (EMOSI)' : 'SYSTEM';
                resultMessage.innerHTML = `<span class="${colorClass}">${winnerText} WINS!</span>`;
                if (aiDifficulty === 'wni') {
                    resultSubmessage.innerText = "Wkwk, lu dibantai bot WNI. Jangan emosi ya, bro!";
                } else {
                    resultSubmessage.innerText = "Awokawok, masa kalah sama bot.";
                }
            }
        } else {
            if (result === 'X') {
                resultMessage.innerHTML = `<span class="glow-x">BLUE WINS!</span>`;
                resultSubmessage.innerText = "Gembel amat lu, gimana mo jadi presiden!";
            } else {
                resultMessage.innerHTML = `<span class="glow-o">RED WINS!</span>`;
                resultSubmessage.innerText = "Gembel amat lu, gimana mo jadi presiden!";
            }
        }
    }

    resultModal.classList.remove('opacity-0', 'pointer-events-none');
    modalContent.classList.remove('scale-90');
    modalContent.classList.add('scale-100');
}

function hideModal() {
    resultModal.classList.add('opacity-0', 'pointer-events-none');
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-90');
}

function resetGame() {
    boardState = ['', '', '', '', '', '', '', '', ''];
    gameActive = true;
    currentPlayer = 'X';
    isAiThinking = false;
    winLine.className = 'win-line';
    hideModal();
    updateActivePlayerUI();

    cells.forEach(cell => {
        cell.innerText = '';
        cell.className = 'board-cell rounded-xl flex items-center justify-center font-cyber text-5xl md:text-7xl';
        cell.style.background = '';
    });
}

cells.forEach(cell => cell.addEventListener('click', handleCellClick));
document.getElementById('restart-btn').addEventListener('click', () => {
    score = { X: 0, O: 0 };
    scoreXEl.innerText = '0';
    scoreOEl.innerText = '0';
    resetGame();
    if (gameMode === 'pve' && playerSymbol === 'O') {
        isAiThinking = true;
        setTimeout(() => {
            aiMove();
            isAiThinking = false;
        }, 500);
    }
});
document.getElementById('play-again-btn').addEventListener('click', () => {
    resetGame();
    if (gameMode === 'pve' && playerSymbol === 'O') {
        isAiThinking = true;
        setTimeout(() => {
            aiMove();
            isAiThinking = false;
        }, 500);
    }
});

updateActivePlayerUI();