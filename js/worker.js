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

const AREA_SIZE = 128
var lvl3_xy = new Vec2(81,108) // Tingi on the lvl 3 map
var lvl2_xy = new Vec2(39,95) // start location on lvl 2 map
//const myScene = new Phaser.Scene(null)
var lvl3_adj = new Map()
var lvl2_adj = new Map()
var lvl1_adj = new Map()

fetch(`../assets/maps/lvl3_arr.json`)
  .then(response => response.json())
  .then(data => {
    let arr = unflatten({arr:data, row_len:AREA_SIZE})
    arr = transpose(arr)
    lvl3_adj.set("0_0", arr)
  });

fetch(`../assets/maps/my_lvl3_81_108.json`)
  .then(response => response.json())
  .then(data => {
    let arr = unflatten({arr:data, row_len:AREA_SIZE})
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
            if (id.x >= AREA_SIZE) { parent.x += 1 }
            if (id.y < 0) { parent.y -= 1 }
            if (id.y >= AREA_SIZE) { parent.y += 1 }

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
    this.set("arr", fill_all(0))
	}

  terr_from_index(ind) { //returns the smallest prime that is a factor of ind, this represents terrain type, which combine by multiplication
    if (ind===Tile2.SPECIAL) {return ind}
    const set = [Tile2.DIRT, Tile2.WATER, Tile2.CITY, 11,13,17,19]
    for (let prime of set){
      if (ind%prime === 0) {
        return prime
      }
    }
    throw new Error("no terrain type for ind: "+ind)
  }
  path_from_index(ind) {
    return (ind%2===0)? true : false
  }
  get_trans_type(quadrant_ind){
    let types_ind = new Map()
    quadrant_ind.forEach(
      (value, key)=>{
        types_ind.has(value)? types_ind.get(value).push(key) : types_ind.set(value, [key])
      }
    )
    function key_of_longest(map) {
      let key_of = undefined
      let record = []
      map.forEach(
        (value, key)=>{
          if (value.length > record.length) {
            key_of = key
            record = value
          }
        }
      )
      return key_of
    }
    let most_common_type = key_of_longest(types_ind)
    let common_quads = types_ind.get(most_common_type)
    switch (types_ind.size) {
      case 1: return {trans: "none"}
      case 4: return {trans: "4 corners"}
      case 2:
        if (common_quads.length == 3) {
          let corner = null
          types_ind.forEach( (value)=> {if (value.length===1) {corner = value[0]} } )
          return {trans: "1 corner", unique_quadrant: corner, common_type: most_common_type }
        }
        else {
          let diff = Math.abs(common_quads[0]-common_quads[1]) //only diagonal corners, quadrants (1,3) or (2,4) will have difference of exactly 2
          if (diff == 2) {return {trans: "2 and 2 corners"}}
          else {
            let horizontal = ( quadrant_ind.get(1) === quadrant_ind.get(2) )
            return {trans: "half and half", horizontal: horizontal}
          }
        }
      case 3:
        let diff = Math.abs(common_quads[0]-common_quads[1])
        if (diff == 2) {return {trans: "3 types no adj"}}
        else {
          let orientation = null
          if (common_quads.includes(1)) {
            if (common_quads.includes(2)) { orientation="top" }
            else { orientation="right" }
          }
          else if (common_quads.includes(3)) {
            if (common_quads.includes(4)) { orientation="bottom" }
            else { orientation="left" }
          }
          return {trans: "3 types yes adj", half: orientation}
        }
    }
  }

  genArr({lvl=1}) {
    if (lvl2_adj.has("0_0") === false) {
      throw new Error("lvl2 not ready")
    }
    let vec_id = str_to_vec(this.get("id"))

    function make_quadrant_ind(parent, vec_id) {
      let quadrant_ind = new Map()
      quadrant_ind.set(1, parent[vec_id.x][vec_id.y-1])
      quadrant_ind.set(2, parent[vec_id.x-1][vec_id.y])
      quadrant_ind.set(3, parent[vec_id.x-1][vec_id.y-1])
      quadrant_ind.set(4, parent[vec_id.x][vec_id.y])
      return quadrant_ind
    }
    let quadrant_ind = make_quadrant_ind(lvl2_adj.get("0_0"), vec_id)
    let trans = this.get_trans_type(quadrant_ind)
    console.log(trans)
    let arr = this.get("arr")
    let ps = new PseudoRand(this.get("g_vec"))

    switch (trans.trans) {
      case `none`: {
        let type = quadrant_ind.get(4)
        arr = fill_all(base_tile1_from(type))
      } break
      case `4 corners`: {

      } break
      case `1 corner`: {
        arr = fill_all(base_tile1_from(trans.common_type))
        let type = quadrant_ind.get(trans.unique_quadrant)
        arr = rand_walk_ortho({area_arr: arr, pseudorand: ps, tile_index: Tile1.PATH, fill: base_tile1_from(type)})
      } break
      case `2 and 2 corners`: {

      } break
      case `half and half`: {

      } break
      case `3 types no adj`: {

      } break
      case `3 types yes adj`: {

      }
    }
    this.set("arr", arr)

    let type = lvl2_adj.get("0_0")[vec_id.x][vec_id.y]
    if (trans.trans === `none`) {
      if (type === Tile2.DIRT) {arr = make_desert(arr, this.get("g_vec"))}
    }
  	switch(type) {
  		case Tile2.DIRT:
        arr = make_desert(arr, this.get("g_vec"))
  			break
      case Tile2.WATER:
        arr = fill_all(Tile1.WATER)
        break
      case 6:
        arr = make_desert(arr, this.get("g_vec"))
        arr = make_path(arr, ps)
        break
  	}
    //this.set("arr", arr)
  }
}
function fill_all(tile) {
  let arr = []
  for (var i = 0; i < AREA_SIZE; i++) {
    let x = [];
    for (var j = 0; j < AREA_SIZE; j++) {
      x.push(tile);
    }
    arr.push(x);
  }
  return arr
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
