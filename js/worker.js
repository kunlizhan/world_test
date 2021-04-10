importScripts('dep/promise-worker.register.js')
importScripts('https://cdn.jsdelivr.net/npm/phaser@3.53.1/dist/phaser.min.js')
importScripts('dep/sjcl.js')
importScripts('area_algos_copy.js')

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
      row_arr[col] = arr[col_len*row+col]
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
function pad(str, digits) {
  while (str.length < digits) {str = "0" + str;}
  return str;
}

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
    chars = pad(chars.toString(2), this.bits_per_chars)
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

fetch(`/assets/maps/lvl3_arr.json`)
  .then(response => response.json())
  .then(data => {
    let arr = unflatten({arr:data, row_len:area_size})
    lvl3_adj.set("0_0", arr)
  });

fetch(`/assets/maps/my_lvl3_81_108.json`)
  .then(response => response.json())
  .then(data => {
    let arr = unflatten({arr:data, row_len:area_size})
    arr = transpose(arr)
    lvl2_adj.set("0_0", arr)
  });

const pause = (duration) => new Promise(res => setTimeout(res, duration));

registerPromiseWorker(
  function tryJob(msg) {//allow retries

    try {
      return doJob(msg)
    } catch(err) {
      if (err.message == "Try again soon") {
        console.log("trying again soon")
        return pause(100).then(()=>tryJob(msg))
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
        //shift lvl1_adj
      }
      let new_adj = new Map()
      for (let x=-1; x<=1; x++) { //fill lvl1_adj
        for (let y=-1; y<=1; y++) {
          //
          let key = new Vec2(x,y)
          let old_key = new Vec2(key)
          old_key.add(move)

          if (lvl1_adj.has(vec_to_str(old_key)) === true) {
            console.log(`moving old area_obj`)
            new_adj.set( vec_to_str(key), lvl1_adj.get(vec_to_str(old_key)) )
          } else {
            console.log(`making new area_obj`)
            let id = new Vec2(lvl2_xy)
            id.add(key)
            let area_obj = new Area(vec_to_str(id))
            area_obj.genArr({lvl:1})
            new_adj.set(vec_to_str(key), area_obj)
          }
          //
        }
      }
      console.log(lvl2_adj.get("0_0"))
      delete lvl1_adj
      lvl1_adj = new_adj
      return lvl1_adj
    default:
      //console.log(myScene)
      //myArea = new Phaser.Tilemaps.Tilemap(myScene, { data: [], tileWidth: 2, tileHeight: 2 })
      throw new Error("No such job")
  }
}

class Area extends Map
{
	constructor(id)
	{
    super()
		this.set("id", id)
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

  genArr({lvl=1}) {
    if (lvl2_adj.has("0_0") === false) {
      throw new Error("lvl2 not ready")
    }
    let vec_id = str_to_vec(this.get("id"))
    let type = lvl2_adj.get("0_0")[vec_id.x][vec_id.y]
    type = type-1
    console.log(`area type of ${this.get("id")}: ${type}`)

    let ps = new PseudoRand(this.get("id"))
  	ps.set_bit_len(1)
    //type = ps.next_bits()
    let arr = this.get("arr")
  	switch(type) {
  		case 3:
        arr = []
        for (var i = 0; i < area_size; i++) {
          let x = [];
          for (var j = 0; j < area_size; j++) {
            x.push(8);
          }
          arr.push(x);
        }
  			break
      case 5:
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
      area_arr = rand_walk_ortho({area_arr:area_arr, pseudorand:ps, tile_index:2})
      if (ps.next_bits() == 1) {
        area_arr = matrix_rot_R(area_arr)
      }
      break
    case 1:
      area_arr = rand_walk_diag({area_arr:area_arr, pseudorand:ps, tile_index:2})
      ps.set_bit_len(2)
      switch (ps.next_bits()) {
        case 0:
          area_arr = matrix_rot_R(area_arr)
        case 1:
          area_arr = matrix_rot_R(area_arr)
        case 2:
          area_arr = matrix_rot_R(area_arr)
        case 3:
          break
      }
      break
  }
  area_arr = transpose(area_arr)
  return area_arr
}
