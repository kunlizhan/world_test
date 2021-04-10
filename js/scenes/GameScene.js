const DUDE_KEY = 'dude'
const walk_speed = 400
const map_px = 128*16 //tiles * tile px size
var camera = undefined
var areas = [
  [0,0,0],
  [0,0,0],
  [0,0,0]
]
var worker = undefined
var retry = undefined

import AreaL1 from '../AreaL1.js';
import AreaL2 from '../AreaL2.js';
export default class GameScene extends Phaser.Scene
{
  constructor()
	{
		super('game-scene')
    this.lvl3_xy = new Phaser.Math.Vector2(81,108) // Tingi on the lvl 3 map
    this.lvl2_xy = new Phaser.Math.Vector2(0,0) // start location on lvl 2 map
    this.lvl1_xy = new Phaser.Math.Vector2(0,0) // start location on lvl 1 map
	}

	preload()
	{
    worker = this.game.config.worker
    this.load.spritesheet(DUDE_KEY,
        'assets/dude.png',
        { frameWidth: 32, frameHeight: 48 }
    )
    this.load.image('tiles_png', 'assets/tiles.png')
    this.load.image('sky', 'assets/sky.png')
    this.load.json('lvl3_arr', 'assets/maps/lvl3_arr.json')
    this.load.json(`my_lvl3_81_108`, `assets/maps/my_lvl3_81_108.json`)

	}

  create()
	{
    this.player = this.createPlayer()
    this.player.setDepth(1)
    this.cursors = this.input.keyboard.createCursorKeys()
		this.lvl3_arr = this.cache.json.get('lvl3_arr')
    this.areas = areas
    //console.log(this)
    //this.physics.world.drawDebug = false

    camera = this.cameras.main
    camera.startFollow(this.player)

    this.area_rect = this.add.rectangle(0, 0, map_px, map_px, 0x00ff00);
    this.area_rect.setOrigin(0)// this shorthand moves origin from default center to top left
    this.area_current = this.physics.add.group(this.area_rect)

    //this.area_L2 = new AreaL2({lvl3vec: this.lvl3_xy, scene: this})

    areas[1][1] = new AreaL1(this.lvl2_xy, this, [0,0])
    //this.updateAreas()

    //start new worker async job for creating area
    this.lvl1_areas = new Map()

    retry = this.updateMaps.bind(this)
    this.updateMaps()

    worker.postMessage(
      {job:"make_map2", arg: "some args"}
    ).then(function (response) {
      console.log('Got response2: ')
      console.log(response)
    }).catch(function (err) {
      console.log('error response2: ')
      console.log(err.message); // 'naughty!'
    })
	}

  updateMaps() {

    worker.postMessage(
      {job:"make_map", arg: this.lvl2_xy}
    ).then(
      function (response) {
        console.log('Got response: ')
        console.log(response)
      }
    ).catch(
      function (err) {
        console.log(`error response: ${err.message}`)
        //retry()
      }
    )
  }

  update()
  {
    var cursors = this.cursors
    var player = this.player
    if (cursors.left.isDown)
    {
        player.setVelocityX(-walk_speed)
        player.anims.play('left', true)
        if (!this.physics.world.overlap(player, this.area_current)) {
          this.updateAreas()
        }
    }
    else if (cursors.right.isDown)
    {
        player.setVelocityX(walk_speed)
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
        player.setVelocityY(-walk_speed)
        if (!this.physics.world.overlap(player, this.area_current)) {
          this.updateAreas()
        }
    }
    else if (cursors.down.isDown)
    {
        player.setVelocityY(walk_speed)
        if (!this.physics.world.overlap(player, this.area_current)) {
          this.updateAreas()
        }
    }
    else
    {
        player.setVelocityY(0)
    }

  }

  createPlayer()
	{
		const player = this.physics.add.sprite(this.lvl1_xy.x, this.lvl1_xy.y, DUDE_KEY)

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
    //console.log(areas[1][1])
    let player_center = this.player.getCenter()
    let delta = new Phaser.Math.Vector2(0,0);
      /*console.log("player center:")
      console.info(player_center)
      console.log("area_rect.x:")
      console.info(this.area_rect.x)*/
    if (player_center.x < this.area_rect.x) {
      delta.x = -1
    } else if (player_center.x > this.area_rect.getRightCenter().x) {
      delta.x = 1
    }
    if (player_center.y < this.area_rect.y) {
      delta.y = -1
    } else if (player_center.y > this.area_rect.getBottomCenter().y) {
      delta.y = 1
    }
    console.log("delta: "+ delta.x+","+delta.y )
    if (delta.x == -1) { //if new center is to be the 0th column, unshift to insert empty column while moving existing ones to the right
      for (let area of areas[2]) {
        area.cldr.destroy()
        area.map.destroy()
      }
      areas.pop()
      areas.unshift([0,0,0])
    } else if (delta.x == 1) {
      for (let area of areas[0]) {
        area.cldr.destroy()
        area.map.destroy()
      }
      areas.shift()
      areas.push([0,0,0])
    }
    if (delta.y == -1) {
      for (let col of areas) {
        if (col[2] != 0) {
          col[2].cldr.destroy()
          col[2].map.destroy()
        }
        col.pop()
        col.unshift(0)
      }
    } else if (delta.y == 1) {
      for (let col of areas) {
        if (col[0] != 0) {
          col[0].cldr.destroy()
          col[0].map.destroy()
        }
        col.shift()
        col.push(0)
      }
    }
    //always runs
    this.lvl2_xy = this.lvl2_xy.add(delta)
    let center = areas[1][1]['map']
    let mx = center.tileToWorldXY(0, 0).x
    let my = center.tileToWorldXY(0, 0).y
    for (let col in areas) {
      for (let row in areas[col]) {
        if (areas[col][row] == 0) {
          let old = new Phaser.Math.Vector2(this.lvl2_xy)
          let new1 = new Phaser.Math.Vector2(parseInt(col)-1,parseInt(row)-1)
          //console.log("new1: "+ new1.x+","+new1.y )
          var new_seed = old.add(new1)
          areas[col][row] = new AreaL1(new_seed, this, [mx+(col-1)*map_px, my+(row-1)*map_px])
        }
      }
    }
    console.log("lvl2_xy: "+ this.lvl2_xy.x+","+this.lvl2_xy.y )
    console.log("this.areas:")
    console.log(this.areas)
    this.area_rect.setPosition(mx, my)
  }

}
