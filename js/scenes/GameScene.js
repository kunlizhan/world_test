const DUDE_KEY = 'dude'
var seed = 0;
var camera = undefined
var map = undefined
var map_U = 0
var map_UR = 0
var map_R = 0
var map_DR = 0
var map_D = 0
var map_DL = 0
var map_L = 0
var map_UL = 0
const map_px = 2048
import makeAreaMap from '../Areas.js';
export default class GameScene extends Phaser.Scene
{
  constructor()
	{
		super('game-scene')
	}

	preload()
	{
    this.load.spritesheet(DUDE_KEY,
        'assets/dude.png',
        { frameWidth: 32, frameHeight: 48 }
    )
    this.load.image('tiles', 'assets/tiles.png')
	}

  create()
	{
    this.player = this.createPlayer()
    this.cursors = this.input.keyboard.createCursorKeys()

    camera = this.cameras.main
    camera.startFollow(this.player)
    map = makeAreaMap(0, this, [0,0])
    this.makeAreaAround(map)
	}

  update()
  {
    var cursors = this.cursors
    var player = this.player
    if (cursors.left.isDown)
    {
        player.setVelocityX(-2000);
        player.anims.play('left', true);

        var edge = map.tileToWorldXY(0, 0).x;
        if (camera.worldView.left < edge-100) {
        }
    }
    else if (cursors.right.isDown)
    {
        player.setVelocityX(2000);
        player.anims.play('right', true);

        var edge = map.tileToWorldXY(127, 0).x;
        if (camera.worldView.right > edge+100 && map_R == 0) {
          console.log(camera.worldView.right);
          //map_R = makeAreaMap(0, this, [2048,0]);
        }
    }
    else
    {
        player.setVelocityX(0);
        player.anims.play('turn');
    }
    if (cursors.up.isDown)
    {
        player.setVelocityY(-2000);

        var edge = map.tileToWorldXY(0, 0).y;
        if (camera.worldView.top < edge-100 && map_U == 0) {
          map_U = makeAreaMap(0, this, [0, -2048]);
        }
    }
    else if (cursors.down.isDown)
    {
        player.setVelocityY(2000);

        var edge = map.tileToWorldXY(0, 127).y;
        if (camera.worldView.bottom > edge+100 && map_D == 0) {
          map_D = makeAreaMap(0, this, [0, 2048]);
        }
    }
    else
    {
        player.setVelocityY(0);
    }
  }

  createPlayer()
	{
		const player = this.physics.add.sprite(100, 450, DUDE_KEY)

		this.anims.create({
			key: 'left',
			frames: this.anims.generateFrameNumbers(DUDE_KEY, { start: 0, end: 3 }),
			frameRate: 10,
			repeat: -1
		})

		this.anims.create({
			key: 'turn',
			frames: [ { key: DUDE_KEY, frame: 4 } ],
			frameRate: 20
		})

		this.anims.create({
			key: 'right',
			frames: this.anims.generateFrameNumbers(DUDE_KEY, { start: 5, end: 8 }),
			frameRate: 10,
			repeat: -1
		})

    return player
	}

  makeAreaAround(map) {
    let mx = map.tileToWorldXY(0, 0).x
    let my = map.tileToWorldXY(0, 0).y
    map_U = makeAreaMap(0, this, [mx, my-map_px])
    map_UR = makeAreaMap(0, this, [mx+map_px, my-map_px])
    map_R = makeAreaMap(0, this, [mx+map_px, my])
    map_DR = makeAreaMap(0, this, [mx+map_px, my+map_px])
    map_D = makeAreaMap(0, this, [mx, my+map_px])
    map_DL = makeAreaMap(0, this, [mx-map_px, my+map_px])
    map_L = makeAreaMap(0, this, [mx-map_px, my])
    map_UL = makeAreaMap(0, this, [mx-map_px, my-map_px])
  }

}
