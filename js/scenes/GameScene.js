const DUDE_KEY = 'dude'
const walk_speed = 400
const map_px = 128*16 //tiles * tile px size
const tile_size = 16
var scene = undefined
var camera = undefined
var areas = [
  [0,0,0],
  [0,0,0],
  [0,0,0]
]
var worker = undefined

function str_to_vec(str) {
  let arr = str.split("_")
  let vec = new Phaser.Math.Vector2(parseInt(arr[0]), parseInt(arr[1]))
  return vec
}

import AreaL1 from '../AreaL1.js';
import AreaL2 from '../AreaL2.js';
export default class GameScene extends Phaser.Scene
{
  constructor()
	{
		super('game-scene')
    scene = this
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

    this.load.plugin('rexvirtualjoystickplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js', true);

	}

  create()
	{
    this.player = this.createPlayer()
    this.player.setDepth(1)
    this.cursors = this.input.keyboard.createCursorKeys()
    this.keyInput = {}
    this.keyInput.w = this.input.keyboard.addKey('W')
    this.keyInput.a = this.input.keyboard.addKey('A')
    this.keyInput.s = this.input.keyboard.addKey('S')
    this.keyInput.d = this.input.keyboard.addKey('D')
    this.joyStickBase = this.add.circle(0, 0, 100, 0x888888)
    this.joyStickBase.setDepth(10)
    this.joyStickThumb = this.add.circle(0, 0, 50, 0xcccccc)
    this.joyStickThumb.setDepth(10)
    this.joyStick = scene.plugins.get('rexvirtualjoystickplugin').add(this, {
                x: 120,
                y: 600,
                radius: 100,
                base: this.joyStickBase,
                thumb: this.joyStickThumb,
                // dir: '8dir',   // 'up&down'|0|'left&right'|1|'4dir'|2|'8dir'|3
                // forceMin: 16,
                // enable: true
            })

		this.lvl3_arr = this.cache.json.get('lvl3_arr')
    this.areas = areas

    camera = this.cameras.main
    camera.startFollow(this.player)

    this.area_rect = this.add.rectangle(0, 0, map_px, map_px, 0x00ff00);
    this.area_rect.setOrigin(0)// this shorthand moves origin from default center to top left
    this.area_current = this.physics.add.group(this.area_rect)

    //start new worker async job for creating area
    this.lvl1_adj = new Map()

    this.updateMaps()
	}

  update()
  {
    let cursors = this.cursors
    let player = this.player
    let keys = this.keyInput

    let up = (cursors.up.isDown)||(keys.w.isDown)||(this.joyStick.up)
    let left = (cursors.left.isDown)||(keys.a.isDown)||(this.joyStick.left)
    let down = (cursors.down.isDown)||(keys.s.isDown)||(this.joyStick.down)
    let right = (cursors.right.isDown)||(keys.d.isDown)||(this.joyStick.right)

    if (left)
    {
        player.setVelocityX(-walk_speed)
        player.anims.play('left', true)
        if (!this.physics.world.overlap(player, this.area_current)) {
          this.step_adj()
        }
    }
    else if (right)
    {
        player.setVelocityX(walk_speed)
        player.anims.play('right', true)
        if (!this.physics.world.overlap(player, this.area_current)) {
          this.step_adj()
        }
    }
    else
    {
        player.setVelocityX(0)
        player.anims.play('turn')
    }
    if (up)
    {
        player.setVelocityY(-walk_speed)
        if (!this.physics.world.overlap(player, this.area_current)) {
          this.step_adj()
        }
    }
    else if (down)
    {
        player.setVelocityY(walk_speed)
        if (!this.physics.world.overlap(player, this.area_current)) {
          this.step_adj()
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

  step_adj() {
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
    this.area_rect.setPosition(
      delta.x*this.area_rect.width+this.area_rect.x,
      delta.y*this.area_rect.height+this.area_rect.y
    )
    this.updateMaps(delta)
  }

  updateMaps(delta) {

    worker.postMessage(
      {job:"make_map", move: delta}
    ).then(
      function (response) {
        let new_adj = response
        //console.log(new_adj)
        //console.log(scene.lvl1_adj)

        for (let [old_key, old_value] of scene.lvl1_adj.entries()) {
          let old_id = old_value.get("id")
          //console.log(id)
          for (let [key, value] of new_adj.entries()) {
            let id = value.get("id")
            if (old_id === id) {
              //console.log(`old matches`)
              new_adj.set(key, old_value)
              scene.lvl1_adj.delete(old_key)
            } else {
              //console.log(`old doesn't match`)
            }
          }
          if (scene.lvl1_adj.has(old_key)) {
            console.log(`delete old map`)
            scene.lvl1_adj.get(old_key).get("cldr").destroy()
            scene.lvl1_adj.get(old_key).get("map").destroy()
            scene.lvl1_adj.delete(old_key)
          }
        }
        //console.log(new_adj)
        scene.lvl1_adj = new_adj
        scene.renderMaps()
      }
    ).catch(
      function (err) {
        console.log(`error response: ${err.message}`)
      }
    )
  }

  renderMaps() {
    for (let [key, value] of this.lvl1_adj.entries()) {
      if (value.has("map") === false) {
        console.log(`create new map`)
        let arr = value.get("arr")
        let map = scene.make.tilemap({ data: arr, tileWidth: tile_size, tileHeight: tile_size })
        value.set("map", map)
        //console.log(value)
        let tiles = map.addTilesetImage('tiles_set', 'tiles_png', tile_size, tile_size, 1, 2)
        let delta = str_to_vec(key)
        //console.log(delta)
        let layer = map.createLayer(0, tiles, delta.x*map_px+this.area_rect.x, delta.y*map_px+this.area_rect.y)
      	map.setCollisionBetween(12,15)

      	value.set("map", map)
      	value.set("cldr", scene.physics.add.collider(scene.player, layer) )
      }
    }
    console.log(this.lvl1_adj)
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
