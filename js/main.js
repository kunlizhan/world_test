import GameScene from './scenes/GameScene.js';

const config = {
	type: Phaser.AUTO,
	width: 1080,
	height: 720,
  //width: 2048,
	//height: 2048,
	physics: {
		default: 'arcade',
		arcade: {
			//gravity: { y: 200 }
			debug: true
		}
	},
	scene: [GameScene]
}
export default new Phaser.Game(config)
