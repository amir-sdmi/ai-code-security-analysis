export function showModal(scene, gameState) {
    // Semi-transparent overlay
    const overlay = scene.add.graphics();
    overlay.fillStyle(0x000000, 0.90); // Black with 90% opacity
    overlay.fillRect(0, 0, scene.cameras.main.width, scene.cameras.main.height);
    overlay.setDepth(20); // Ensure the modal is on top

    // Modal background
    const modalWidth = 300;
    const modalHeight = 200;
    const modalX = scene.cameras.main.width / 2 - modalWidth / 2;
    const modalY = scene.cameras.main.height / 2 - modalHeight / 2;

    const modalBackground = scene.add.graphics();
    modalBackground.fillStyle(0xCCCCCC, 1); // Light Grey background
    modalBackground.fillRect(modalX, modalY, modalWidth, modalHeight);
    modalBackground.setDepth(21);

    // Modal title
    const title = scene.add.text(
        scene.cameras.main.width / 2,
        modalY + 20,
        "Level Complete!",
        gameState.fontStyles.default
    ).setOrigin(0.5).setDepth(22);

    // Score text
    const scoreText = scene.add.text(
        scene.cameras.main.width / 2,
        modalY + 70,
        `Your Score: ${gameState.score}`,
        gameState.fontStyles.small
    ).setOrigin(0.5).setDepth(22);

    // Continue button
    const continueButton = scene.add.text(
        scene.cameras.main.width / 2,
        modalY + 120,
        "Continue",
        gameState.fontStyles.button
    ).setOrigin(0.5).setDepth(22).setInteractive();

    // Quit button
    const quitButton = scene.add.text(
        scene.cameras.main.width / 2,
        modalY + 160,
        "Quit",
        gameState.fontStyles.button
    ).setOrigin(0.5).setDepth(22).setInteractive();

    // Button interactions
    continueButton.on('pointerdown', () => {
        gameState.isPaused = false; // Resume the game state
        gameState.gameOver = false; // Reset game over state
        scene.scene.restart(); // Restart the scene
    });

    quitButton.on('pointerdown', () => {
        showCredits(scene, gameState); // Call the showCredits function
    });
}

export function showCredits(scene, gameState) {
    // Pause the game
    gameState.isPaused = true;

    // Semi-transparent overlay
    const overlay = scene.add.graphics();
    overlay.fillStyle(0x000000, 0.5); // Black with 50% opacity
    overlay.fillRect(0, 0, scene.cameras.main.width, scene.cameras.main.height);
    overlay.setDepth(20);

    // Modal background
    const modalWidth = 400;
    const modalHeight = 400; // Increased height for image space
    const modalX = scene.cameras.main.width / 2 - modalWidth / 2;
    const modalY = scene.cameras.main.height / 2 - modalHeight / 2;

    const modalBackground = scene.add.graphics();
    modalBackground.fillStyle(0x999999, 1); // Gray background
    modalBackground.fillRect(modalX, modalY, modalWidth, modalHeight);
    modalBackground.setDepth(21);

    // ROW 1: Title
    const title = scene.add.text(
        scene.cameras.main.width / 2,
        modalY + 10,
        "Credits",
        gameState.fontStyles.title
    ).setOrigin(0.5).setDepth(22);

    // ROW 2: Image
    const image = scene.add.image(
        scene.cameras.main.width / 2,
        title.y + 50, // Space below the title
        'paperboyLogo'
    ).setDepth(22);

    // Scale the image slightly larger
    const maxImageWidth = modalWidth - 40;
    const maxImageHeight = modalHeight / 2.5;
    if (image.width > maxImageWidth || image.height > maxImageHeight) {
        const scale = Math.min(maxImageWidth / image.width, maxImageHeight / image.height);
        image.setScale(scale);
    }

    // Adjust image Y position after scaling
    image.y = title.y + 50 + image.displayHeight / 2;

    // ROW 3: "Created by..." text
    const creditsText1 = scene.add.text(
        scene.cameras.main.width / 2,
        image.y + image.displayHeight / 2 + 20,
        "Created by ChatGPT and Jason St-Cyr",
        {
            ...gameState.fontStyles.content,
            wordWrap: { width: modalWidth - 40 },
            align: "center",
        }
    ).setOrigin(0.5).setDepth(22);

    // ROW 4: "An homage to the classic Atari Paperboy (1985)" text
    const creditsText2 = scene.add.text(
        scene.cameras.main.width / 2,
        creditsText1.y + creditsText1.height + 5,
        "An homage to the classic Atari game Paperboy (1985)",
        {
            ...gameState.fontStyles.content,
            wordWrap: { width: modalWidth - 40 },
            align: "center",
        }
    ).setOrigin(0.5).setDepth(22);

    // ROW 5: Hyperlink to Wikipedia
    const learnMore = scene.add.text(
        scene.cameras.main.width / 2,
        creditsText2.y + creditsText2.height + 10,
        "Learn more about Paperboy",
        gameState.fontStyles.link
    ).setOrigin(0.5).setDepth(22).setInteractive();

    learnMore.on('pointerdown', () => {
        window.open("https://en.wikipedia.org/wiki/Paperboy_(video_game)", "_blank");
    });

    // ROW 6: Buttons
    const buttonY = learnMore.y + 30; // Position buttons below the hyperlink

    const buttonWidth = 100;
    const buttonSpacing = 10; // Reduced spacing between buttons

    const continueButton = scene.add.text(
        scene.cameras.main.width / 2 - buttonWidth - buttonSpacing / 2,
        buttonY,
        "Continue",
        gameState.fontStyles.button
    ).setOrigin(0.5).setDepth(22).setInteractive();

    continueButton.on('pointerdown', () => {
        gameState.isPaused = false; // Resume the game state
        gameState.gameOver = false; // Reset game over state
        scene.scene.restart();
    });

    const quitButton = scene.add.text(
        scene.cameras.main.width / 2 + buttonSpacing / 2,
        buttonY,
        "Quit",
        gameState.fontStyles.button
    ).setOrigin(0.5).setDepth(22).setInteractive();

    quitButton.on('pointerdown', () => {
        window.open("https://en.wikipedia.org/wiki/Paperboy_(video_game)", "_blank");
    });
}


export function drawPause(scene, gameState){
    // Semi-transparent overlay
    gameState.pauseOverlay = scene.add.graphics();
    gameState.pauseOverlay.fillStyle(0x000000, 0.5); // Black with 50% opacity
    gameState.pauseOverlay.fillRect(0, 0, scene.cameras.main.width, scene.cameras.main.height);
    gameState.pauseOverlay.setDepth(10); // Ensure it renders on top
    gameState.pauseOverlay.setVisible(false); // Hide by default

    // Pause text
    gameState.pauseText = scene.add.text(
        scene.cameras.main.width / 2, 
        scene.cameras.main.height / 2 - 20, 
        "Game Paused",
        gameState.fontStyles.default 
    ).setOrigin(0.5).setDepth(11).setVisible(false); // Center-aligned, on top, hidden initially

    // Instructions text
    gameState.pauseInstructions = scene.add.text(
        scene.cameras.main.width / 2, 
        scene.cameras.main.height / 2 + 20, 
        "Press 'P' to resume",
        gameState.fontStyles.small 
    ).setOrigin(0.5).setDepth(11).setVisible(false); // Center-aligned, on top, hidden initially
}