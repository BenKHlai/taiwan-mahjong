/**
 * 台灣麻雀 - 網頁原型 v2
 * Taiwan Mahjong Web Prototype
 */

// ==================== 牌的定義 ====================
const WINDS = ['東', '南', '西', '北'];
const DRAGONS = ['紅中', '發財', '白板'];
const FLOWERS = ['春', '夏', '秋', '冬', '梅', '蘭', '菊', '竹'];
const JOKERS = ['皇', '筒索萬', '筒', '索', '萬', '番', '東南西北', '中發白'];
const NUMBERS = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

// ==================== 遊戲狀態 ====================
let gameState = {
    phase: 'waiting',
    wall: [],
    deadWall: [],
    players: [],
    currentPlayer: 0,
    dealer: 0,
    round: 1,
    consecutiveWins: 0,
    lastDiscarded: null,
    lastDiscardedBy: -1,
    selectedTile: null,
    pendingActions: {}
};

// ==================== 牌組生成 ====================
function createTileSet() {
    let tiles = [];
    let id = 0;
    
    // 萬子、筒子、索子各 4 張 (1-9)
    ['wan', 'tong', 'suo'].forEach(type => {
        for (let n = 1; n <= 9; n++) {
            for (let i = 0; i < 4; i++) {
                tiles.push({
                    id: id++,
                    type: type,
                    number: n,
                    name: getTileName(type, n)
                });
            }
        }
    });
    
    // 風牌各 4 張
    WINDS.forEach((wind, idx) => {
        for (let i = 0; i < 4; i++) {
            tiles.push({
                id: id++,
                type: 'wind',
                windIndex: idx,
                name: wind
            });
        }
    });
    
    // 三元牌各 4 張
    DRAGONS.forEach((dragon, idx) => {
        for (let i = 0; i < 4; i++) {
            tiles.push({
                id: id++,
                type: 'dragon',
                dragonIndex: idx,
                name: dragon
            });
        }
    });
    
    // 花牌各 1 張
    FLOWERS.forEach((flower, idx) => {
        tiles.push({
            id: id++,
            type: 'flower',
            flowerIndex: idx,
            name: flower
        });
    });
    
    // 搭子各 1 張 (8隻)
    JOKERS.forEach((joker, idx) => {
        tiles.push({
            id: id++,
            type: 'joker',
            jokerIndex: idx,
            name: joker
        });
    });
    
    return tiles;
}

function getTileName(type, number) {
    if (type === 'wan') return NUMBERS[number - 1] + '萬';
    if (type === 'tong') return NUMBERS[number - 1] + '筒';
    if (type === 'suo') return NUMBERS[number - 1] + '索';
    return '';
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// ==================== 遊戲初始化 ====================
function startGame() {
    console.log('Starting game...');
    
    // 清空棄牌區
    document.getElementById('discardArea').innerHTML = '';
    
    // 創建牌組
    let tiles = createTileSet();
    shuffleArray(tiles);
    
    // 初始化玩家
    gameState.players = [
        { id: 0, name: '你', hand: [], melds: [], flowers: [], jokers: [], isAI: false, isDealer: true },
        { id: 1, name: 'AI 小強', hand: [], melds: [], flowers: [], jokers: [], isAI: true },
        { id: 2, name: 'AI 小華', hand: [], melds: [], flowers: [], jokers: [], isAI: true },
        { id: 3, name: 'AI 小明', hand: [], melds: [], flowers: [], jokers: [], isAI: true }
    ];
    
    // 設置牌牆（先保留槌牌）
    gameState.deadWall = tiles.splice(tiles.length - 16);
    gameState.wall = tiles;
    
    // 發牌：每位 16 張（莊家 17 張）
    gameState.players.forEach((player, idx) => {
        let count = player.isDealer ? 17 : 16;
        for (let i = 0; i < count; i++) {
            let tile = gameState.wall.pop();
            distributeTile(player, tile);
        }
    });
    
    gameState.currentPlayer = 0;
    gameState.dealer = 0;
    gameState.phase = 'drawing';
    gameState.lastDiscarded = null;
    gameState.lastDiscardedBy = -1;
    gameState.selectedTile = null;
    
    closeModal();
    updateUI();
    showMessage('遊戲開始！你是莊家，請摸牌。');
}

function distributeTile(player, tile) {
    if (tile.type === 'flower') {
        player.flowers.push(tile);
        // 補牌
        if (gameState.deadWall.length > 0) {
            let supplement = gameState.deadWall.pop();
            distributeTile(player, supplement);
        }
    } else if (tile.type === 'joker') {
        player.jokers.push(tile);
    } else {
        player.hand.push(tile);
    }
}

// ==================== 遊戲動作 ====================
function drawTile() {
    if (gameState.phase !== 'drawing') return;
    if (gameState.currentPlayer !== 0) return;
    
    if (gameState.wall.length === 0) {
        showMessage('牌牆已空！流局！');
        gameState.phase = 'ended';
        return;
    }
    
    let tile = gameState.wall.pop();
    distributeTile(gameState.players[0], tile);
    
    if (tile.type === 'flower') {
        showMessage('補花！自動補牌...');
        setTimeout(() => {
            gameState.phase = 'discarding';
            updateUI();
            showMessage('請選擇一張牌打出');
        }, 500);
    } else {
        gameState.phase = 'discarding';
        showMessage(`摸到 ${tile.name}`);
    }
    
    updateUI();
}

function selectTile(index) {
    if (gameState.phase !== 'discarding') return;
    if (gameState.currentPlayer !== 0) return;
    
    gameState.selectedTile = (gameState.selectedTile === index) ? null : index;
    updateUI();
}

function discardTile() {
    if (gameState.phase !== 'discarding') return;
    if (gameState.currentPlayer !== 0) return;
    if (gameState.selectedTile === null) {
        showMessage('請先選擇一張牌！');
        return;
    }
    
    let player = gameState.players[0];
    let tile = player.hand.splice(gameState.selectedTile, 1)[0];
    
    gameState.lastDiscarded = tile;
    gameState.lastDiscardedBy = 0;
    gameState.selectedTile = null;
    
    addDiscardedTile(tile);
    showMessage(`你打出 ${tile.name}`);
    
    // 檢查 AI 是否可以吃碰槓胡
    checkAIClaims(tile, 0);
}

function addDiscardedTile(tile) {
    let area = document.getElementById('discardArea');
    let div = document.createElement('div');
    div.className = 'tile tile-small ' + getTileClass(tile);
    div.textContent = tile.name;
    area.appendChild(div);
}

function checkAIClaims(tile, discardedBy) {
    gameState.pendingActions = {};
    
    for (let i = 1; i < 4; i++) {
        let player = gameState.players[i];
        
        if (canWin(player, tile)) {
            gameState.pendingActions[i] = 'hu';
            continue;
        }
        if (canKong(player, tile)) {
            gameState.pendingActions[i] = 'kong';
            continue;
        }
        if (canPong(player, tile)) {
            gameState.pendingActions[i] = 'pong';
            continue;
        }
        if ((discardedBy + 1) % 4 === i && canChow(player, tile)) {
            gameState.pendingActions[i] = 'chow';
        }
    }
    
    if (Object.keys(gameState.pendingActions).length > 0) {
        processAIClaims();
    } else {
        nextPlayer();
    }
}

function processAIClaims() {
    let actions = gameState.pendingActions;
    let bestAction = null;
    let bestPlayer = null;
    
    for (let [playerIdx, action] of Object.entries(actions)) {
        if (action === 'hu') {
            bestAction = action;
            bestPlayer = parseInt(playerIdx);
            break;
        }
        if (action === 'kong' && (!bestAction || bestAction === 'chow' || bestAction === 'pong')) {
            bestAction = action;
            bestPlayer = parseInt(playerIdx);
        }
        if (action === 'pong' && (!bestAction || bestAction === 'chow')) {
            bestAction = action;
            bestPlayer = parseInt(playerIdx);
        }
        if (action === 'chow' && !bestAction) {
            bestAction = action;
            bestPlayer = parseInt(playerIdx);
        }
    }
    
    if (bestAction === 'hu') {
        let winner = gameState.players[bestPlayer];
        showResult(winner, false);
        return;
    }
    
    if (bestAction === 'kong' || bestAction === 'pong') {
        let player = gameState.players[bestPlayer];
        let count = bestAction === 'kong' ? 3 : 2;
        
        for (let i = 0; i < count; i++) {
            let idx = player.hand.findIndex(t => tilesMatch(t, gameState.lastDiscarded));
            if (idx !== -1) player.hand.splice(idx, 1);
        }
        
        player.melds.push({ type: bestAction, tile: gameState.lastDiscarded });
        
        showMessage(`${player.name} ${bestAction === 'kong' ? '槓' : '碰'} ${gameState.lastDiscarded.name}！`);
        
        gameState.currentPlayer = bestPlayer;
        gameState.phase = 'discarding';
        
        setTimeout(() => aiDiscard(bestPlayer), 1000);
        return;
    }
    
    nextPlayer();
}

function nextPlayer() {
    gameState.currentPlayer = (gameState.currentPlayer + 1) % 4;
    gameState.phase = 'drawing';
    gameState.pendingActions = {};
    
    if (gameState.currentPlayer !== 0) {
        setTimeout(() => aiTurn(gameState.currentPlayer), 500);
    } else {
        showMessage('輪到你摸牌！');
    }
    
    updateUI();
}

// ==================== AI 邏輯 ====================
function aiTurn(playerIdx) {
    let player = gameState.players[playerIdx];
    
    if (gameState.wall.length === 0) {
        showMessage('牌牆已空！流局！');
        gameState.phase = 'ended';
        return;
    }
    
    let tile = gameState.wall.pop();
    distributeTile(player, tile);
    
    showMessage(`${player.name} 摸牌...`);
    
    setTimeout(() => aiDiscard(playerIdx), 800);
}

function aiDiscard(playerIdx) {
    let player = gameState.players[playerIdx];
    
    // 簡單 AI：優先打孤張
    let tileToDiscard = selectAITileToDiscard(player);
    let idx = player.hand.findIndex(t => t.id === tileToDiscard.id);
    if (idx !== -1) {
        player.hand.splice(idx, 1);
    }
    
    gameState.lastDiscarded = tileToDiscard;
    gameState.lastDiscardedBy = playerIdx;
    addDiscardedTile(tileToDiscard);
    
    showMessage(`${player.name} 打出 ${tileToDiscard.name}`);
    
    // 檢查玩家是否可以吃碰槓胡
    checkPlayerClaims(tileToDiscard, playerIdx);
}

function selectAITileToDiscard(player) {
    // 優先打孤張字牌
    for (let tile of player.hand) {
        let count = player.hand.filter(t => tilesMatch(t, tile)).length;
        if (count === 1 && (tile.type === 'wind' || tile.type === 'dragon')) {
            return tile;
        }
    }
    
    // 打孤張數牌
    for (let tile of player.hand) {
        let count = player.hand.filter(t => tilesMatch(t, tile)).length;
        if (count === 1) {
            return tile;
        }
    }
    
    return player.hand[player.hand.length - 1];
}

function checkPlayerClaims(tile, discardedBy) {
    let player = gameState.players[0];
    gameState.pendingActions = {};
    
    let canHu_ = canWin(player, tile);
    let canKong_ = canKong(player, tile);
    let canPong_ = canPong(player, tile);
    let canChow_ = (discardedBy + 1) % 4 === 0 && canChow(player, tile);
    
    if (canHu_ || canKong_ || canPong_ || canChow_) {
        showActionPanel(canHu_, canKong_, canPong_, canChow_);
    } else {
        setTimeout(() => nextPlayer(), 500);
    }
}

function showActionPanel(canHu, canKong, canPong, canChow) {
    let panel = document.getElementById('actionPanel');
    panel.classList.add('active');
    
    document.getElementById('btnChow').style.display = canChow ? 'inline-block' : 'none';
    document.getElementById('btnPong').style.display = canPong ? 'inline-block' : 'none';
    document.getElementById('btnKong').style.display = canKong ? 'inline-block' : 'none';
    document.getElementById('btnHu').style.display = canHu ? 'inline-block' : 'none';
}

function doAction(action) {
    let panel = document.getElementById('actionPanel');
    panel.classList.remove('active');
    
    if (action === 'hu') {
        showResult(gameState.players[0], true);
        return;
    }
    
    if (action === 'pass') {
        nextPlayer();
        return;
    }
    
    let player = gameState.players[0];
    let count = action === 'kong' ? 3 : 2;
    
    for (let i = 0; i < count; i++) {
        let idx = player.hand.findIndex(t => tilesMatch(t, gameState.lastDiscarded));
        if (idx !== -1) player.hand.splice(idx, 1);
    }
    
    player.melds.push({ type: action, tile: gameState.lastDiscarded });
    
    showMessage(`你${action === 'kong' ? '槓' : action === 'pong' ? '碰' : '吃'}了 ${gameState.lastDiscarded.name}！`);
    
    gameState.phase = 'discarding';
    gameState.currentPlayer = 0;
    updateUI();
}

// ==================== 牌型檢查 ====================
function tilesMatch(t1, t2) {
    if (t1.type !== t2.type) return false;
    if (t1.number !== undefined && t1.number !== t2.number) return false;
    if (t1.windIndex !== undefined && t1.windIndex !== t2.windIndex) return false;
    if (t1.dragonIndex !== undefined && t1.dragonIndex !== t2.dragonIndex) return false;
    return true;
}

function canPong(player, tile) {
    if (tile.type === 'flower' || tile.type === 'joker') return false;
    let count = player.hand.filter(t => tilesMatch(t, tile)).length;
    return count >= 2;
}

function canKong(player, tile) {
    if (tile.type === 'flower' || tile.type === 'joker') return false;
    let count = player.hand.filter(t => tilesMatch(t, tile)).length;
    return count >= 3;
}

function canChow(player, tile) {
    if (!tile.number) return false;
    
    let num = tile.number;
    let type = tile.type;
    
    let hasN1 = player.hand.some(t => t.type === type && t.number === num - 1);
    let hasN2 = player.hand.some(t => t.type === type && t.number === num + 1);
    let hasN_1 = player.hand.some(t => t.type === type && t.number === num - 2);
    let hasN2_ = player.hand.some(t => t.type === type && t.number === num + 2);
    
    return (hasN1 && hasN2) || (hasN_1 && hasN1) || (hasN2 && hasN2_);
}

function canWin(player, tile) {
    // 簡化版胡牌檢查：需要完成合法牌型
    // 5組刻子/順子 + 1對眼 = 17張
    let tempHand = [...player.hand, tile];
    return checkWinningHand(tempHand, player.melds);
}

function checkWinningHand(hand, melds) {
    // 簡化版：檢查牌數是否正確
    let totalTiles = hand.length + melds.length * 3;
    // 台灣麻雀胡牌需要17張
    return totalTiles === 17;
}

// ==================== 計番系統 ====================
function calculateScore(player, isSelfDraw) {
    let fans = {};
    let total = 0;
    
    // 花牌計算
    let correctFlowers = 0;
    let wrongFlowers = 0;
    
    player.flowers.forEach(f => {
        // 東位對應春、梅
        if (f.flowerIndex === 0 || f.flowerIndex === 4) {
            correctFlowers++;
        } else {
            wrongFlowers++;
        }
    });
    
    if (correctFlowers + wrongFlowers === 0) {
        fans['無花'] = 1;
        total += 1;
    }
    if (correctFlowers > 0) {
        fans['正花'] = correctFlowers * 2;
        total += correctFlowers * 2;
    }
    if (wrongFlowers > 0) {
        fans['爛花'] = wrongFlowers;
        total += wrongFlowers;
    }
    
    // 自摸
    if (isSelfDraw) {
        fans['自摸'] = 1;
        total += 1;
    }
    
    // 門清
    let isConcealed = player.melds.length === 0;
    if (isConcealed) {
        if (isSelfDraw) {
            fans['門清自摸'] = 5;
            total += 5;
        } else {
            fans['門清'] = 3;
            total += 3;
        }
    }
    
    // 莊家
    if (player.isDealer) {
        fans['做莊'] = 1;
        total += 1;
    }
    
    return { fans, total };
}

function showResult(winner, isSelfDraw) {
    gameState.phase = 'ended';
    
    let result = calculateScore(winner, isSelfDraw);
    
    document.getElementById('resultTitle').textContent = 
        `${winner.name} ${isSelfDraw ? '自摸' : '胡牌'}！`;
    
    let fanList = document.getElementById('fanList');
    fanList.innerHTML = '';
    
    for (let [name, count] of Object.entries(result.fans)) {
        let div = document.createElement('div');
        div.className = 'fan-item';
        div.innerHTML = `<span>${name}</span><span>${count}番</span>`;
        fanList.appendChild(div);
    }
    
    let base = 10;
    let perFan = 2;
    let amount = result.total * perFan + base;
    
    document.getElementById('totalScore').textContent = `總計: ${result.total}番 = $${amount}`;
    
    document.getElementById('resultModal').classList.add('active');
}

// ==================== UI 更新 ====================
function updateUI() {
    document.getElementById('wallCount').textContent = gameState.wall.length;
    document.getElementById('round').textContent = gameState.round;
    document.getElementById('consecutive').textContent = gameState.consecutiveWins;
    
    renderPlayerHand();
    renderOpponents();
    renderFlowers();
    renderMelds();
    updateButtons();
}

function renderPlayerHand() {
    let container = document.getElementById('playerHand');
    container.innerHTML = '';
    
    let player = gameState.players[0];
    if (!player) return;
    
    let sorted = [...player.hand].sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return (a.number || 0) - (b.number || 0);
    });
    
    sorted.forEach((tile, idx) => {
        let originalIdx = player.hand.findIndex(t => t.id === tile.id);
        let div = document.createElement('div');
        div.className = 'tile ' + getTileClass(tile);
        if (gameState.selectedTile === originalIdx) {
            div.classList.add('selected');
        }
        div.textContent = tile.name;
        div.onclick = () => selectTile(originalIdx);
        container.appendChild(div);
    });
}

function getTileClass(tile) {
    switch (tile.type) {
        case 'wan': return 'wan';
        case 'tong': return 'tong';
        case 'suo': return 'suo';
        case 'wind': return 'wind';
        case 'dragon': 
            return tile.dragonIndex === 0 ? 'dragon-red' : 
                   tile.dragonIndex === 1 ? 'dragon-green' : 'dragon-white';
        case 'flower': return 'flower';
        case 'joker': return 'joker';
        default: return '';
    }
}

function renderOpponents() {
    for (let i = 1; i <= 3; i++) {
        let container = document.getElementById(`tiles-${i}`);
        let opponentDiv = document.getElementById(`opponent-${i}`);
        
        if (container && gameState.players[i]) {
            let player = gameState.players[i];
            container.innerHTML = '';
            
            let countSpan = opponentDiv.querySelector('.tile-count');
            if (countSpan) countSpan.textContent = player.hand.length;
            
            for (let j = 0; j < Math.min(player.hand.length, 8); j++) {
                let div = document.createElement('div');
                div.className = 'tile-back';
                container.appendChild(div);
            }
        }
    }
}

function renderFlowers() {
    let container = document.getElementById('flowersArea');
    let player = gameState.players[0];
    if (!player) return;
    
    let html = '<span>花牌: </span>';
    player.flowers.forEach(f => {
        html += `<span class="tile tile-small flower" style="display:inline-flex">${f.name}</span> `;
    });
    
    if (player.jokers.length > 0) {
        html += '<span> | 搭子: </span>';
        player.jokers.forEach(j => {
            html += `<span class="tile tile-small joker" style="display:inline-flex">${j.name}</span> `;
        });
    }
    
    container.innerHTML = html;
}

function renderMelds() {
    let container = document.getElementById('meldsArea');
    let player = gameState.players[0];
    if (!player) return;
    
    container.innerHTML = '';
    player.melds.forEach(meld => {
        let div = document.createElement('div');
        div.className = 'meld';
        let label = meld.type === 'chow' ? '吃' : 
                    meld.type === 'pong' ? '碰' : 
                    meld.type === 'kong' ? '槓' : '';
        div.innerHTML = `<span class="meld-label">${label}</span>`;
        container.appendChild(div);
    });
}

function updateButtons() {
    let drawBtn = document.getElementById('btnDraw');
    let discardBtn = document.getElementById('btnDiscard');
    
    drawBtn.disabled = gameState.phase !== 'drawing' || gameState.currentPlayer !== 0;
    discardBtn.disabled = gameState.phase !== 'discarding' || gameState.selectedTile === null;
}

function showMessage(text) {
    let msg = document.getElementById('message');
    msg.textContent = text;
}

function closeModal() {
    document.getElementById('resultModal').classList.remove('active');
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    console.log('Game loaded!');
});
