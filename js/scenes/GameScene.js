const DUDE_KEY = 'dude'
var camera = undefined
var areas = [
  [0,0,0],
  [0,0,0],
  [0,0,0]
]
const map_px = 128*8
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
    this.load.image('tiles_png', 'assets/tiles.png')
    this.load.image('sky', 'assets/sky.png')
	}

  create()
	{
    this.player = this.createPlayer()
    this.player.setDepth(1)
    this.cursors = this.input.keyboard.createCursorKeys()

    camera = this.cameras.main
    camera.startFollow(this.player)

    this.area_rect = this.add.rectangle(0, 0, map_px, map_px, 0x00ff00);
    this.area_rect.setOrigin(0)// this shorthand moves origin from default center to top left
    this.area_current = this.physics.add.group(this.area_rect)

    this.earth_coord = [0,0]
    areas[1][1] = makeAreaMap(this.earth_coord, this, [0,0])
    this.updateAreas()
	}
  SetInArea() {
    this.inArea = true
    console.log(this.inArea)
  }
  update()
  {
    var cursors = this.cursors
    var player = this.player
    if (cursors.left.isDown)
    {
        player.setVelocityX(-200)
        player.anims.play('left', true)
        if (!this.physics.world.overlap(player, this.area_current)) {
          this.updateAreas()
        }
    }
    else if (cursors.right.isDown)
    {
        player.setVelocityX(200)
        player.anims.play('right', true)
        if (!this.physics.world.overlap(player, this.area_current)) {
          this.updateAreas()
        }
    }
    else
    {
        player.setVelocityX(0)
        player.anims.play('turn')
    }
    if (cursors.up.isDown)
    {
        player.setVelocityY(-200)
        if (!this.physics.world.overlap(player, this.area_current)) {
          this.updateAreas()
        }
    }
    else if (cursors.down.isDown)
    {
        player.setVelocityY(200)
        if (!this.physics.world.overlap(player, this.area_current)) {
          this.updateAreas()
        }
    }
    else
    {
        player.setVelocityY(0)
    }

    this.inArea = false
  }

  createPlayer()
	{
		const player = this.physics.add.sprite(0, 0, DUDE_KEY)

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

  updateAreas() {
    console.log(areas[1][1])
    let player_center = this.player.getCenter()
    let delta = [0,0]
      /*console.log("player center:")
      console.info(player_center)
      console.log("area_rect.x:")
      console.info(this.area_rect.x)*/
    if (player_center.x < this.area_rect.x) {
      delta[0] = -1
    } else if (player_center.x > this.area_rect.getRightCenter().x) {
      delta[0] = 1
    }
    if (player_center.y < this.area_rect.y) {
      delta[1] = -1
    } else if (player_center.y > this.area_rect.getBottomCenter().y) {
      delta[1] = 1
    }
    console.log("delta: "+delta)
    if (delta[0] == -1) { //if new center is to be the 0th column, unshift to insert empty column while moving existing ones to the right
      for (let map of areas[2]) {map.destroy()}
      areas.pop()
      areas.unshift([0,0,0])
    } else if (delta[0] == 1) {
      for (let map of areas[0]) {map.destroy()}
      areas.shift()
      areas.push([0,0,0])
    }
    if (delta[1] == -1) {
      for (let col of areas) {
        if (col[2] != 0) {col[2].destroy()}
        col.pop()
        col.unshift(0)
      }
    } else if (delta[1] == 1) {
      for (let col of areas) {
        if (col[0] != 0) {col[0].destroy()}
        col.shift()
        col.push(0)
      }
    }
    this.earth_coord[0] += delta[0]
    this.earth_coord[1] += delta[1]
    let center = areas[1][1]
    let mx = center.tileToWorldXY(0, 0).x
    let my = center.tileToWorldXY(0, 0).y
    for (let col in areas) {
      for (let row in areas[col]) {
        if (areas[col][row] == 0) {
          let new_seed = []
          new_seed[0] = this.earth_coord[0]+parseInt(col)-1
          new_seed[1] = this.earth_coord[1]+parseInt(row)-1
          areas[col][row] = makeAreaMap(new_seed, this, [mx+(col-1)*map_px, my+(row-1)*map_px])
        }
      }
    }

    this.area_rect.setPosition(mx, my)

    /*
    areas[0][0] = makeAreaMap(0, this, [mx-map_px, my-map_px])
    areas[0][1] = makeAreaMap(0, this, [mx, my-map_px])
    areas[0][2] = makeAreaMap(0, this, [mx+map_px, my-map_px])
    areas[1][0] = makeAreaMap(0, this, [mx-map_px, my])
    //areas[1][1].destroy()
    areas[1][2] = makeAreaMap(0, this, [mx+map_px, my])
    areas[2][0] = makeAreaMap(0, this, [mx-map_px, my+map_px])
    areas[2][1] = makeAreaMap(0, this, [mx, my+map_px])
    areas[2][2] = makeAreaMap(0, this, [mx+map_px, my+map_px])*/

    //this.area_current = this.physics.add.staticGroup(this.area_rect)
  }

}
