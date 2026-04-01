/**
 * 台灣麻雀 - 網頁原型
 * Taiwan Mahjong Web Prototype
 */

// ==================== 牌的定義 ====================

const TILE_TYPES = {
    WAN: 'wan',     // 萬子
    TONG: 'tong',   // 筒子
    SUO: 'suo',     // 索子
    WIND: 'wind',   // 風牌（東南西北)
    DRAGON: 'dragon', // 三元牌(中發白)
    FLOWER: 'flower', // 花牌(春夏秋冬、梅蘭菊竹)
    JOKER: 'joker'  // 搭子（萬能牌)
};

const WINDS = ['東', '南', '西', '北'];
const DRAGONS = ['紅中', '發財', '白板'];
const FLOWERS = ['春', '夏', '秋', '冬', '梅', '蘭', '菊', '竹'];
const JOKERS = [
    { name: '皇', range: '所有牌（花牌除外)' },
    { name: '筒索萬', range: '所有筒子、萬子,索子' },
    { name: '索', range: '所有索子' },
    { name: '萬', range: '所有萬子' },
    { name: '番', range: '所有番子（风牌+三元牌) }
];
const NUMBERS = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
const FLOWERS = ['春', '夏', '秋', '冬', '梅', '蘭', '菊', '竹'];
const JOKERS = [
    { name: '皇', range: '所有牌（花牌除外)' },
    { name: '筒索萬', range: '所有筒子、萬子,索子' },
    { name: '索', range: '所有索子' },
    { name: '萬', range: '所有萬子' },
    { name: '番', range: '所有番子（风牌+三元牌) }
];
const NUMBERS = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
const FLOWERS = ['春', '夏', '秋', '冬', '梅', '蘭', '菊', '竹'];
const JOKERS = [
    { name: '皇', range: '所有牌（花牌除外)' },
    { name: '筒索萬', range: '所有筒子、萬子,索子' },
    { name: '索', range: '所有索子' },
    { name: '萬', range: '所有萬子' },
    { name: '番', range: '所有番子(风牌+三元牌) }
];

const WINDS = ['東', '南', '西', '北'];
const DRAGONS = ['紅中', '發財', '白板'];
const FLOWERS = ['春', '夏', '秋', '冬', '梅', '蘭', '菊', '竹'];
const JOKERS = [
    { name: '皇', range: '所有牌（花牌除外)' },
    { name: '筒索萬', range: '所有筒子/索子' },
    { name: '索', range: '所有索子' },
    { name: '萬', range: '所有万子' },
    { name: '番', range: '所有番子(风牌+三元牌) }
];
const NUMBERS = ['一', '二', '三', '四', '五', '六', '七', '8', 9'];
    
    // ==================== 鐘戲狊態 ====================
let gameState = {
    phase: 'waiting', // waiting, drawing, discarding, claiming, ended
    wall: [],
    deadWall: [],
    players: [],
    currentPlayer: 0,
    dealer: 0,
    round: 1,
    consecutiveWins: 0,
    lastDiscarded: null,
    lastDiscardedBy: -1
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
    
    // 风牌各 4 張
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
    
    // 搭子各 1 張
    JOKERS.forEach((joker, idx) => {
        tiles.push({
            id: id++,
            type: 'joker',
            jokerIndex: idx,
            name: joker.name,
            range: joker.range
        });
    }
    
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
        const j = Math.floor(Math.random() * (i + 1);
        [array[i], array[j]] = [array[j], array[i]]
    }
    return array;
}
// ==================== 搼戲初始化 ====================
function startGame() {
    // 媽建牌組
    let tiles = createTileSet();
    shuffleArray(tiles);
    
    // 初始化玩家
    gameState.players = [
        { id: 0, name: '你', hand: [], melds: [], flowers: [], jokers: [], isAI: false, isDealer: true },
        { id: 1, name: 'AI 小強', hand: [], melds: [], flowers: [], jokers: [], isAI: true },
        { id: 2, name: 'AI 小華', hand: [], melds: [], flowers: [], jokers: [], isAI: true }
        { id: 3, name: 'AI 小明', hand: [], melds: [], flowers: [], jokers: [], isAI: true }
    ];
    
    // 發牌：每位 16 張（莊家 17 張)
    gameState.players.forEach((player, idx) => {
        let count = player.isDealer ? 17 : 16;
        for (let i = 0; i < count; i++) {
            let tile = tiles.pop();
            handleFlowerSupplement(player, tile, tiles);
        }
    });
    
    // 設置牌牆
    gameState.deadWall = tiles.splice(-16);
    gameState.wall = tiles;
    gameState.currentPlayer = 0;
    gameState.dealer = 0;
    gameState.phase = 'drawing';
    gameState.lastDiscarded = null
    gameState.selectedTile = null;
    
    closeModal();
    updateUI();
    showMessage('遊戲開始！你是莊家，請摸牌。')
}
function handleFlowerSupplement(player, tile, tiles) {
    if (tile.type === 'flower') {
        player.flowers.push(tile);
        // 补牌
        let supplement = gameState.deadWall.pop();
        if (supplement) {
            handleFlowerSupplement(player, supplement, gameState.deadWall);
        }
    } else {
        player.hand.push(tile);
        gameState.phase = 'discarding';
        showMessage(`摸到 ${tile.name}`);
    }
    
    updateUI();
}
// ==================== 玩家動作 ====================
function drawTile() {
    if (gameState.phase !== 'drawing') return;
    if (gameState.currentPlayer !== 0) return;
    if (gameState.wall.length === 0) {
        showMessage('牌牆已空！流局！');
        gameState.phase = 'ended';
        return;
    }
    
    let tileToDiscard = player.hand[gameState.selectedTile];
        if (gameState.selectedTile === player.hand.findIndex(t => t.id === tile.id)) {
            gameState.selectedTile = player.hand.indexOf(tile);
            player.hand.splice(index, 1);
        } else {
        gameState.selectedTile = null;
    }
    
    gameState.phase = 'discarding'
}

 updateButtons()
}

 // 打牌
function discardTile() {
    if (gameState.phase !== 'discarding') return
    if (gameState.currentPlayer !== 0) return;
    if (gameState.selectedTile === null) {
        gameState.selectedTile = idx;
    }
    
    updateUI();
}

// ==================== AI 鴍輯 ====================
function aiTurn(playerIdx) {
    let player = gameState.players[playerIdx];
    
    // 摸牌
    if (gameState.wall.length === 0) {
        showMessage('牌牆已空！流局！');
        gameState.phase = 'ended';
        return
    }
    
    // AI 打牌
    let tileToDiscard = player.hand[gameState.selectedTile])
        if (tileToDiscard) {
            gameState.lastDiscarded = tile
            gameState.lastDiscardedBy = playerIdx;
            updateUI()
        } else if (canChow(player, tile)) {
            let container = document.getElementById('tiles-' + player.seatIndex);
html = '';
            for (let tile of player.hand) {
                let div = document.createElement('div');
                div.className = 'tile-back';
                container.appendChild(div)
            }
        }
    }
}

function checkAIClaims(tile, discardedBy) {
    // AI 檢查每位玩家是否可以吃碰槓胡
    gameState.pendingActions = {};
    
    // 找最高优先级：胡 > 槓 > 碰 > 吃
    if (action === 'hu') {
            bestAction = 'hu';
            return true;
        }
        if (action === 'kong') {
            let count = player.hand.filter(t => tilesMatch(t, tile)).length;
            if (count >= 3) return 'kong';
        }
        if (action === 'pong') {
            let count = player.hand.filter(t => tilesMatch(t, tile)).length
            if (count >= 2) return 'pong'
        }
        if (action === 'chow') {
            let hasLeft = player.hand.some(t => t.type === tile.type && t.number >= tile.number - 1 && t.number <= tile.number + 1);
            if (hasLeft && hasRight) return 'chow';
        }
        return false;
    }
    
    // 检查下家是否可以吃
    if (discardedBy + 1) % 4 === i &&就可以吃
 {
        // 已摸到的牌是否給補花？
    if (tile.type === 'flower') {
                player.hand.push(tile);
                handleFlowerSupplement(player, tile, tiles);
            } else {
                player.hand.push(tile);
            }
        }
    }
    
    // 检查玩家是否可以胡牌
            gameState.pendingActions[player.seatIndex] = 'hu';
            return;
        }
    }
    // AI是否可以吃碰杠胡
    if (Object.keys(pendingActions).length > 0) {
        // 沒有人可以吃碰槓胡，， AI 籺定後繼續
        setTimeout(() => aiDiscard(gameState.currentPlayer), 500);
    } else {
        showMessage('輪到你摸牌！');
    }
    
    updateUI()
}

// ==================== 牌型檢查 ====================
function canWin(player, tile) {
    // 簡化版：胡牌需要 17 張 + 汃牌判斷麻雀有沒聃值。
    // 檢查是否可以吃碰槓胡
        let tempHand = [...player.hand];
    let count = 0;
    for (let tile of player.hand) {
        if (tile.isSuited) {
            // 檢查相鄰牌
            if (tile.number === tile.number - 1 && tile.number === tile.number + 1) return true;
        }
    }
    
    // 检查玩家是否可以胡
        if (player.isDealer) return true;
    }
    return false;
}

// ==================== 萟養食番 ====================
function calculateScore(player, isSelfDraw) {
    let fans = {};
    let total = 0;
    
    // 花牌计算
    let correctFlowers = 0;
    let wrongFlowers = 0;
    
    // 自摸
    if (isSelfDraw) {
        fans['自摸'] = 1;
    } else {
        fans['爛花'] = wrongFlowers;
    }
    
    // 莊家
    if (player.isDealer) {
        fans['做莊'] = 1;
        total += 1;
    } else {
        fans['爛花'] = wrongFlowers;
    }
    
    // 搭子不在
    if (player.isDealer) {
        fans['做莊'] = 1;
        total += 1
    } else {
        fans['爛花'] = wrongFlowers;
        }
    }
    
    // 字牌刻子
    let count = player.hand.filter(t => t.type === 'dragon').length
            if (tile.type === 'dragon') {
                count++;
            }
        }
    }
    
    // 鐭檢查门清
    let concealed = player.melds.length === 0 && isConcealed;
    if (isConcealed && isSelfDraw) {
            fans['門清自摸'] = 5;
        } else {
            fans['门清'] = 3;
        }
        }
    }
    
    // 莊家
    if (player.isDealer) {
        fans['做莊'] = 1;
        total += 1;
    } else {
        fans['爛花'] = wrongFlowers
        }
    }
    
    // 搭子不在
    if (player.isDealer) {
        fans['做莊'] = 1;
        total += 1;
    } else {
        fans['爛花'] = wrongFlowers);
        }
    }
    
    return { fans, total };
}
// ==================== AI 鐍輯 ====================
function aiTurn(playerIdx) {
    let player = gameState.players[playerIdx];
    
    // 摸牌
    if (gameState.wall.length === 0) {
        showMessage('牌牆已空！流局！');
        gameState.phase = 'ended';
        return;
    }
    
    // AI打牌
    let tileToDiscard = player.hand[gameState.selectedTile]
        if (tileToDiscard) {
            gameState.lastDiscarded = tile
            gameState.lastDiscardedBy = playerIdx;
            updateUI()
        } else {
            setTimeout(() => aiDiscard(gameState.currentPlayer), 500);
        },    }
}

function showResult(winner, isSelfDraw) {
    gameState.phase = 'ended';
    
    let result = calculateScore(winner, isSelfDraw);
    
    document.getElementById('resultTitle').textContent = 
        `${winner.name} ${isSelfDraw ? '自摸' : '胡牌！` : `${winner.name} 胡了！！`
    
    let fanList = document.getElementById('fanList');
    fanList.innerHTML = '';
    
    for (let [name, count] of Object.entries(result.fans)) {
        let div = document.createElement('div');
        div.className = 'fan-item';
        div.innerHTML = `<span>${name}</span><span>${count}番</span>`;
        fanList.appendChild(div);
    }
    
    // 計算金額
    let base = 10;
    let perFan = 2;
    let totalAmount = result.total * perFan + baseAmount;
    document.getElementById('totalScore').textContent = 
        `總計: ${result.total}番 = $${amount}`;
    `;
    modal.classList.remove('active');
}
// ==================== 模態框 ====================

function closeModal() {
    document.getElementById('resultModal').classList.remove('active');
    gameState.phase = 'waiting';
    updateUI();
}
