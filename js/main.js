import GameScene from './scenes/GameScene.js';

const config = {
	type: Phaser.AUTO,
	width: 1080,
	height: 720,
  //width: 2048*3.1,
	//height: 2048*3.1,
	physics: {
		default: 'arcade',
		arcade: {
			//gravity: { y: 200 }
		}
	},
	scene: [GameScene]
}
console.log('main says');
console.log(GameScene);
export default new Phaser.Game(config)
