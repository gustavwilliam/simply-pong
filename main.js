const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const gameOverlay = document.getElementById('game-overlay');
const gameOverlayEnd = document.getElementById('game-overlay-end');
const gameOverLabel = document.getElementById('game-over-label');

const PADDLE_HEIGHT = 60;
const PADDLE_WIDTH = 15;
const PADDLE_OFFSET = 15;  // Offset from edge of canvas
const PADDLE_STEP = 3;  // Paddle movement per frame
const BALL_RADIUS = 8;
const MS_PER_FRAME = 10;  // Milliseconds per frame
const WIN_SCORE = 10;
const MAX_Y_BOUNCE = 4;

let intervalRef;
let playerScoreP = document.getElementById('player-score');
let playerScoreLabel = document.getElementById('player-score-label');
let aiScoreP = document.getElementById('ai-score');
let aiScoreLabel = document.getElementById('ai-score-label');
let gameMode = 0;  // 0 = multiplayer, 1 = AI
const multiplayerBtn = document.getElementById('multiplayerBtn');
const aiBtn = document.getElementById('aiBtn');

function setGameMode(newMode) {
    if (newMode === 0) {
        multiplayerBtn.classList.add('active');
        aiBtn.classList.remove('active');
        playerScoreLabel.innerText = "Player 1";
        aiScoreLabel.innerText = "Player 2";
    } else {
        aiBtn.classList.add('active');
        multiplayerBtn.classList.remove('active');
        playerScoreLabel.innerText = "Player";
        aiScoreLabel.innerText = "AI";
    }
    gameMode = newMode;
}
function showGameOverScreen() {
    if (game.mode === 0) {
        gameOverLabel.innerText = `${game.winner} won!\uD83C\uDF89`;
    } else {
        if (game.winner === "Player") {
            gameOverLabel.innerText = "You won!\uD83C\uDF89";
        } else {
            gameOverLabel.innerText = `${game.winner} won!`;
        }
    }
    gameOverlayEnd.classList.remove('hidden');
    gameOverlay.classList.add('hidden');
}
function hideGameOverScreen () {
    gameOverlay.classList.remove('hidden');
    gameOverlayEnd.classList.add('hidden');
    playerScoreP.innerText = "0";
    aiScoreP.innerText = "0";
}

let game = {
    active: false,
    winner: undefined,
    mode: 0,
    resetGamePlan() {
        player.paddle.reset();
        ai.paddle.reset();
        ball.reset();
    },
    tearDown() {
        game.resetGamePlan();
        ai.reset();
        player.reset();
    },
    startNewRound() {
        game.resetGamePlan();
    },
    incrementScore: (paddle) =>{
        paddle.score++;
        if (paddle === ai) {
            aiScoreP.innerText = ai.score;
        } else if (paddle === player) {
            playerScoreP.innerText = player.score;
        }
        if (paddle.score >= WIN_SCORE) {
            game.winner = paddle.name;
            game.active = false;
        } else {
            game.startNewRound()
        }
    },
}
let ball = {
    _x: undefined,
    _y: undefined,
    get x () { return (this._x === undefined) ? canvas.width / 2 : this._x },
    get y () { return (this._y === undefined) ? canvas.height / 2 : this._y },
    set x (x) { this._x = x },
    set y (y) { this._y = y },
    dx: -5,
    dy: 0.7,
    simulate () {
        const new_x = this.x + this.dx;
        const new_y = this.y + this.dy;
        
        // Bounce on top or bottom collision
        if (new_y > canvas.height - BALL_RADIUS || new_y < BALL_RADIUS) {
            this.dy = -this.dy;
        }
        // Increment score on left or right collision
        if (new_x > canvas.width - BALL_RADIUS) {
            game.incrementScore(player);
        } else if (new_x < BALL_RADIUS) {
            game.incrementScore(ai);
        }
        // Bounce on paddle collision
        if (new_x + BALL_RADIUS > ai.paddle.x &&
            new_x - BALL_RADIUS < ai.paddle.x + PADDLE_WIDTH &&
            new_y + BALL_RADIUS > ai.paddle.y &&
            new_y - BALL_RADIUS < ai.paddle.y + PADDLE_HEIGHT
        ) {
            // Collusion with right (AI) paddle
            this.dx = -this.dx;
            const yBounceCoefficient = (new_y - (ai.paddle.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
            this.dy = yBounceCoefficient * MAX_Y_BOUNCE;
        } else if (
            new_x + BALL_RADIUS > player.paddle.x &&
            new_x - BALL_RADIUS < player.paddle.x + PADDLE_WIDTH &&
            new_y + BALL_RADIUS > player.paddle.y &&
            new_y - BALL_RADIUS < player.paddle.y + PADDLE_HEIGHT
        ) {
            // Collision with left (player) paddle
            this.dx = -this.dx;
            const yBounceCoefficient = (new_y - (player.paddle.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
            this.dy = yBounceCoefficient * MAX_Y_BOUNCE;
        }
        this.x += this.dx;
        this.y += this.dy;
    },
    render () {
        ctx.beginPath();
        ctx.arc(this.x, this.y, BALL_RADIUS, 0, Math.PI*2);
        ctx.fillStyle = "#ddd";
        ctx.fill();
        ctx.closePath();
    },
    reset () {
        this.x = undefined;
        this.y = undefined;
    },
}
let player = {
    name: "Player",
    score: 0,
    paddle: {
        _x: undefined,
        _y: undefined,
        get x () { return (this._x === undefined) ? PADDLE_OFFSET : this._x },
        get y () { return (this._y === undefined) ? canvas.height / 2 - PADDLE_HEIGHT / 2 : this._y },
        set x (x) { this._x = x },
        set y (y) { this._y = y },
        direction: 0,  // -1 = up, 1 = down, 0 = none
        simulate () {
            if (this.y + this.direction * PADDLE_STEP > 0 &&  // Top edge
                this.y + PADDLE_HEIGHT + this.direction * PADDLE_STEP < canvas.height  // Bottom edge
            ) {
                this.y += this.direction * PADDLE_STEP;
            }
        },
        render () {
            ctx.beginPath();
            ctx.rect(this.x, this.y, PADDLE_WIDTH, PADDLE_HEIGHT);
            ctx.fillStyle = "#eee";
            ctx.fill();
            ctx.closePath();
        },
        reset () {
            this._x = undefined;
            this._y = undefined;
            this.direction = 0;
        },
    },
    reset () {
        this.score = 0;
        this.paddle.reset();
        this.name = "Player";
    }
}
let ai = {
    name: "AI",
    score: 0,
    paddle: {
        _x: undefined,
        _y: undefined,
        get x () { return (this._x === undefined) ? canvas.width - PADDLE_OFFSET - PADDLE_WIDTH : this._x },
        get y () { return (this._y === undefined) ? canvas.height / 2 - PADDLE_HEIGHT / 2 : this._y },
        set x (x) { this._x = x },
        set y (y) { this._y = y },
        direction: 0,  // -1 = up, 1 = down, 0 = none
        simulate () {
            if (this.y + this.direction * PADDLE_STEP > 0 &&  // Top edge
                this.y + PADDLE_HEIGHT + this.direction * PADDLE_STEP < canvas.height  // Bottom edge
            ) {
                this.y += this.direction * PADDLE_STEP;
            }
        },
        render () {
            ctx.beginPath();
            ctx.rect(this.x, this.y, PADDLE_WIDTH, PADDLE_HEIGHT);
            ctx.fillStyle = "#ddd";
            ctx.fill();
            ctx.closePath();
        },
        reset () {
            this._x = undefined;
            this._y = undefined;
            this.direction = 0;
        },
    },
    reset () {
        this.score = 0;
        this.name = "AI";
        this.paddle.reset();
    }
}

function resizeCanvas() {
    const canvasPaddingLeft = parseInt(window.getComputedStyle(canvas.parentElement).getPropertyValue('padding-left'));
    const canvasPaddingRight = parseInt(window.getComputedStyle(canvas.parentElement).getPropertyValue('padding-right'));
    canvas.width = canvas.parentElement.clientWidth - canvasPaddingLeft - canvasPaddingRight;
}
function draw() {
    resizeCanvas();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!game.active) { tearDownGame(); clearInterval(intervalRef); return; }

    player.paddle.render();
    ai.paddle.render();
    ball.render();

    player.paddle.simulate();
    ai.paddle.simulate();
    ball.simulate();
}

function handleKeyDown(event) {
    if (event.code === "KeyW") { player.paddle.direction = -1; }
    if (event.code === "KeyS") { player.paddle.direction = 1; }
    if (event.code === "ArrowDown") {
        if (game.mode === 0) { ai.paddle.direction = 1; }
        else { player.paddle.direction = 1; }
    }
    if (event.code === "ArrowUp") {
        if (game.mode === 0) { ai.paddle.direction = -1; }
        else { player.paddle.direction = -1; }
    }
}
function handleKeyUp(event) {
    if (event.code === "KeyW" || event.code === "KeyS") {
        player.paddle.direction = 0;
    }
    if (event.code === "ArrowUp" || event.code === "ArrowDown") {
        if (game.mode === 0) {
            ai.paddle.direction = 0;
        } else {
            player.paddle.direction = 0;
        }
    }
}
function handleGameOverKeyPress(event) {
    if (event.code === "Enter" || event.code === "Space") {
        hideGameOverScreen();
        document.removeEventListener("keypress", handleGameOverKeyPress);
    }
}

function setUpGame() {
    gameOverlay.classList.add('hidden');
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    game.active = true;
    game.mode = gameMode;
    if (game.mode === 0) {
        player.name = "Player 1";
        ai.name = "Player 2";
    }
    playerScoreP.innerText = "0";
    aiScoreP.innerText = "0";
}
function tearDownGame() {
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("keyup", handleKeyUp);
    game.tearDown();

    showGameOverScreen();
    document.addEventListener("keypress", handleGameOverKeyPress);
}

function gameLoop() {
    setUpGame();
    intervalRef = setInterval(draw, MS_PER_FRAME);
    // Teardown happens in draw function, due to async nature of setInterval
}