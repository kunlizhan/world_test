importScripts('dep/promise-worker.register.js')
importScripts('https://cdn.jsdelivr.net/npm/phaser@3.53.1/dist/phaser.min.js')
importScripts('dep/sjcl.js')
importScripts('dep/perlin.js')
importScripts('area_algos_copy.js')
importScripts('t_type.js')

//custom_maths start
const _90dg_in_rad = 1.570796
function vec_to_str(vec) { return vec.x.toString()+"_"+vec.y.toString() }
function rand_int_before(int) { return Math.floor(Math.random()*int) }
function rand_rot(interval) {	return rand_int_before(4)*_90dg_in_rad*interval }
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
function unflatten({arr, row_len, col_len=row_len}) {
  let new_m = []
  let row = 0
  while (row < row_len) {
    let row_arr = []
    let col = 0
    while (col < col_len) {
      //console.log(col)
      row_arr[col] = arr[col_len*row+col] -1 //compensate for Tiled exporting with +1
      col++
    }
    new_m[row] = row_arr
    row++
  }
  //console.log(new_m)
	return new_m
}
//custom_maths end
function str_to_vec(str) {
  let arr = str.split("_")
  let vec = new Phaser.Math.Vector2(parseInt(arr[0]), parseInt(arr[1]))
  return vec
}
//PseudoRand
class PseudoRand
{
  constructor(seed) {
    this.seed = seed
    this.m_len= 64
    this.m_base = 16
  	this.m_base_bits = (this.m_base-1).toString(2).length
    this.set_bit_len(2)

    this.bits = ""
    let str = sjcl.hash.sha256.hash(this.seed) //makes new str
    str = sjcl.codec.hex.fromBits(str)
    this.str = str
    //console.log("this.str : "+this.str )
	}

  set_bit_len(b) {
    this.n_bits = b
  	this.chars_per_n = Math.ceil(this.n_bits/this.m_base_bits)
    this.bits_per_chars = this.m_base_bits*this.chars_per_n
  }

  next_bits() {
    if (this.bits.length < this.n_bits) { this.next_chars() }
    let taken = this.bits.slice(-this.n_bits)
    //console.log("this.bits: "+this.bits)
  	//console.log("taken: "+taken)
  	this.bits = this.bits.slice(0, -this.n_bits)

  	let result = parseInt(taken, 2)
    //console.log("result: "+result)
    return result
  }

  next_chars() {
    if (this.str.length < this.m_len+this.chars_per_n) { this.next_str() }
    //console.log("this.str : "+this.str )
    let chars = this.str.slice(-this.chars_per_n)
    chars = parseInt(chars, this.m_base)
    chars = chars.toString(2).padStart(this.bits_per_chars, `0`)
    this.bits = chars+this.bits
    this.str = this.str.slice(0, -this.chars_per_n)
  }

  next_str() {
    let new_seed = this.str.slice(0, this.m_len)
    let next = sjcl.hash.sha256.hash(new_seed)
    next = sjcl.codec.hex.fromBits(next)
    this.str = next+this.str
  }

}
//PseudoRand end

const Vec2 = Phaser.Math.Vector2 //shorthand

const area_size = 128
var lvl3_xy = new Vec2(81,108) // Tingi on the lvl 3 map
var lvl2_xy = new Vec2(39,95) // start location on lvl 2 map
//const myScene = new Phaser.Scene(null)
var lvl3_adj = new Map()
var lvl2_adj = new Map()
var lvl1_adj = new Map()

fetch(`../assets/maps/lvl3_arr.json`)
  .then(response => response.json())
  .then(data => {
    let arr = unflatten({arr:data, row_len:area_size})
    arr = transpose(arr)
    lvl3_adj.set("0_0", arr)
  });

fetch(`../assets/maps/my_lvl3_81_108.json`)
  .then(response => response.json())
  .then(data => {
    let arr = unflatten({arr:data, row_len:area_size})
    arr = transpose(arr)
    lvl2_adj.set("0_0", arr)
  });

const wait = (duration) => new Promise(res => setTimeout(res, duration));

registerPromiseWorker(
  function tryJob(msg) {//allow retries

    try { return doJob(msg) }

    catch(err) {
      if (err.message == "Try again soon") {
        console.log("trying again soon")
        return wait(100).then(()=>tryJob(msg))
      }
      throw err
    }

  }//end retries
)

function doJob(msg) {
  switch (msg.job) {
    case "make_map":
      if (lvl3_adj.get("0_0") === false) {
        throw new Error("Try again soon")
      }
      if (lvl2_adj.has("0_0") === false) {
        throw new Error("Try again soon")
      }
      let move = new Vec2(0,0)
      if (msg.move !== undefined && msg.move.x !== undefined && msg.move.y !== undefined) {
        move.add({x:msg.move.x, y:msg.move.y})
        lvl2_xy.add(move)//moving by vector addition
      }
      let new_adj = new Map()
      for (let x=-1; x<=1; x++) { //fill lvl1_adj
        for (let y=-1; y<=1; y++) {
          //
          let key = new Vec2(x,y)
          let old_key = new Vec2(key)
          old_key.add(move) //if key of new area represents an area that already exists in adj, this would be its current key

          if (lvl1_adj.has(vec_to_str(old_key)) === true) {
            //console.log(`moving old area_obj`) //use old area_obj if it exists
            new_adj.set( vec_to_str(key), lvl1_adj.get(vec_to_str(old_key)) )
            //new_adj.set( vec_to_str(key), null )
          } else {
            //console.log(`making new area_obj`) //otherwise create new one
            let id = new Vec2(lvl2_xy)
            id.add(key)
            let parent = new Vec2(lvl3_xy)
            if (id.x < 0) { parent.x -= 1 }
            if (id.x >= area_size) { parent.x += 1 }
            if (id.y < 0) { parent.y -= 1 }
            if (id.y >= area_size) { parent.y += 1 }

            let area_obj = new Area(parent, id)
            area_obj.genArr({lvl:1})
            new_adj.set(vec_to_str(key), area_obj)
          }
          //
        }
      }
      //console.log(lvl2_adj.get("0_0"))
      lvl1_adj = new_adj
      return lvl1_adj
    case "get_lvl2":
      if (lvl2_adj.has("0_0") === false) {
        throw new Error("Try again soon")
      }
      return lvl2_adj.get("0_0")
    case "get_lvl2xy":
      return lvl2_xy
    default:
      //console.log(myScene)
      //myArea = new Phaser.Tilemaps.Tilemap(myScene, { data: [], tileWidth: 2, tileHeight: 2 })
      throw new Error("No such job")
  }
}

class Area extends Map
{
	constructor(parent, id)
	{
    super()
		this.set("id", vec_to_str(id))
    let g_vec = parent.scale(128)
    g_vec.add(id)
    this.set("g_vec", g_vec)
    //console.log(this.get("g_vec"))
    let arr = []
		for (var i = 0; i < area_size; i++) {
			let x = [];
			for (var j = 0; j < area_size; j++) {
				x.push(0);
			}
			arr.push(x);
		}
    this.set("arr", arr)
	}
  terr_from_index(ind) { //returns the smallest prime that is a factor of ind, this represents terrain type, which combine by multiplication
    if (ind===1) {return ind}
    const set = [3,5,7,11,13,17,19]
    for (let p of set){
      if (ind%p === 0) {
        return p
      }
    }
    throw new Error("no terrain type for ind: "+ind)
  }
  path_from_index(ind) {
    return (ind%2===0)? true : false
  }
  get_trans_type(types){
    function key_of_longest() {
      let key_of = undefined
      let record = []
      for (let [key, value] of types) {
        if (value.length > record.length) {
          key_of = key
          record = value
        }
      }
      return key_of
    }

    let longest = types.get(key_of_longest())
    switch (types.size) {
      case 1: return "no transition"
      case 4: return "4 corners"
      case 2:
        if (longest.length == 3) { return "1 corner" }
        else {
          let diff = Math.abs(longest[0]-longest[1])
          if (diff == 2) {return "2 and 2 corners"} else {return "half and half"} //only diagonal corners, quadrants (1,3) or (2,4) will have difference of exactly 2
        }
      case 3:
        let diff = Math.abs(longest[0]-longest[1])
        if (diff == 2) {return "2 and 2 corners"} else {return "half and 2 corners"}
    }
  }

  genArr({lvl=1}) {
    if (lvl2_adj.has("0_0") === false) {
      throw new Error("lvl2 not ready")
    }
    let vec_id = str_to_vec(this.get("id"))
    let types = new Map() //key is tile type, value is one or more quadrants that has that type
    function add_type(quadrant) {
      let x = (quadrant==1 || quadrant==4)? 0 : -1
      let y = (quadrant==1 || quadrant==2)? -1 : 0
      let ind = lvl2_adj.get("0_0")[vec_id.x+x][vec_id.y+y]
      let type = Area.prototype.terr_from_index(ind)
      types.has(type)? types.get(type).push(quadrant) : types.set(type, [quadrant])
    }
    for (let n=1; n<=4; n++) { add_type(n) }
    //console.log(types)
    let trans = this.get_trans_type(types)
    //console.log(trans)

    let type = lvl2_adj.get("0_0")[vec_id.x][vec_id.y]
    let ps = new PseudoRand(this.get("g_vec"))
    let arr = this.get("arr")
  	switch(type) {
  		case Tile2.DIRT:
        arr = make_desert(arr, this.get("g_vec"))
  			break
      case Tile2.WATER:
        arr = []
        for (var i = 0; i < area_size; i++) {
          let x = [];
          for (var j = 0; j < area_size; j++) {
            x.push(13);
          }
          arr.push(x);
        }
        break
      case 6:
        arr = make_desert(arr, this.get("g_vec"))
        arr = make_path(arr, ps)
        break
  	}
    this.set("arr", arr)
  }
}

function make_path(area_arr, ps) {
  ps.set_bit_len(1)
  switch (ps.next_bits()) {
    case 0:
      area_arr = rand_walk_ortho({area_arr:area_arr, pseudorand:ps, tile_index:Tile1.DIRT, fill: Tile1.WATER})
      if (ps.next_bits() == 1) {
        //area_arr = matrix_rot_R(area_arr)
      }
      break
    case 1:
      area_arr = rand_walk_diag({area_arr:area_arr, pseudorand:ps, tile_index: Tile1.DIRT})
      ps.set_bit_len(2)
      /*switch (ps.next_bits()) {
        case 0:
          area_arr = matrix_rot_R(area_arr)
        case 1:
          area_arr = matrix_rot_R(area_arr)
        case 2:
          area_arr = matrix_rot_R(area_arr)
        case 3:
          break
      }*/
      break
  }
  return area_arr
}

function make_desert(area_arr, g_vec) {
  let parent = g_vec.scale(128)
  //console.log(parent)
  let max = area_arr.length
  let scale = 0.05
  for (let x = 0; x < max; x++) {
    for (let y = 0; y < max; y++) {
      let large = noise.simplex2((x+parent.x)*scale, (y+parent.y)*scale)
      large = (Math.min(large, 0)+1)
      let small = noise.simplex2((x+parent.x)*0.5, (y+parent.y)*0.5)
      small = (Math.min(small, 0)+1)
      let value = large/2 + small/2// range is 0, 1
      //value = (2+value)/4 //range is 0, 1
      //value = (Math.min(value,0.5))*2 //take only lesser half and scale it to range of 0, 1
      value = Math.floor(value*8)
      value = (value>=4) ? -8 : value
      area_arr[y][x] = 8+value//phaser uses y first in 2d array
    }
  }
  return area_arr
}

function make_path_perlin(area_arr, g_vec) {
  let parent = g_vec.scale(128)
  let max = area_arr.length
  let scale = 0.05

}

function make_patch({area_arr, ps, set, size_max=2}) {

}

function make_patch2({area_arr, ps, set, size_max=2}) {
  let max = area_arr.length
  ps.set_bit_len(2)
  let size = Math.min(ps.next_bits(),size_max)
  ps.set_bit_len(7)
  let x = ps.next_bits()
  let y = ps.next_bits()
  for (let x1=-size; x1<=size; x1++) { //for adjacents
    for (let y1=-size/2; y1<=size/2; y1++) {
      let x2 = x+x1
      let y2 = y+y1
      if (0 <= x2 && x2<max && 0 <= y2 && y2<max) {//keep in bounds
        //console.log(`${x2},${y2}`)
        let ab_x1 = Math.abs(x1)
        let ab_y1 = Math.abs(y1)
        let man_dist = (ab_x1+ab_y1)
        ps.set_bit_len(3)
        let rng = ps.next_bits()
        switch (man_dist) {
          case 0:
            area_arr[x2][y2] = set[man_dist]
            break
          case 1:
            if (rng < 3) { area_arr[x2][y2] = set[man_dist] }
            else { area_arr[x2][y2] = set[man_dist+1] }
            break
          case 2:
            if (rng < 5) { area_arr[x2][y2] = set[man_dist] }
            else { area_arr[x2][y2] = set[man_dist+1] }
            break
          case 3:
            if (rng < 4) { area_arr[x2][y2] = set[man_dist] }
            break
          case 4:
            if (rng < 2) { area_arr[x2][y2] = set[3] }
            break
        }
      }
    }
  }
}
