/**
 * 台灣麻雀 v5 - 優化版
 * - 搭子放入手牌，可參與碰吃
 * - 顯示吃碰槓的牌
 * - 優化UI設計
 */

// ============ 常量 ============
const WINDS = ['東', '南', '西', '北'];
const DRAGONS = ['紅中', '發財', '白板'];
const FLOWERS = ['春', '夏', '秋', '冬', '梅', '蘭', '菊', '竹'];
const JOKERS = ['皇', '筒索萬', '筒', '索', '萬', '番', '東南西北', '中發白'];
const NUMBERS = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
const FLOWER_SEAT = [0, 1, 2, 3, 0, 1, 2, 3];

// ============ 遊戲狀態 ============
let G = {
    phase: 'waiting',
    wall: [],
    deadWall: [],
    players: [],
    turn: 0,
    dealer: 0,
    round: 1,
    consWins: 0,
    selected: -1,
    lastTile: null,
    lastBy: -1,
    claims: {},
    discardPile: []
};

// ============ 牌 ============
function makeTile(id, type, value) {
    let tile = { id, type, value };
    
    if (type === 'wan' || type === 'tong' || type === 'suo') {
        tile.name = NUMBERS[value - 1] + (type === 'wan' ? '萬' : type === 'tong' ? '筒' : '索');
        tile.suit = type;
        tile.num = value;
    } else if (type === 'wind') {
        tile.name = WINDS[value];
        tile.wind = value;
    } else if (type === 'dragon') {
        tile.name = DRAGONS[value];
        tile.dragon = value;
    } else if (type === 'flower') {
        tile.name = FLOWERS[value];
        tile.flower = value;
    } else if (type === 'joker') {
        tile.name = JOKERS[value];
        tile.joker = value;
    }
    
    return tile;
}

function sameTile(a, b) {
    if (a.type === 'joker' || b.type === 'joker') {
        // 搭子特殊處理 - 可以當任何相同牌
        if (a.type === 'joker' && b.type === 'joker') return a.joker === b.joker;
        return false;
    }
    if (a.type !== b.type) return false;
    if (a.num !== undefined && a.num !== b.num) return false;
    if (a.wind !== undefined && a.wind !== b.wind) return false;
    if (a.dragon !== undefined && a.dragon !== b.dragon) return false;
    return true;
}

function sameTileWithJoker(a, b) {
    // 用於碰/吃檢查，搭子可以代替
    if (a.type === 'joker' || b.type === 'joker') return true;
    return sameTile(a, b);
}

function isHonor(t) { return t.type === 'wind' || t.type === 'dragon'; }
function isSuited(t) { return t.type === 'wan' || t.type === 'tong' || t.type === 'suo'; }
function isJoker(t) { return t.type === 'joker'; }

// ============ 創建牌組 ============
function createDeck() {
    let deck = [];
    let id = 0;
    
    for (let suit of ['wan', 'tong', 'suo']) {
        for (let n = 1; n <= 9; n++) {
            for (let i = 0; i < 4; i++) {
                deck.push(makeTile(id++, suit, n));
            }
        }
    }
    
    for (let w = 0; w < 4; w++) {
        for (let i = 0; i < 4; i++) {
            deck.push(makeTile(id++, 'wind', w));
        }
    }
    
    for (let d = 0; d < 3; d++) {
        for (let i = 0; i < 4; i++) {
            deck.push(makeTile(id++, 'dragon', d));
        }
    }
    
    for (let f = 0; f < 8; f++) {
        deck.push(makeTile(id++, 'flower', f));
    }
    
    for (let j = 0; j < 8; j++) {
        deck.push(makeTile(id++, 'joker', j));
    }
    
    return deck;
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

// ============ 玩家 ============
function createPlayer(id, name, isAI) {
    return {
        id, name, isAI,
        isDealer: id === 0,
        seat: id,
        hand: [],
        melds: [],
        flowers: []
    };
}

// ============ 開始遊戲 ============
function startGame() {
    console.log('=== 遊戲開始 v5 ===');
    
    let deck = createDeck();
    shuffle(deck);
    
    G.deadWall = deck.splice(deck.length - 16);
    G.wall = deck;
    
    G.players = [
        createPlayer(0, '你', false),
        createPlayer(1, 'AI 小強', true),
        createPlayer(2, 'AI 小華', true),
        createPlayer(3, 'AI 小明', true)
    ];
    G.players[0].isDealer = true;
    G.dealer = 0;
    
    // 發牌
    for (let p of G.players) {
        let count = p.isDealer ? 17 : 16;
        for (let i = 0; i < count; i++) {
            dealTo(p);
        }
        sortHand(p);
    }
    
    G.turn = 0;
    G.phase = 'playing';
    G.selected = -1;
    G.lastTile = null;
    G.lastBy = -1;
    G.claims = {};
    G.discardPile = [];
    
    document.getElementById('discardArea').innerHTML = '';
    closeModal();
    updateUI();
    showMsg('遊戲開始！你是莊家，請摸牌。');
}

function dealTo(player) {
    if (G.wall.length === 0) return null;
    
    let tile = G.wall.pop();
    
    if (tile.type === 'flower') {
        player.flowers.push(tile);
        if (G.deadWall.length > 0) {
            return dealTo(player);
        }
    } else {
        // 搭子和普通牌都放入手牌
        player.hand.push(tile);
        return tile;
    }
    return null;
}

function supplement(player) {
    if (G.deadWall.length === 0) return null;
    
    let tile = G.deadWall.pop();
    
    if (tile.type === 'flower') {
        player.flowers.push(tile);
        return supplement(player);
    } else {
        player.hand.push(tile);
        return tile;
    }
}

function sortHand(p) {
    p.hand.sort((a, b) => {
        let order = { wan: 0, tong: 1, suo: 2, wind: 3, dragon: 4, joker: 5 };
        if (order[a.type] !== order[b.type]) return order[a.type] - order[b.type];
        return (a.num || a.wind || a.dragon || a.joker || 0) - (b.num || b.wind || b.dragon || b.joker || 0);
    });
}

// ============ 玩家操作 ============

function drawTile() {
    if (G.phase !== 'playing' || G.turn !== 0) return;
    
    if (G.wall.length === 0) {
        showMsg('牌牆已空！流局！');
        G.phase = 'ended';
        return;
    }
    
    let tile = dealTo(G.players[0]);
    sortHand(G.players[0]);
    
    // 檢查自摸
    if (canWin(G.players[0])) {
        G.claims = { 0: { hu: true } };
        showActionPanel({ hu: true });
    }
    
    updateUI();
    showMsg(tile ? `摸到 ${tile.name}` : '補花');
}

function selectTile(idx) {
    if (G.phase !== 'playing' || G.turn !== 0) return;
    G.selected = G.selected === idx ? -1 : idx;
    updateUI();
}

function discardTile() {
    if (G.phase !== 'playing' || G.turn !== 0 || G.selected < 0) {
        showMsg('請先選擇一張牌！');
        return;
    }
    
    let p = G.players[0];
    let tile = p.hand.splice(G.selected, 1)[0];
    
    G.lastTile = tile;
    G.lastBy = 0;
    G.selected = -1;
    G.discardPile.push(tile);
    
    addDiscardUI(tile);
    showMsg(`打出 ${tile.name}`);
    
    checkClaims(tile, 0);
}

// ============ 吃碰槓胡 ============

function checkClaims(tile, from) {
    G.claims = {};
    
    for (let i = 0; i < 4; i++) {
        if (i === from) continue;
        
        let p = G.players[i];
        let c = {};
        
        if (canWinWith(p, tile)) c.hu = true;
        if (canKong(p, tile)) c.kong = true;
        if (canPong(p, tile)) c.pong = true;
        if ((from + 1) % 4 === i && canChow(p, tile)) c.chow = true;
        
        if (Object.keys(c).length > 0) {
            G.claims[i] = c;
        }
    }
    
    if (Object.keys(G.claims).length > 0) {
        processClaims();
    } else {
        nextTurn();
    }
}

function processClaims() {
    let best = null;
    let bestP = null;
    let priority = { hu: 4, kong: 3, pong: 2, chow: 1 };
    
    for (let [pid, claims] of Object.entries(G.claims)) {
        for (let act of Object.keys(claims)) {
            if (!best || priority[act] > priority[best]) {
                best = act;
                bestP = parseInt(pid);
            }
        }
    }
    
    if (G.claims[0]) {
        showActionPanel(G.claims[0]);
    } else {
        doClaim(bestP, best);
    }
}

function doClaim(pid, action) {
    hideActionPanel();
    
    if (action === 'pass') {
        delete G.claims[pid];
        if (Object.keys(G.claims).length === 0) {
            nextTurn();
        } else {
            processClaims();
        }
        return;
    }
    
    if (action === 'hu') {
        G.players[pid].hand.push(G.lastTile);
        sortHand(G.players[pid]);
        showGameResult(G.players[pid], pid === G.lastBy);
        return;
    }
    
    let p = G.players[pid];
    
    if (action === 'kong' || action === 'pong') {
        let cnt = action === 'kong' ? 3 : 2;
        let tiles = [G.lastTile];
        
        for (let i = 0; i < cnt; i++) {
            let idx = p.hand.findIndex(t => sameTileWithJoker(t, G.lastTile));
            if (idx >= 0) {
                tiles.push(p.hand.splice(idx, 1)[0]);
            }
        }
        
        p.melds.push({ 
            type: action, 
            tiles: tiles,
            from: G.lastBy
        });
        
        showMsg(`${p.name} ${action === 'kong' ? '槓' : '碰'} ${G.lastTile.name}！`);
        
        if (action === 'kong') {
            supplement(p);
            sortHand(p);
        }
        
        G.turn = pid;
        updateUI();
        
        if (pid !== 0) {
            setTimeout(() => aiPlay(pid), 800);
        }
        return;
    }
    
    if (action === 'chow') {
        let opts = findChow(p, G.lastTile);
        if (opts.length > 0) {
            let opt = opts[0];
            for (let t of opt) {
                let idx = p.hand.findIndex(ht => ht.id === t.id);
                if (idx >= 0) p.hand.splice(idx, 1);
            }
            
            p.melds.push({ 
                type: 'chow', 
                tiles: [...opt, G.lastTile],
                from: G.lastBy
            });
            
            showMsg(`${p.name} 吃 ${G.lastTile.name}！`);
            
            G.turn = pid;
            updateUI();
            
            if (pid !== 0) {
                setTimeout(() => aiPlay(pid), 800);
            }
        }
    }
}

// ============ 牌型檢查 ============

function canPong(p, tile) {
    if (tile.type === 'flower') return false;
    return p.hand.filter(t => sameTileWithJoker(t, tile)).length >= 2;
}

function canKong(p, tile) {
    if (tile.type === 'flower') return false;
    return p.hand.filter(t => sameTileWithJoker(t, tile)).length >= 3;
}

function canChow(p, tile) {
    return findChow(p, tile).length > 0;
}

function findChow(p, tile) {
    if (!isSuited(tile)) return [];
    
    let opts = [];
    let n = tile.num;
    let suit = tile.suit;
    
    let sameSuit = p.hand.filter(t => isSuited(t) && t.suit === suit);
    
    // n-2, n-1
    let a = sameSuit.filter(t => t.num === n - 2);
    let b = sameSuit.filter(t => t.num === n - 1);
    if (a.length > 0 && b.length > 0) opts.push([a[0], b[0]]);
    
    // n-1, n+1
    let c = sameSuit.filter(t => t.num === n - 1);
    let d = sameSuit.filter(t => t.num === n + 1);
    if (c.length > 0 && d.length > 0) opts.push([c[0], d[0]]);
    
    // n+1, n+2
    let e = sameSuit.filter(t => t.num === n + 1);
    let f = sameSuit.filter(t => t.num === n + 2);
    if (e.length > 0 && f.length > 0) opts.push([e[0], f[0]]);
    
    return opts;
}

function canWin(p) {
    return checkHand([...p.hand], p.melds);
}

function canWinWith(p, tile) {
    let temp = [...p.hand, tile];
    return checkHand(temp, p.melds);
}

function checkHand(hand, melds) {
    let meldCnt = melds.reduce((s, m) => s + m.tiles.length, 0);
    if (hand.length + meldCnt !== 17) return false;
    
    let needSets = 5 - melds.length;
    return tryForm([...hand], needSets, true);
}

function tryForm(tiles, needSets, needPair) {
    if (needSets === 0 && !needPair) return true;
    if (tiles.length === 0) return !needSets && !needPair;
    
    // 把搭子放到最後處理
    tiles.sort((a, b) => {
        if (a.type === 'joker') return 1;
        if (b.type === 'joker') return -1;
        return a.id - b.id;
    });
    
    let first = tiles[0];
    
    // 搭子可以當任何牌
    if (first.type === 'joker') {
        // 嘗試做眼
        if (needPair && tiles.length >= 2) {
            let rest = tiles.slice(2);
            if (tryForm(rest, needSets, false)) return true;
        }
        // 嘗試做刻子
        if (needSets && tiles.length >= 3) {
            let rest = tiles.slice(3);
            if (tryForm(rest, needSets - 1, needPair)) return true;
        }
        // 嘗試做順子（需要另外兩張）
        if (needSets && tiles.length >= 1) {
            for (let i = 1; i < tiles.length; i++) {
                for (let j = i + 1; j < tiles.length; j++) {
                    let rest = tiles.filter((t, idx) => idx !== 0 && idx !== i && idx !== j);
                    if (tryForm(rest, needSets - 1, needPair)) return true;
                }
            }
        }
        return false;
    }
    
    // 嘗試做眼
    if (needPair) {
        let idx = tiles.findIndex((t, i) => i > 0 && sameTile(t, first));
        if (idx >= 0) {
            let rest = tiles.filter((t, i) => i !== 0 && i !== idx);
            if (tryForm(rest, needSets, false)) return true;
        }
    }
    
    // 嘗試刻子
    if (needSets > 0) {
        let same = tiles.filter(t => sameTile(t, first));
        if (same.length >= 3) {
            let count = 0;
            let rest = tiles.filter(t => {
                if (sameTile(t, first) && count < 3) {
                    count++;
                    return false;
                }
                return true;
            });
            if (tryForm(rest, needSets - 1, needPair)) return true;
        }
    }
    
    // 嘗試順子
    if (needSets > 0 && isSuited(first)) {
        let second = tiles.find(t => t.suit === first.suit && t.num === first.num + 1);
        let third = tiles.find(t => t.suit === first.suit && t.num === first.num + 2);
        
        if (second && third) {
            let rest = tiles.filter(t => t.id !== first.id && t.id !== second.id && t.id !== third.id);
            if (tryForm(rest, needSets - 1, needPair)) return true;
        }
    }
    
    return false;
}

// ============ AI ============

function nextTurn() {
    G.turn = (G.turn + 1) % 4;
    G.claims = {};
    
    if (G.turn === 0) {
        showMsg('輪到你摸牌！');
    } else {
        setTimeout(() => aiPlay(G.turn), 500);
    }
    
    updateUI();
}

function aiPlay(pid) {
    let p = G.players[pid];
    
    if (G.wall.length === 0) {
        showMsg('牌牆已空！流局！');
        G.phase = 'ended';
        return;
    }
    
    dealTo(p);
    sortHand(p);
    showMsg(`${p.name} 摸牌...`);
    updateUI();
    
    if (canWin(p)) {
        setTimeout(() => showGameResult(p, true), 500);
        return;
    }
    
    setTimeout(() => aiDiscard(pid), 700);
}

function aiDiscard(pid) {
    let p = G.players[pid];
    
    let choice = null;
    
    // 孤張字牌
    for (let t of p.hand) {
        if (!isJoker(t) && isHonor(t) && p.hand.filter(x => sameTile(x, t)).length === 1) {
            choice = t;
            break;
        }
    }
    
    // 孤張邊張
    if (!choice) {
        for (let t of p.hand) {
            if (!isJoker(t) && isSuited(t) && (t.num === 1 || t.num === 9)) {
                if (p.hand.filter(x => sameTile(x, t)).length === 1) {
                    choice = t;
                    break;
                }
            }
        }
    }
    
    // 其他孤張
    if (!choice) {
        for (let t of p.hand) {
            if (!isJoker(t) && p.hand.filter(x => sameTile(x, t)).length === 1) {
                choice = t;
                break;
            }
        }
    }
    
    // 最後一張（保留搭子）
    if (!choice) {
        let nonJokers = p.hand.filter(t => !isJoker(t));
        choice = nonJokers.length > 0 ? nonJokers[nonJokers.length - 1] : p.hand[p.hand.length - 1];
    }
    
    let idx = p.hand.findIndex(t => t.id === choice.id);
    if (idx >= 0) p.hand.splice(idx, 1);
    
    G.lastTile = choice;
    G.lastBy = pid;
    G.discardPile.push(choice);
    
    addDiscardUI(choice);
    showMsg(`${p.name} 打出 ${choice.name}`);
    updateUI();
    
    setTimeout(() => checkClaims(choice, pid), 300);
}

// ============ 計番 ============

function calcScore(p, selfDraw) {
    let fans = {};
    let total = 0;
    
    let correct = 0, wrong = 0;
    for (let f of p.flowers) {
        if (FLOWER_SEAT[f.flower] === p.seat) correct++;
        else wrong++;
    }
    
    if (correct + wrong === 0) { fans['無花'] = 1; total += 1; }
    if (correct > 0) { fans['正花'] = correct * 2; total += correct * 2; }
    if (wrong > 0) { fans['爛花'] = wrong; total += wrong; }
    
    if (selfDraw) { fans['自摸'] = 1; total += 1; }
    
    let concealed = p.melds.every(m => m.concealed);
    if (concealed) {
        if (selfDraw) { fans['門清自摸'] = 5; total += 5; }
        else { fans['門清'] = 3; total += 3; }
    }
    
    if (p.isDealer) { fans['做莊'] = 1; total += 1; }
    
    if (G.consWins > 0 && p.isDealer) {
        let bonus = G.consWins * 2 + 1;
        fans['連莊'] = bonus;
        total += bonus;
    }
    
    return { fans, total };
}

// ============ UI ============

function updateUI() {
    document.getElementById('wallCount').textContent = G.wall.length;
    document.getElementById('round').textContent = G.round;
    document.getElementById('consecutive').textContent = G.consWins;
    
    renderHand();
    renderOpponents();
    renderFlowers();
    renderPlayerMelds();
    updateButtons();
}

function renderHand() {
    let el = document.getElementById('playerHand');
    el.innerHTML = '';
    
    let p = G.players[0];
    if (!p) return;
    
    p.hand.forEach((t, i) => {
        let div = createTileElement(t);
        if (G.selected === i) div.classList.add('selected');
        div.onclick = () => selectTile(i);
        el.appendChild(div);
    });
}

function createTileElement(t, small = false) {
    let div = document.createElement('div');
    div.className = 'tile' + (small ? ' tile-small' : '') + ' ' + tileClass(t);
    div.innerHTML = `<span class="tile-text">${t.name}</span>`;
    return div;
}

function tileClass(t) {
    if (t.type === 'wan') return 'wan';
    if (t.type === 'tong') return 'tong';
    if (t.type === 'suo') return 'suo';
    if (t.type === 'wind') return 'wind';
    if (t.type === 'dragon') {
        return t.dragon === 0 ? 'dragon-red' : t.dragon === 1 ? 'dragon-green' : 'dragon-white';
    }
    if (t.type === 'flower') return 'flower';
    if (t.type === 'joker') return 'joker';
    return '';
}

function renderOpponents() {
    for (let i = 1; i <= 3; i++) {
        let tilesEl = document.getElementById(`tiles-${i}`);
        let meldsEl = document.getElementById(`melds-${i}`);
        let opp = document.getElementById(`opponent-${i}`);
        let p = G.players[i];
        
        if (tilesEl && p) {
            tilesEl.innerHTML = '';
            let cnt = opp.querySelector('.tile-count');
            if (cnt) cnt.textContent = p.hand.length;
            
            for (let j = 0; j < Math.min(p.hand.length, 8); j++) {
                let div = document.createElement('div');
                div.className = 'tile-back';
                tilesEl.appendChild(div);
            }
        }
        
        // 顯示對手的吃碰槓
        if (meldsEl && p) {
            meldsEl.innerHTML = '';
            for (let m of p.melds) {
                let div = document.createElement('div');
                div.className = 'meld-group';
                
                let label = document.createElement('span');
                label.className = 'meld-label';
                label.textContent = m.type === 'chow' ? '吃' : m.type === 'pong' ? '碰' : '槓';
                div.appendChild(label);
                
                for (let t of m.tiles) {
                    div.appendChild(createTileElement(t, true));
                }
                
                meldsEl.appendChild(div);
            }
        }
    }
}

function renderFlowers() {
    let p = G.players[0];
    if (!p) return;
    
    let section = document.getElementById('flowersSection');
    let display = document.getElementById('flowersDisplay');
    
    if (p.flowers.length > 0) {
        section.style.display = 'flex';
        display.innerHTML = '';
        for (let f of p.flowers) {
            display.appendChild(createTileElement(f, true));
        }
    } else {
        section.style.display = 'none';
    }
}

function renderPlayerMelds() {
    let el = document.getElementById('playerMelds');
    let p = G.players[0];
    if (!p) return;
    
    el.innerHTML = '';
    
    for (let m of p.melds) {
        let div = document.createElement('div');
        div.className = 'meld-set';
        
        let label = document.createElement('span');
        label.className = 'meld-type';
        label.textContent = m.type === 'chow' ? '吃' : m.type === 'pong' ? '碰' : '槓';
        div.appendChild(label);
        
        for (let t of m.tiles) {
            div.appendChild(createTileElement(t, true));
        }
        
        el.appendChild(div);
    }
}

function updateButtons() {
    let draw = document.getElementById('btnDraw');
    let disc = document.getElementById('btnDiscard');
    
    draw.disabled = G.phase !== 'playing' || G.turn !== 0;
    disc.disabled = G.phase !== 'playing' || G.turn !== 0 || G.selected < 0;
}

function addDiscardUI(tile) {
    let el = document.getElementById('discardArea');
    el.appendChild(createTileElement(tile, true));
}

function showMsg(txt) {
    document.getElementById('message').textContent = txt;
}

function showActionPanel(claims) {
    let el = document.getElementById('actionPanel');
    el.classList.add('active');
    
    document.getElementById('btnChow').style.display = claims.chow ? 'inline-block' : 'none';
    document.getElementById('btnPong').style.display = claims.pong ? 'inline-block' : 'none';
    document.getElementById('btnKong').style.display = claims.kong ? 'inline-block' : 'none';
    document.getElementById('btnHu').style.display = claims.hu ? 'inline-block' : 'none';
}

function hideActionPanel() {
    document.getElementById('actionPanel').classList.remove('active');
}

function doAction(act) {
    doClaim(0, act);
}

function showGameResult(winner, selfDraw) {
    G.phase = 'ended';
    
    let r = calcScore(winner, selfDraw);
    
    document.getElementById('resultTitle').textContent = 
        `${winner.name} ${selfDraw ? '自摸' : '胡牌'}！`;
    
    let list = document.getElementById('fanList');
    list.innerHTML = '';
    
    for (let [name, cnt] of Object.entries(r.fans)) {
        let div = document.createElement('div');
        div.className = 'fan-item';
        div.innerHTML = `<span>${name}</span><span>${cnt}番</span>`;
        list.appendChild(div);
    }
    
    let amount = r.total * 2 + 10;
    document.getElementById('totalScore').textContent = `總計: ${r.total}番 = $${amount}`;
    
    document.getElementById('resultModal').classList.add('active');
}

function closeModal() {
    document.getElementById('resultModal').classList.remove('active');
}

// ============ 初始化 ============
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    console.log('台灣麻雀 v5 載入完成');
});
