const AREA_SIZE = 128
importScripts('dep/promise-worker.register.js')
importScripts('https://cdn.jsdelivr.net/npm/phaser@3.53.1/dist/phaser.min.js')
const Vec2 = Phaser.Math.Vector2 //shorthand
importScripts('dep/sjcl.js')
importScripts('dep/perlin.js')
importScripts(`custom_maths.js`)
importScripts('area_algos.js')
importScripts('t_type.js')
importScripts(`PseudoRand.js`)
importScripts(`./world_data/static_overwrites.js`)

var lvl3_xy = new Vec2(81,108) // Tingi on the lvl 3 map
var lvl2_xy = new Vec2(39,95) // start location on lvl 2 map
//lvl2_xy = new Vec2(46,122)
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
  path_from_index(ind) {
    return (ind%2===0)? true : false
  }
  get_trans_type(quadrant_ind) {
    //quadrant_ind = new Map(quadrant_ind)
    quadrant_ind.forEach( (value, key)=>{quadrant_ind.set(key, base_from_composite(value))} )
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
            return {trans: "half and half", is_horizontal: horizontal}
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
          return {trans: "3 types with adj", half: orientation}
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
      quadrant_ind.set(2, parent[vec_id.x-1][vec_id.y-1])
      quadrant_ind.set(3, parent[vec_id.x-1][vec_id.y])
      quadrant_ind.set(4, parent[vec_id.x][vec_id.y])
      return quadrant_ind
    }
    let quadrant_ind = make_quadrant_ind(lvl2_adj.get("0_0"), vec_id)
    let trans = this.get_trans_type(quadrant_ind)
    let arr = this.get("arr")
    let ps = new PseudoRand(this.get("g_vec"))
    let unfinished = 4 //this is placeholder tile
    let of_interest = 8

    switch (trans.trans) {
      case `none`: {
        let type = base_from_composite(quadrant_ind.get(4))
        arr = Area_Algos.perlin_fill({L2vec:this.get(`g_vec`), L2tile:type})
      } break
      case `4 corners`: {
        arr = fill_all(unfinished)
      } break
      case `1 corner`: {
        let type = base_from_composite(trans.common_type)
        arr = Area_Algos.perlin_fill({L2vec:this.get(`g_vec`), L2tile:type})
        let corner_tile = quadrant_ind.get(trans.unique_quadrant)
        arr = Area_Algos.rand_walk_diag({
          area_arr: arr,
          pseudorand: ps,
          quad: trans.unique_quadrant,
          tile_index: Tile1.PATH,
          fill: base_tile1_from(corner_tile)
        })
        arr = Area_Algos.perlin_1_corner({L2vec:this.get(`g_vec`), L2tile_quad4: base_from_composite(quadrant_ind.get(4)), L2tile_common:type, L2tile_corner:base_from_composite(corner_tile), quad:trans.unique_quadrant})
      } break
      case `2 and 2 corners`: {
        arr = fill_all(unfinished)
      } break
      case `half and half`: {
        let type1 = base_from_composite(quadrant_ind.get(2))
        let type2 = base_from_composite(quadrant_ind.get(4))
        arr = Area_Algos.perlin_half({L2vec:this.get(`g_vec`), L2tile_quad2:type1, L2tile_quad4:type2, horizontal:false})
      } break
      case `3 types no adj`: {
        arr = fill_all(unfinished)
      } break
      case `3 types with adj`: {
        arr = fill_all(unfinished)
      }
    }
    //end switch
    arr = transpose(arr) //phaser uses transposed arrays for tilemap, in the form of [y][x]
    this.set("arr", arr)
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
      area_arr = Area_Algos.rand_walk_ortho({area_arr:area_arr, pseudorand:ps, tile_index:Tile1.DIRT, fill: Tile1.WATER})
      if (ps.next_bits() == 1) {
        //area_arr = matrix_rot_R(area_arr)
      }
      break
    case 1:
      area_arr = Area_Algos.rand_walk_diag({area_arr:area_arr, pseudorand:ps, tile_index: Tile1.DIRT})
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
