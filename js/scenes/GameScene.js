const DUDE_KEY = 'dude'
const walk_speed = 400
const map_px = 128*16 //tiles * tile px size
const tile_size = 16
const max_z = 16777271

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
    this.makeInputs()

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

    //miniMap
    this.miniMapOn = true

    this.miniMap = this.add.graphics(0,0)
    this.miniMap.fillStyle(0xccaa88, 1.0)
    this.miniMap.fillRect(10, 10, 128*2, 128*2)
    this.miniMap.setDepth(max_z)
    this.miniMap.setScrollFactor(0)
    this.drawMiniMap()
    this.keyInput.m.on(`down`, ()=> {this.toggleMiniMap()} )
    this.miniDot = this.add.rectangle(10,10,6,6,0xFFFFFF,0)
    this.miniDot.setStrokeStyle(2, 0x000000)
    this.miniDot.setDepth(max_z)
    this.miniDot.setScrollFactor(0)
    this.miniDot.setOrigin(0)
    this.timerMiniDot = scene.time.addEvent({
      delay: 500,                // ms
      callback: () => {
        if (this.miniMap.visible) {
        this.miniDot.visible = !this.miniDot.visible
        }
      },
      //args: [],
      //callbackScope: thisArg,
      loop: true
    });
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
    player.setDepth(1)
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

        for (let [old_key, old_value] of scene.lvl1_adj.entries()) { //for every area already in lvl1_adj,
          let old_id = old_value.get("id")
          for (let [key, value] of new_adj.entries()) { //check if it will still be in use once updated,
            let id = value.get("id")
            if (old_id === id) { //if yes, then copy value to new_adj and delete this area in lvl1_adj,
              new_adj.set(key, old_value) //old_value needs to be copied because it contains references to Phaser objects for this area
              scene.lvl1_adj.delete(old_key)
            } else {
            }
          }
          if (scene.lvl1_adj.has(old_key)) { //now all remaining areas in lvl1_adj are those that are not in new_adj, so we destroy its related Phaser objects
            scene.lvl1_adj.get(old_key).get("cldr").destroy()
            scene.lvl1_adj.get(old_key).get("map").destroy()
            scene.lvl1_adj.delete(old_key)
          }
        }
        scene.lvl1_adj = new_adj //updated
        scene.renderMaps()
      }
    ).catch(
      function (err) {
        console.error(`error response: ${err.message}`)
      }
    )

    worker.postMessage(
      {job:"get_lvl2xy"}
    ).then(
      response => {
        this.miniDot.x = response.x*2+8
        this.miniDot.y = response.y*2+8
      }
    )
  }

  renderMaps() {
    for (let [key, value] of this.lvl1_adj.entries()) {
      if (value.has("map") === false) {
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
    //console.log(this.lvl1_adj)
  }

  makeInputs() {
    this.cursors = this.input.keyboard.createCursorKeys()
    this.keyInput = {}
    this.keyInput.w = this.input.keyboard.addKey('W')
    this.keyInput.a = this.input.keyboard.addKey('A')
    this.keyInput.s = this.input.keyboard.addKey('S')
    this.keyInput.d = this.input.keyboard.addKey('D')
    this.keyInput.m = this.input.keyboard.addKey('M')
    this.joyStickBase = this.add.circle(0, 0, 100, 0x888888)
    this.joyStickBase.setDepth(max_z)
    this.joyStickThumb = this.add.circle(0, 0, 50, 0xcccccc)
    this.joyStickThumb.setDepth(max_z)
    this.joyStick = scene.plugins.get('rexvirtualjoystickplugin').add(this, {
        x: 81,
        y: window.innerHeight-81,
        radius: 100,
        base: this.joyStickBase,
        thumb: this.joyStickThumb,
        // dir: '8dir',   // 'up&down'|0|'left&right'|1|'4dir'|2|'8dir'|3
        // forceMin: 16,
        // enable: true
    })
    this.scale.on('resize', function (gameSize) {
      this.joyStick.setPosition(81, window.innerHeight-81)
    }, this)
  }

  toggleMiniMap() {
    this.miniMapOn = !this.miniMapOn
    if (this.miniMapOn) { this.miniMap.visible = this.miniDot.visible = true }
    else { this.miniMap.visible = this.miniDot.visible = false }
  }
  drawMiniMap(data) {
    worker.postMessage(
      {job:"get_lvl2"}
    ).then(
      (response) => {
        for (let x=0; x<128; x++) {
          for (let y=0; y<128; y++) {
            if (response[x][y] === Tile2.WATER) {
              this.miniMap.fillStyle(0x66aacc, 1.0)
              this.miniMap.fillRect(10+x*2, 10+y*2, 2, 2)
            }
          }
        }
      }
    ).catch(
      function (err) {
        console.error(`error response: ${err.message}`)
      }
    )
  }
}
