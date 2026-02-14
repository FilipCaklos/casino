// ==================== API CLIENT ====================
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : '/api';

let authToken = localStorage.getItem('authToken');
let currentUser = null;
let balance = 0;
let totalBets = 0;
let totalWins = 0;
let biggestWin = 0;

// ==================== API CALLS ====================
async function apiCall(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        if (!response.ok) {
            if (response.status === 401) {
                logout();
            }
            const error = await response.json();
            throw new Error(error.error || 'API Error');
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ==================== AUTHENTICATION ====================
async function register(username, password, confirmPassword) {
    try {
        const data = await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password, confirmPassword })
        });

        authToken = data.token;
        localStorage.setItem('authToken', token);
        currentUser = data.user;
        balance = data.user.balance;
        
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function login(username, password) {
    try {
        const data = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        authToken = data.token;
        localStorage.setItem('authToken', authToken);
        currentUser = data.user;
        balance = data.user.balance;
        totalBets = data.user.totalBets;
        totalWins = data.user.totalWins;
        biggestWin = data.user.biggestWin;
        
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    location.reload();
}

// ==================== BALANCE & TRANSACTIONS ====================
async function updateBalance(game, bet, win = 0) {
    try {
        const data = await apiCall('/users/update-balance', {
            method: 'POST',
            body: JSON.stringify({ game, bet, win })
        });

        balance = data.balance;
        totalBets = data.totalBets;
        totalWins = data.totalWins;
        biggestWin = data.biggestWin;
        updateBalance();
        updateStats();

        return data;
    } catch (error) {
        console.error('Error updating balance:', error);
        showMessage('slotMessage', 'Error updating balance!', 'lose');
    }
}

async function recordTransaction(game, type, amount, details = {}) {
    try {
        await apiCall('/transactions/record', {
            method: 'POST',
            body: JSON.stringify({
                game,
                type,
                amount,
                ...details
            })
        });
    } catch (error) {
        console.error('Error recording transaction:', error);
    }
}

// ==================== COUPONS ====================
async function redeemCoupon(code) {
    try {
        const data = await apiCall('/coupons/redeem', {
            method: 'POST',
            body: JSON.stringify({ code })
        });

        balance = data.balance;
        updateBalance();
        triggerVictoryAnimation(data.bonus);
        return { success: true, message: data.message, bonus: data.bonus };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// ==================== AUTHENTICATION UI ====================
function initializeAuth() {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');

    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    });

    registerTab.addEventListener('click', () => {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    });

    loginBtn.addEventListener('click', async () => {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!username || !password) {
            document.getElementById('loginMessage').textContent = '⚠️ Fill in all fields!';
            return;
        }

        loginBtn.disabled = true;
        const result = await login(username, password);
        loginBtn.disabled = false;

        if (result.success) {
            loadUserData();
            document.getElementById('loginModal').classList.remove('active');
        } else {
            document.getElementById('loginMessage').textContent = result.message;
        }
    });

    registerBtn.addEventListener('click', async () => {
        const username = document.getElementById('regUsername').value;
        const password = document.getElementById('regPassword').value;
        const password2 = document.getElementById('regPassword2').value;
        
        if (!username || !password || !password2) {
            document.getElementById('regMessage').textContent = '⚠️ Fill in all fields!';
            return;
        }

        if (password !== password2) {
            document.getElementById('regMessage').textContent = '❌ Passwords do not match!';
            return;
        }

        registerBtn.disabled = true;
        const result = await register(username, password, password2);
        registerBtn.disabled = false;

        document.getElementById('regMessage').textContent = result.message;
        
        if (result.success) {
            setTimeout(() => {
                document.getElementById('registerTab').click();
                document.getElementById('loginUsername').value = username;
                document.getElementById('loginPassword').value = password;
                loadUserData();
                document.getElementById('loginModal').classList.remove('active');
            }, 1000);
        }
    });

    // Profile menu
    document.getElementById('profileBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('profileDropdown').classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
        document.getElementById('profileDropdown').classList.add('hidden');
    });

    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('couponBtn').addEventListener('click', showCouponDialog);
}

async function showCouponDialog() {
    const code = prompt('Enter Coupon Code:\n\nDemo codes: BOOST50, CASINO100, LUCKY777, SPIN50, WELCOME');
    if (code) {
        const result = await redeemCoupon(code);
        if (result.success) {
            showMessage('slotMessage', result.message, 'win');
        } else {
            showMessage('slotMessage', result.message, 'lose');
        }
    }
    document.getElementById('profileDropdown').classList.add('hidden');
}

function loadUserData() {
    if (authToken && currentUser) {
        document.getElementById('usernameDisplay').textContent = currentUser.username;
        updateBalance();
        updateStats();
        
        initializeNavigation();
        initializeSlots();
        initializeBlackjack();
        initializeRoulette();
        initializeDice();
        initializePoker();
        initializeKeno();
    }
}

// ==================== CHECK EXISTING TOKEN ====================
document.addEventListener('DOMContentLoaded', async () => {
    if (authToken) {
        try {
            const user = await apiCall('/users/profile');
            currentUser = user;
            balance = user.balance;
            totalBets = user.totalBets;
            totalWins = user.totalWins;
            biggestWin = user.biggestWin;
            
            loadUserData();
            document.getElementById('loginModal').classList.remove('active');
        } catch (error) {
            authToken = null;
            localStorage.removeItem('authToken');
            initializeAuth();
        }
    } else {
        initializeAuth();
    }
});

// ==================== VICTORY ANIMATIONS ====================
function triggerVictoryAnimation(amount) {
    const container = document.getElementById('victoryContainer');
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.background = ['#ffd700', '#ffed4e', '#ff6b6b', '#00ff88'][Math.floor(Math.random() * 4)];
        confetti.style.animationDelay = Math.random() * 0.3 + 's';
        container.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3000);
    }

    const banner = document.createElement('div');
    banner.className = 'victory-banner';
    banner.innerHTML = `
        <div class="victory-content">
            <div class="victory-emoji">🎉✨🎊</div>
            <h2>JACKPOT!</h2>
            <div class="victory-amount">+$${amount}</div>
            <div class="victory-emoji">🎊✨🎉</div>
        </div>
    `;
    container.appendChild(banner);
    setTimeout(() => banner.remove(), 3000);
}

function triggerSmallWin(amount) {
    const container = document.getElementById('victoryContainer');
    const popup = document.createElement('div');
    popup.className = 'small-win-popup';
    popup.textContent = `+ $${amount}`;
    popup.style.left = Math.random() * 80 + 10 + '%';
    popup.style.top = Math.random() * 60 + 20 + '%';
    container.appendChild(popup);
    setTimeout(() => popup.remove(), 2000);
}

// ==================== UTILITIES ====================
function updateBalance() {
    document.getElementById('balance').textContent = balance.toFixed(0);
}

function updateStats() {
    document.getElementById('totalBets').textContent = totalBets;
    document.getElementById('totalWins').textContent = totalWins;
    document.getElementById('biggestWin').textContent = '$' + biggestWin.toFixed(0);
}

function showMessage(elementId, message, type) {
    const messageEl = document.getElementById(elementId);
    messageEl.textContent = message;
    messageEl.className = 'game-message ' + type;
    setTimeout(() => {
        messageEl.className = 'game-message';
        messageEl.textContent = '';
    }, 5000);
}

// ==================== NAVIGATION ====================
function initializeNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const gameSections = document.querySelectorAll('.game-section');
    const gameCards = document.querySelectorAll('.game-card');
    const backBtns = document.querySelectorAll('.back-btn');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const game = btn.dataset.game;
            switchToGame(game);
        });
    });

    gameCards.forEach(card => {
        card.addEventListener('click', () => {
            const game = card.dataset.game;
            if (game) switchToGame(game);
        });
    });

    backBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchToGame('lobby');
        });
    });

    function switchToGame(game) {
        navBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.game === game);
        });

        gameSections.forEach(section => {
            section.classList.toggle('active', section.id === game);
        });
    }
}

// ==================== SLOT MACHINE ====================
let slotBet = 100;
let isSpinning = false;
const slotSymbols = ['🍒', '🍋', '🍊', '🍇', '🔔', '💎', '7️⃣'];
const slotPayouts = {
    '🍒': 10,
    '🍋': 8,
    '🍊': 6,
    '🍇': 5,
    '🔔': 15,
    '💎': 20,
    '7️⃣': 50
};

function initializeSlots() {
    const betBtns = document.querySelectorAll('#slots .bet-btn');
    betBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            betBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            slotBet = parseInt(btn.dataset.bet);
            document.getElementById('slotBet').textContent = slotBet;
        });
    });
    document.getElementById('spinBtn').addEventListener('click', spinSlots);
}

async function spinSlots() {
    if (isSpinning) return;
    
    if (balance < slotBet) {
        showMessage('slotMessage', 'Insufficient balance!', 'lose');
        return;
    }

    isSpinning = true;
    const spinBtn = document.getElementById('spinBtn');
    spinBtn.disabled = true;

    const reels = [
        document.getElementById('reel1'),
        document.getElementById('reel2'),
        document.getElementById('reel3')
    ];

    reels.forEach(reel => reel.classList.add('spinning'));

    const results = [];
    reels.forEach((reel, index) => {
        let spinCount = 0;
        const maxSpins = 20 + index * 5;
        
        const spinInterval = setInterval(() => {
            const symbol = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
            reel.querySelector('.symbol').textContent = symbol;
            spinCount++;

            if (spinCount >= maxSpins) {
                clearInterval(spinInterval);
                const finalSymbol = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
                reel.querySelector('.symbol').textContent = finalSymbol;
                results.push(finalSymbol);
                reel.classList.remove('spinning');

                if (results.length === 3) {
                    checkSlotWin(results);
                    isSpinning = false;
                    spinBtn.disabled = false;
                }
            }
        }, 100);
    });
}

async function checkSlotWin(results) {
    const [r1, r2, r3] = results;
    let winAmount = 0;

    if (r1 === r2 && r2 === r3) {
        const multiplier = slotPayouts[r1];
        winAmount = slotBet * multiplier;
        await updateBalance('slots', slotBet, winAmount);
        triggerVictoryAnimation(winAmount);
        showMessage('slotMessage', `🎉 WINNER! ${r1} ${r2} ${r3} - Won $${winAmount}! (${multiplier}x)`, 'win');
    } else {
        await updateBalance('slots', slotBet, 0);
        showMessage('slotMessage', `${r1} ${r2} ${r3} - Try again!`, 'lose');
    }
}

// ==================== BLACKJACK ====================
let bjBet = 50;
let deck = [];
let playerHand = [];
let dealerHand = [];
let gameInProgress = false;

function initializeBlackjack() {
    const betBtns = document.querySelectorAll('#blackjack .bet-btn');
    betBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!gameInProgress) {
                betBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                bjBet = parseInt(btn.dataset.bet);
                document.getElementById('bjBet').textContent = bjBet;
            }
        });
    });

    document.getElementById('dealBtn').addEventListener('click', dealBlackjack);
    document.getElementById('hitBtn').addEventListener('click', hit);
    document.getElementById('standBtn').addEventListener('click', stand);
    document.getElementById('doubleBtn').addEventListener('click', doubleDown);
}

function createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    deck = [];

    for (let suit of suits) {
        for (let value of values) {
            deck.push({ value, suit, color: (suit === '♥' || suit === '♦') ? 'red' : 'black' });
        }
    }

    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function getCardValue(card) {
    if (card.value === 'A') return 11;
    if (['J', 'Q', 'K'].includes(card.value)) return 10;
    return parseInt(card.value);
}

function calculateHandValue(hand) {
    let value = 0;
    let aces = 0;

    for (let card of hand) {
        value += getCardValue(card);
        if (card.value === 'A') aces++;
    }

    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }

    return value;
}

async function dealBlackjack() {
    if (balance < bjBet) {
        showMessage('bjMessage', 'Insufficient balance!', 'lose');
        return;
    }

    createDeck();
    playerHand = [deck.pop(), deck.pop()];
    dealerHand = [deck.pop(), deck.pop()];
    gameInProgress = true;

    renderBlackjackHands(false);
    
    document.getElementById('betSection').style.display = 'none';
    document.getElementById('playSection').style.display = 'block';

    if (calculateHandValue(playerHand) === 21) {
        stand();
    }
}

function hit() {
    if (!gameInProgress) return;

    playerHand.push(deck.pop());
    renderBlackjackHands(false);

    const playerValue = calculateHandValue(playerHand);
    if (playerValue > 21) {
        endBlackjackGame('Bust! You lose.', 'lose');
    } else if (playerValue === 21) {
        stand();
    }
}

async function stand() {
    if (!gameInProgress) return;

    renderBlackjackHands(true);
    
    setTimeout(async () => {
        while (calculateHandValue(dealerHand) < 17) {
            dealerHand.push(deck.pop());
            renderBlackjackHands(true);
        }

        const playerValue = calculateHandValue(playerHand);
        const dealerValue = calculateHandValue(dealerHand);
        let winAmount = 0;

        if (dealerValue > 21) {
            winAmount = bjBet * 2;
            await updateBalance('blackjack', bjBet, winAmount);
            triggerVictoryAnimation(winAmount);
            endBlackjackGame(`Dealer busts! You win $${winAmount}!`, 'win');
        } else if (playerValue > dealerValue) {
            winAmount = bjBet * 2;
            await updateBalance('blackjack', bjBet, winAmount);
            triggerVictoryAnimation(winAmount);
            endBlackjackGame(`You win $${winAmount}!`, 'win');
        } else if (playerValue === dealerValue) {
            balance += bjBet;
            endBlackjackGame('Push! Bet returned.', 'info');
        } else {
            await updateBalance('blackjack', bjBet, 0);
            endBlackjackGame('Dealer wins.', 'lose');
        }
    }, 1000);
}

function doubleDown() {
    if (!gameInProgress || playerHand.length !== 2) return;
    
    if (balance < bjBet) {
        showMessage('bjMessage', 'Insufficient balance to double!', 'lose');
        return;
    }

    balance -= bjBet;
    bjBet *= 2;
    updateBalance();

    playerHand.push(deck.pop());
    renderBlackjackHands(false);

    const playerValue = calculateHandValue(playerHand);
    if (playerValue > 21) {
        endBlackjackGame('Bust! You lose.', 'lose');
    } else {
        stand();
    }
}

function renderBlackjackHands(showDealerCard) {
    const playerCardsEl = document.getElementById('playerCards');
    const dealerCardsEl = document.getElementById('dealerCards');

    playerCardsEl.innerHTML = '';
    playerHand.forEach(card => {
        playerCardsEl.appendChild(createCardElement(card));
    });
    document.getElementById('playerScore').textContent = `(${calculateHandValue(playerHand)})`;

    dealerCardsEl.innerHTML = '';
    dealerHand.forEach((card, index) => {
        if (index === 1 && !showDealerCard) {
            dealerCardsEl.appendChild(createCardBack());
        } else {
            dealerCardsEl.appendChild(createCardElement(card));
        }
    });

    if (showDealerCard) {
        document.getElementById('dealerScore').textContent = `(${calculateHandValue(dealerHand)})`;
    } else {
        document.getElementById('dealerScore').textContent = '';
    }
}

function createCardElement(card) {
    const cardEl = document.createElement('div');
    cardEl.className = `card ${card.color}`;
    cardEl.innerHTML = `
        <div class="card-value">${card.value}</div>
        <div class="card-suit">${card.suit}</div>
        <div class="card-value">${card.value}</div>
    `;
    return cardEl;
}

function createCardBack() {
    const cardEl = document.createElement('div');
    cardEl.className = 'card card-back';
    cardEl.textContent = '🂠';
    return cardEl;
}

function endBlackjackGame(message, type) {
    gameInProgress = false;
    updateBalance();
    updateStats();
    showMessage('bjMessage', message, type);
    
    document.getElementById('betSection').style.display = 'block';
    document.getElementById('playSection').style.display = 'none';
}

// ==================== ROULETTE ====================
let rouletteChipValue = 10;
let rouletteBets = {};
let rouletteTotalBet = 0;
let rouletteSpinning = false;

const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

function initializeRoulette() {
    const chipBtns = document.querySelectorAll('.chip-btn');
    chipBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            chipBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            rouletteChipValue = parseInt(btn.dataset.value);
        });
    });

    const betCells = document.querySelectorAll('.number-cell, .outside-bet');
    betCells.forEach(cell => {
        cell.addEventListener('click', () => {
            if (!rouletteSpinning) {
                placeBet(cell);
            }
        });
    });

    document.getElementById('spinRouletteBtn').addEventListener('click', spinRoulette);
    document.getElementById('clearBetsBtn').addEventListener('click', clearRouletteBets);
}

function placeBet(cell) {
    const betType = cell.dataset.bet;
    
    if (balance < rouletteChipValue) {
        showMessage('rouletteMessage', 'Insufficient balance!', 'lose');
        return;
    }

    if (!rouletteBets[betType]) {
        rouletteBets[betType] = 0;
    }

    rouletteBets[betType] += rouletteChipValue;
    balance -= rouletteChipValue;
    rouletteTotalBet += rouletteChipValue;

    updateBalance();
    updateRouletteBetDisplay(cell, rouletteBets[betType]);
    document.getElementById('rouletteTotalBet').textContent = rouletteTotalBet;
}

function updateRouletteBetDisplay(cell, amount) {
    cell.classList.add('bet-placed');
    
    let chipEl = cell.querySelector('.bet-chip');
    if (!chipEl) {
        chipEl = document.createElement('div');
        chipEl.className = 'bet-chip';
        cell.appendChild(chipEl);
    }
    chipEl.textContent = '$' + amount;
}

function clearRouletteBets() {
    if (rouletteSpinning) return;

    balance += rouletteTotalBet;
    updateBalance();

    rouletteBets = {};
    rouletteTotalBet = 0;
    document.getElementById('rouletteTotalBet').textContent = '0';

    document.querySelectorAll('.bet-placed').forEach(cell => {
        cell.classList.remove('bet-placed');
        const chipEl = cell.querySelector('.bet-chip');
        if (chipEl) chipEl.remove();
    });
}

async function spinRoulette() {
    if (rouletteSpinning || rouletteTotalBet === 0) {
        if (rouletteTotalBet === 0) {
            showMessage('rouletteMessage', 'Place a bet first!', 'info');
        }
        return;
    }

    rouletteSpinning = true;
    const wheel = document.getElementById('rouletteWheel');
    wheel.classList.add('spinning');

    setTimeout(async () => {
        const winningNumber = Math.floor(Math.random() * 37);
        document.getElementById('winningNumber').textContent = winningNumber;
        wheel.classList.remove('spinning');

        await checkRouletteWins(winningNumber);
        rouletteSpinning = false;
    }, 3000);
}

async function checkRouletteWins(winningNumber) {
    let totalWinAmount = 0;

    for (let [betType, betAmount] of Object.entries(rouletteBets)) {
        let won = false;
        let payout = 0;

        if (betType == winningNumber) {
            won = true;
            payout = betAmount * 36;
        }
        else if (betType === 'red' && redNumbers.includes(winningNumber)) {
            won = true;
            payout = betAmount * 2;
        }
        else if (betType === 'black' && blackNumbers.includes(winningNumber)) {
            won = true;
            payout = betAmount * 2;
        }
        else if (betType === 'even' && winningNumber > 0 && winningNumber % 2 === 0) {
            won = true;
            payout = betAmount * 2;
        }
        else if (betType === 'odd' && winningNumber % 2 === 1) {
            won = true;
            payout = betAmount * 2;
        }
        else if (betType === '1-18' && winningNumber >= 1 && winningNumber <= 18) {
            won = true;
            payout = betAmount * 2;
        }
        else if (betType === '19-36' && winningNumber >= 19 && winningNumber <= 36) {
            won = true;
            payout = betAmount * 2;
        }

        if (won) {
            totalWinAmount += payout;
        }
    }

    if (totalWinAmount > 0) {
        await updateBalance('roulette', rouletteTotalBet, totalWinAmount);
        triggerVictoryAnimation(totalWinAmount);
        const profit = totalWinAmount - rouletteTotalBet;
        showMessage('rouletteMessage', `🎉 Number ${winningNumber}! Won $${totalWinAmount}! (Profit: $${profit})`, 'win');
    } else {
        await updateBalance('roulette', rouletteTotalBet, 0);
        showMessage('rouletteMessage', `Number ${winningNumber} - Better luck next time!`, 'lose');
    }

    setTimeout(() => {
        rouletteBets = {};
        rouletteTotalBet = 0;
        document.getElementById('rouletteTotalBet').textContent = '0';
        document.querySelectorAll('.bet-placed').forEach(cell => {
            cell.classList.remove('bet-placed');
            const chipEl = cell.querySelector('.bet-chip');
            if (chipEl) chipEl.remove();
        });
    }, 5000);
}

// ==================== DICE GAME ====================
let diceBet = 100;
let diceRolling = false;

function initializeDice() {
    const betBtns = document.querySelectorAll('#dice .bet-btn');
    betBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            betBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            diceBet = parseInt(btn.dataset.bet);
            document.getElementById('diceBet').textContent = diceBet;
        });
    });

    const predictBtns = document.querySelectorAll('.predict-btn');
    predictBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            predictBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    document.getElementById('diceRollBtn').addEventListener('click', rollDice);
}

async function rollDice() {
    if (diceRolling) return;
    
    if (balance < diceBet) {
        showMessage('diceMessage', 'Insufficient balance!', 'lose');
        return;
    }

    const prediction = document.querySelector('.predict-btn.active').dataset.predict;
    diceRolling = true;

    const dice1 = document.getElementById('dice1');
    const dice2 = document.getElementById('dice2');
    const diceTotal = document.getElementById('diceTotal');
    const rollBtn = document.getElementById('diceRollBtn');

    rollBtn.disabled = true;
    dice1.classList.add('rolling');
    dice2.classList.add('rolling');

    let rolls = 0;
    const rollInterval = setInterval(async () => {
        dice1.textContent = Math.floor(Math.random() * 6) + 1;
        dice2.textContent = Math.floor(Math.random() * 6) + 1;
        rolls++;

        if (rolls > 20) {
            clearInterval(rollInterval);
            const result1 = Math.floor(Math.random() * 6) + 1;
            const result2 = Math.floor(Math.random() * 6) + 1;
            const total = result1 + result2;

            dice1.textContent = result1;
            dice2.textContent = result2;
            diceTotal.textContent = total;
            dice1.classList.remove('rolling');
            dice2.classList.remove('rolling');

            let won = false;
            if (prediction === 'high' && total >= 7) won = true;
            if (prediction === 'low' && total <= 7) won = true;

            if (won) {
                const winAmount = diceBet * 2;
                await updateBalance('dice', diceBet, winAmount);
                triggerVictoryAnimation(winAmount);
                showMessage('diceMessage', `🎲 You won $${winAmount}!`, 'win');
            } else {
                await updateBalance('dice', diceBet, 0);
                showMessage('diceMessage', `🎲 You lost! Better luck next time.`, 'lose');
            }

            diceRolling = false;
            rollBtn.disabled = false;
        }
    }, 100);
}

// ==================== POKER GAME ====================
let pokerBet = 100;
let pokerGameInProgress = false;

function initializePoker() {
    const betBtns = document.querySelectorAll('#poker .bet-btn');
    betBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!pokerGameInProgress) {
                betBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                pokerBet = parseInt(btn.dataset.bet);
                document.getElementById('pokerBet').textContent = pokerBet;
            }
        });
    });

    document.getElementById('dealPokerBtn').addEventListener('click', dealPoker);
    document.getElementById('foldBtn').addEventListener('click', foldPoker);
    document.getElementById('callBtn').addEventListener('click', callPoker);
    document.getElementById('raiseBtn').addEventListener('click', raisePoker);
}

async function dealPoker() {
    if (balance < pokerBet) {
        showMessage('pokerMessage', 'Insufficient balance!', 'lose');
        return;
    }

    pokerGameInProgress = true;

    const playerCard1 = createRandomCard();
    const playerCard2 = createRandomCard();
    const dealerCard1 = createRandomCard();
    const dealerCard2 = createRandomCard();

    document.getElementById('playerPokerCards').innerHTML = '';
    document.getElementById('playerPokerCards').appendChild(createCardElement(playerCard1));
    document.getElementById('playerPokerCards').appendChild(createCardElement(playerCard2));

    document.getElementById('dealerPokerCards').innerHTML = '';
    document.getElementById('dealerPokerCards').appendChild(createCardBack());
    document.getElementById('dealerPokerCards').appendChild(createCardElement(dealerCard2));

    document.getElementById('pokerBetSection').style.display = 'none';
    document.getElementById('pokerPlaySection').style.display = 'block';

    window.pokerData = { playerCard1, playerCard2, dealerCard1, dealerCard2 };
}

async function foldPoker() {
    await updateBalance('poker', pokerBet, 0);
    showMessage('pokerMessage', 'You folded! Dealer wins.', 'lose');
    endPokerGame();
}

async function callPoker() {
    endPokerGame();
}

async function raisePoker() {
    if (balance < pokerBet) {
        showMessage('pokerMessage', 'Insufficient balance to raise!', 'lose');
        return;
    }
    endPokerGame();
}

async function endPokerGame() {
    const playerRank = getCardRank(window.pokerData.playerCard1) + getCardRank(window.pokerData.playerCard2);
    const dealerRank = getCardRank(window.pokerData.dealerCard1) + getCardRank(window.pokerData.dealerCard2);

    document.getElementById('dealerPokerCards').innerHTML = '';
    document.getElementById('dealerPokerCards').appendChild(createCardElement(window.pokerData.dealerCard1));
    document.getElementById('dealerPokerCards').appendChild(createCardElement(window.pokerData.dealerCard2));

    if (playerRank > dealerRank) {
        const winAmount = pokerBet * 2;
        await updateBalance('poker', pokerBet, winAmount);
        triggerVictoryAnimation(winAmount);
        showMessage('pokerMessage', `🃏 You win $${winAmount}!`, 'win');
    } else if (playerRank === dealerRank) {
        balance += pokerBet;
        showMessage('pokerMessage', 'Push! Bet returned.', 'info');
    } else {
        await updateBalance('poker', pokerBet, 0);
        showMessage('pokerMessage', '🃏 Dealer wins!', 'lose');
    }

    updateBalance();
    updateStats();
    pokerGameInProgress = false;

    setTimeout(() => {
        document.getElementById('pokerBetSection').style.display = 'block';
        document.getElementById('pokerPlaySection').style.display = 'none';
    }, 2000);
}

function createRandomCard() {
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const suits = ['♠', '♥', '♦', '♣'];
    const value = values[Math.floor(Math.random() * values.length)];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    return { value, suit, color: (suit === '♥' || suit === '♦') ? 'red' : 'black' };
}

function getCardRank(card) {
    const ranks = { 'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };
    return ranks[card.value];
}

// ==================== KENO GAME ====================
let kenoBet = 100;
let kenoSpinning = false;
let kenoSelectedNumbers = [];

function initializeKeno() {
    const betBtns = document.querySelectorAll('#keno .bet-btn');
    betBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            betBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            kenoBet = parseInt(btn.dataset.bet);
            document.getElementById('kenoBet').textContent = kenoBet;
        });
    });

    generateKenoGrid();
    document.getElementById('kenoDrawBtn').addEventListener('click', drawKeno);
    document.getElementById('kenoResetBtn').addEventListener('click', resetKenoPicks);
}

function generateKenoGrid() {
    const grid = document.getElementById('kenoGrid');
    grid.innerHTML = '';
    for (let i = 1; i <= 80; i++) {
        const cell = document.createElement('div');
        cell.className = 'keno-cell';
        cell.textContent = i;
        cell.addEventListener('click', () => {
            if (!kenoSpinning && kenoSelectedNumbers.length < 10 || kenoSelectedNumbers.includes(i)) {
                toggleKenoNumber(cell, i);
            }
        });
        grid.appendChild(cell);
    }
}

function toggleKenoNumber(cell, num) {
    if (kenoSelectedNumbers.includes(num)) {
        kenoSelectedNumbers = kenoSelectedNumbers.filter(n => n !== num);
        cell.classList.remove('selected');
    } else {
        kenoSelectedNumbers.push(num);
        cell.classList.add('selected');
    }
    document.getElementById('kenoPicks').textContent = kenoSelectedNumbers.length;
}

async function drawKeno() {
    if (kenoSpinning) return;
    if (kenoSelectedNumbers.length === 0) {
        showMessage('kenoMessage', 'Select numbers first!', 'info');
        return;
    }
    if (balance < kenoBet) {
        showMessage('kenoMessage', 'Insufficient balance!', 'lose');
        return;
    }

    kenoSpinning = true;

    const drawnNumbers = [];
    const allNumbers = [];
    for (let i = 1; i <= 80; i++) allNumbers.push(i);

    for (let i = allNumbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allNumbers[i], allNumbers[j]] = [allNumbers[j], allNumbers[i]];
    }

    let drawCount = 0;
    const drawInterval = setInterval(async () => {
        const num = allNumbers[drawCount];
        drawnNumbers.push(num);
        
        const cells = document.querySelectorAll('.keno-cell');
        cells.forEach(cell => {
            if (parseInt(cell.textContent) === num) {
                cell.classList.add('drawn');
            }
        });

        drawCount++;
        if (drawCount >= 20) {
            clearInterval(drawInterval);
            const matches = kenoSelectedNumbers.filter(n => drawnNumbers.includes(n)).length;
            let payout = 0;

            if (matches >= 2) {
                const payouts = { 2: 2, 3: 5, 4: 15, 5: 50, 6: 150 };
                payout = (payouts[matches] || 0) * kenoBet;
            }

            if (payout > 0) {
                await updateBalance('keno', kenoBet, payout);
                triggerVictoryAnimation(payout);
                showMessage('kenoMessage', `🎉 ${matches} matches! Won $${payout}!`, 'win');
            } else {
                await updateBalance('keno', kenoBet, 0);
                showMessage('kenoMessage', `${matches} matches - Try again!`, 'lose');
            }

            kenoSpinning = false;
            setTimeout(() => {
                resetKenoPicks();
            }, 3000);
        }
    }, 150);
}

function resetKenoPicks() {
    kenoSelectedNumbers = [];
    document.getElementById('kenoPicks').textContent = '0';
    const cells = document.querySelectorAll('.keno-cell');
    cells.forEach(cell => {
        cell.classList.remove('selected', 'drawn');
    });
}
