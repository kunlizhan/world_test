import PseudoRand from './PseudoRand.js';

const area_size = 128
const tile_size = 16
const tile_types = 4
const q_clckwse = 1.570796
function vec_to_str(vec) { return vec.x.toString()+","+vec.y.toString() }
function rand_int_before(int) { return Math.floor(Math.random()*int) }
function rand_rot(interval) {	return rand_int_before(4)*q_clckwse*interval }

function transpose(m) {
  let new_m = []
  let row = 0
  while (row < m[0].length) {
    let row_arr = []
    for (let col in m) {
      //console.log(col)
      row_arr[col] = m[col][row]
    }
    new_m[row] = row_arr
    row++
  }
  //console.log(new_m)
	return new_m
}
function matrix_rot_R(m) {//rotates a [col][row] matrix by a quarter turn clockwise, if [row][col] this is a ccw turn instead
	for (let col of m) { col.reverse() }
	m = transpose(m)
	return m
}

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

export default function makeAreaMap(seed, game, pos) {

  // Load a map from a 2D array of tile indices
  let area_arr = new Area(area_size).data;
  // When loading from an array, make sure to specify the tileWidth and tileHeight
  let map = undefined

	let ps = new PseudoRand(vec_to_str(seed))
	ps.set_bit_len(1)

	switch(ps.next_bits()) {
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

	let area = {}
	area['map'] = map
	area['cld'] = game.physics.add.collider(game.player, layer)
	area['seed'] = seed

  return area;

	function make_desert(ps) {
		ps.set_bit_len(5)

    map = game.make.tilemap({ data: area_arr, tileWidth: tile_size, tileHeight: tile_size })

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
						rotate = rand_rot(1)
						break
					case 2:
						index = 9
						rotate = rand_rot(1)
						break
					case 3:
					case 4:
					case 5:
						index = 10
						rotate = rand_rot(1)
						break
					case 6:
					case 7:
						index = 4
						rotate = rand_rot(2)
						break
					case 8:
						index = 5
						rotate = rand_rot(1)
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
		if (ps.next_bits() == 0 || true) {
			let type = "straight"
      let start_col = Math.floor((area_size-1)/2)
      /*  //test
      for (let row=0; row < area_size-1; row++) {
        area_arr[start_col][row] = -1
        //console.log(tile)
      }*/
      let c_col = start_col
      let c_row = 0
      let max_drift = Math.floor((area_size-1)/4)
      // add turns
      function set_c_tile(key) {
        //console.log("drawing path: "+c_col+", "+c_row)
        area_arr[c_col][c_row] = key
      }
      console.log("drawing path: "+c_col+", "+c_row)
      set_c_tile(2)
      function turn(one) {
        let diff = c_col-start_col
        if (Math.abs(diff) < max_drift) { return one }
        else {
          if (diff > 0) {
            return -1
          } else {
            return 1
          }
        }
      }
      ps.set_bit_len(2)
      for (let row=0; row < area_size; row++) {

        if (row >= Math.floor((area_size-1)/2)) { //tighten drift at halfway
          let remain_distance = (area_size-1)-c_row
          max_drift = Math.floor(Math.abs(  ((area_size-1)/4)*((remain_distance-4)/(area_size/2))  ))
          //area_arr[c_col][c_row] = 8
          //console.log("at "+c_col+", "+(c_row+1)+" the drift is "+max_drift)
          if ((area_size-1)-c_row < 5) {
            max_drift = 0
          }
          /*if (max_drift == 0) {
            //console.error("got to zero at"+c_col+","+c_row)
            area_arr[c_col][c_row] = 12
          }*/
        }
        switch (ps.next_bits()) {
        case 0:
        case 1:
           //stay forward
          break
        case 2:
          c_col += turn(1) //turns
          set_c_tile(2)
          break
        case 3:
          c_col += turn(-1) //turn other way
          set_c_tile(2)
          break
        }
        c_row += 1 //move forward and draw again
        set_c_tile(2)
      }
      area_arr[c_col].pop() //remove extra
      //console.log(area_arr)
      area_arr = matrix_rot_R(area_arr)
      map = game.make.tilemap({ data: area_arr, tileWidth: tile_size, tileHeight: tile_size })

		}	else {
			let type = "bent"
		}
	}
}
