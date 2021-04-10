importScripts('promise-worker.register.js')
importScripts('https://cdn.jsdelivr.net/npm/phaser@3.53.1/dist/phaser.min.js')

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

const Vec2 = Phaser.Math.Vector2 //shorthand

const area_size = 128
this.lvl3_xy = new Vec2(81,108) // Tingi on the lvl 3 map
this.lvl2_xy = new Vec2(14,14) // start location on lvl 2 map
//const myScene = new Phaser.Scene(null)
this.lvl3_adj = new Map()
this.lvl2_adj = new Map()
this.lvl1_adj = new Map()

fetch(`/assets/maps/my_lvl3_81_108.json`)
  .then(response => response.json())
  .then(data => {
    let arr = unflatten({arr:data, row_len:area_size})
    this.lvl3_adj.set(new Vec2(0,0), arr)
    this.lvl3_adj_ready = true
    console.log("ready")
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
      if (msg.arg.x !== undefined && msg.arg.y !== undefined) {
        this.lvl2_xy.x = msg.arg.x
        this.lvl2_xy.y = msg.arg.y
        //future code for moving by vector addition
      }
      if (this.lvl3_adj_ready !== true) {
        throw new Error("Try again soon")
      }

      for (let x=-1; x<=1; x++) { //fill lvl1_adj
        for (let y=-1; y<=1; y++) {
          let key = new Vec2(x,y)
          if (this.lvl1_adj.has(key) === false) {
            let id = new Vec2(this.lvl2_xy)
            id.add(key)
            console.log(id)
            let area_obj = new Area(id)
            this.lvl1_adj.set(key, area_obj)
          }
        }
      }

      //let centerMap = new Map()
      //lvl1_adj.set(new Vec2(0,0), centerMap)
      return this.lvl1_adj
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
	}
}
