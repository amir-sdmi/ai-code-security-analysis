class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        // Background
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000).setOrigin(0);
        
        // Title text
        const title = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 3,
            'RETRO AFRICAN\nSAFARI DASH',
            {
                fontFamily: 'monospace',
                fontSize: '48px',
                fontStyle: 'bold',
                color: '#ffffff',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5);
        
        // Create a flashing effect for the title
        this.tweens.add({
            targets: title,
            alpha: 0.7,
            duration: 500,
            ease: 'Power1',
            yoyo: true,
            repeat: -1
        });
        
        // Instructions text
        this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 50,
            'Use arrow keys to move\nCollect artifacts and avoid obstacles',
            {
                fontFamily: 'monospace',
                fontSize: '16px',
                color: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5);
        
        // Start game button
        const startButton = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 150,
            'START GAME',
            {
                fontFamily: 'monospace',
                fontSize: '24px',
                color: '#ffffff',
                backgroundColor: '#8BC34A',
                padding: {
                    left: 15,
                    right: 15,
                    top: 10,
                    bottom: 10
                }
            }
        ).setOrigin(0.5);
        
        // Make the button interactive
        startButton.setInteractive({ useHandCursor: true });
        
        // Button hover effect
        startButton.on('pointerover', () => {
            startButton.setBackgroundColor('#9CCC65');
        });
        
        startButton.on('pointerout', () => {
            startButton.setBackgroundColor('#8BC34A');
        });
        
        // Start the game when button is clicked
        startButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
        
        // Credits text
        this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height - 20,
            'Created with Amazon Q Developer for AWS Challenge',
            {
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#888888'
            }
        ).setOrigin(0.5);
        
        // Add keyboard input to start game
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
        
        // Add keyboard input to start game with Enter key
        this.input.keyboard.once('keydown-ENTER', () => {
            this.scene.start('GameScene');
        });
    }
}
