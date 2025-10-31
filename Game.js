kaboom({
    global: true,
    fullscreen: true,
    debug: true,
    width: window.innerWidth,
    height: window.innerHeight,
    stretch: true,
    letterbox: true,
});

setBackground(0, 0, 0);

// === Base scaling setup ===
const REF_WIDTH = 1920;
const REF_HEIGHT = 1080;
const scaleX = () => width() / REF_WIDTH;
const scaleY = () => height() / REF_HEIGHT;
const scaleFactor = () => Math.min(scaleX(), scaleY());
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// === Load assets ===
loadRoot("./");
loadSprite("Plat", "Blackplatform.png");
loadSprite("Cat", "cat.png");
loadSprite("BG", "Background.png");
loadSound("Jump", "Jump.mp3");
loadSound("BGmusic", "BGmusic.mp3");

// ======== START SCENE ========
scene("start", () => {
    add([
        text("Suzu Jump Simulator", { size: 64 * scaleFactor() }),
        pos(width() / 2, height() / 2 - 100 * scaleFactor()),
        anchor("center"),
    ]);

    add([
        text("Press any key to start | ESC to stop", { size: 32 * scaleFactor() }),
        pos(width() / 2, height() / 2 + 50 * scaleFactor()),
        anchor("center"),
        color(rgb(200, 200, 200)),
    ]);

    add([
        text("Controls: A / D to move | Space to jump", { size: 24 * scaleFactor() }),
        pos(width() / 2, height() / 2 + 150 * scaleFactor()),
        anchor("center"),
        color(rgb(150, 150, 150)),
    ]);

    onKeyPress(() => go("main"));
});

// ======== MAIN SCENE ========
scene("main", () => {
    setGravity(1600);

    // 🎵 Background Music (fixed volume)
    const bgMusic = play("BGmusic", {
        loop: true,
        volume: 0.2, // base volume
    });

    const startX = width() / 2 - 300;
    const startY = height() - 100;
    const platScale = 1.5 * scaleFactor();

    // --- BACKGROUND ---
    const bg = add([
        sprite("BG", { width: width(), height: height() }),
        pos(0, 0),
    ]);

    // === GAP SETTINGS ===
    const maxXGap = 550;
    const minXGap = 400;
    const maxYGap = 370;
    const minYGap = 250;

    // === Ground platform ===
    add([
        sprite("Plat"),
        pos(startX, startY),
        scale(platScale * 2),
        area(),
        body({ isStatic: true }),
        anchor("center"),
        "platform",
    ]);

    // === Player ===
    const targetSize = 100;
    const originalSize = 918;
    const catScale = (targetSize / originalSize) * 2.5;

    const player = add([
        sprite("Cat"),
        pos(startX, startY - 120),
        scale(catScale * scaleFactor()),
        area(),
        body(),
        anchor("center"),
        "player",
    ]);

    const moveSpeed = 300;
    const jumpForce = 1500;

    let lastPlatformY = startY - 200;
    let lastPlatformX = startX;

    // === SCORE ===
    let score = 0;
    let highestY = startY;

    const scoreText = add([
        text("Score: 0", { size: 36 * scaleFactor() }),
        pos(40, 40),
        fixed(),
        color(rgb(255, 255, 255)),
    ]);

    // === Generate platform ===
    function spawnPlatform() {
        const xOffset = rand(-maxXGap, maxXGap);
        const yOffset = -rand(minYGap, maxYGap);
        lastPlatformX = clamp(lastPlatformX + xOffset, 150, width() - 150);
        lastPlatformY += yOffset;

        add([
            sprite("Plat"),
            pos(lastPlatformX, lastPlatformY),
            scale(platScale),
            area(),
            body({ isStatic: true }),
            anchor("center"),
            "platform",
        ]);
    }

    for (let i = 0; i < 10; i++) spawnPlatform();

    // === Player Controls ===
    onKeyDown("a", () => player.move(-moveSpeed, 0));
    onKeyDown("d", () => player.move(moveSpeed, 0));

    onKeyPress("space", () => {
        if (player.isGrounded()) {
            player.jump(jumpForce);
            play("Jump");
        }
    });

    // === ESC to quit ===
    onKeyPress("escape", () => {
        bgMusic.stop();
        go("start");
    });

    // === Infinite platforms ===
    onUpdate(() => {
        camPos(player.pos);
        const c = camPos();
        bg.pos = vec2(c.x - width() / 2, c.y - height() / 2);

        if (player.pos.y - 600 < lastPlatformY) {
            for (let i = 0; i < 5; i++) spawnPlatform();
        }

        for (const plat of get("platform")) {
            if (plat.pos.y > player.pos.y + height()) destroy(plat);
        }

        if (player.isGrounded() && player.pos.y < highestY) {
            highestY = player.pos.y;
            score++;
            scoreText.text = `Score: ${score}`;
        }

        if (player.pos.y > height() + 400) {
            bgMusic.stop();
            go("start");
        }
    });
});

// Start
go("start");

