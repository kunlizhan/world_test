import PseudoRand from './PseudoRand.js';

const area_size = 128
const tile_size = 16
const tile_types = 4
function vec_to_str(vec) { return vec.x.toString()+","+vec.y.toString() }

function newArea() {
	let area = [];
	for (var i = 0; i < area_size; i++) {
		let x = [];
		for (var j = 0; j < area_size; j++) {
			x.push(0);
		}
		area.push(x);
	}
  return area;
}

function genArea(seed) {
  let area = newArea();
	let ps = new PseudoRand(seed, 32)

	for (let col=0; col < area_size; col++) {
		for (let row=0; row < area_size; row++) {
			let n = parseInt(col*area_size+row)
			let index = 0
			switch (ps.nextN()) {
				case 0:
					index = 12
					break
				case 1:
					index = 8
					break
				case 2:
					index = 9
					break
				case 3:
					index = 10
					break
				case 4:
					index = 11
					break
				case 5:
				case 6:
					index = 1
					break
				case 7:
				case 8:
					index = 2
					break
				case 9:
				case 10:
					index = 3
					break
				case 11:
				case 12:
					index = 4
					break
				default:
					index = 0
					break
					console.error("not in range")
			}
			area[col][row] = index
		}
	}
	//console.log(area)
  return area;
}

export default function makeAreaMap(seed, game, pos) {
  // Load a map from a 2D array of tile indices
  let a_data = genArea(vec_to_str(seed));
  // When loading from an array, make sure to specify the tileWidth and tileHeight
  let map = game.make.tilemap({ data: a_data, tileWidth: tile_size, tileHeight: tile_size })
  let tiles = map.addTilesetImage('tiles_set', 'tiles_png', tile_size, tile_size, 1, 2)
  let layer = map.createLayer(0, tiles, pos[0], pos[1])
	map.setCollisionBetween(12,15)

	let area = {}
	area['map'] = map
	area['cld'] = game.physics.add.collider(game.player, layer)
	area['seed'] = seed

  return area;
}
