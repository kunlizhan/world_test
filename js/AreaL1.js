import PseudoRand from './PseudoRand.js';
import * as cm from './custom_maths.js';
import * as area_algos from './area_algos.js';
import * as t_type from './t_type.js';

const area_size = 128
const tile_size = 16

class Area
{
	constructor(size)
	{
		this.size = size
		this.data = [];
		for (var i = 0; i < size; i++) {
			let x = [];
			for (var j = 0; j < size; j++) {
				x.push(0);
			}
			this.data.push(x);
		}
	}
}

export default class AreaL1 {

  constructor(seed, scene, pos) {

    // Load a map from a 2D array of tile indices
    let area_arr = new Area(area_size).data;
    // When loading from an array, make sure to specify the tileWidth and tileHeight
    let map = undefined

  	let ps = new PseudoRand(cm.vec_to_str(seed))
  	ps.set_bit_len(1)
    let type = ps.next_bits()
    type = 1
  	switch(type) {
  		case 0:
  			make_desert(ps)
  			break
  		case 1:
  			make_path(ps)
  			break
  	}

    let tiles = map.addTilesetImage('tiles_set', 'tiles_png', tile_size, tile_size, 1, 2)
    let layer = map.createLayer(0, tiles, pos[0], pos[1])
  	map.setCollisionBetween(12,15)

  	this.map = map
  	this.cldr = scene.physics.add.collider(scene.player, layer)
  	this.seed = seed

    //

  	function make_desert(ps) {
  		ps.set_bit_len(5)

      map = scene.make.tilemap({ data: area_arr, tileWidth: tile_size, tileHeight: tile_size })

  		for (let col=0; col < area_size; col++) {
  			for (let row=0; row < area_size; row++) {
  				let index = 0
  				let rotate = 0
  				switch (ps.next_bits()) {
  					case 0:
  						index = 12
  						break
  					case 1:
  						index = 8
  						rotate = cm.rand_rot(1)
  						break
  					case 2:
  						index = 9
  						rotate = cm.rand_rot(1)
  						break
  					case 3:
  					case 4:
  					case 5:
  						index = 10
  						rotate = cm.rand_rot(1)
  						break
  					case 6:
  					case 7:
  						index = 4
  						rotate = cm.rand_rot(2)
  						break
  					case 8:
  						index = 5
  						rotate = cm.rand_rot(1)
  						break
  					default:
  						index = 0
  						break
  						console.error("not in range")
  				}
  				let tile = map.getTileAt(col, row)
  				tile.index = index
  				tile.rotation = rotate
  			}
  		}
  	}

  	function make_path(ps) {
  		ps.set_bit_len(1)
  		switch (ps.next_bits()) {
  			case 0:
	        area_arr = area_algos.rand_walk_ortho({area_arr:area_arr, pseudorand:ps, tile_index:2})
					if (ps.next_bits() == 1) {
						area_arr = cm.matrix_rot_R(area_arr)
					}
					break
				case 1:
	        area_arr = area_algos.rand_walk_diag({area_arr:area_arr, pseudorand:ps, tile_index:2})
					ps.set_bit_len(2)
		  		switch (ps.next_bits()) {
						case 0:
							area_arr = cm.matrix_rot_R(area_arr)
						case 1:
							area_arr = cm.matrix_rot_R(area_arr)
						case 2:
							area_arr = cm.matrix_rot_R(area_arr)
						case 3:
							break
					}
					break
  		}
      //console.log(area_arr)
      area_arr = cm.transpose(area_arr)
      //area_arr = cm.matrix_rot_R(area_arr)
      map = scene.make.tilemap({ data: area_arr, tileWidth: tile_size, tileHeight: tile_size })
  	}
  }
}
