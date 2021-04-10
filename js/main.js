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
const myGame = new Phaser.Game(config)
if (window.Worker) {
	let worker = myGame.config.worker = new PromiseWorker( new Worker("js/worker.js") )
	worker.onmessage = function(e) {
		console.log(e.data);
	}
} else {
	console.log('Your browser doesn\'t support web workers.')
}
export default myGame
