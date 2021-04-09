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

const area_size = 128
this.lvl3_xy = new Phaser.Math.Vector2(81,108) // Tingi on the lvl 3 map
this.lvl2_xy = new Phaser.Math.Vector2(14,14) // start location on lvl 2 map
//const myScene = new Phaser.Scene(null)
this.lvl3_adj = new Map()
this.lvl2_adj = new Map()
this.lvl1_adj = new Map()

fetch(`/assets/maps/my_lvl3_81_108.json`)
  .then(response => response.json())
  .then(data => {
    let arr = unflatten({arr:data, row_len:area_size})
    this.lvl3_adj.set(new Phaser.Math.Vector2(0,0), arr)
    this.ready = true
    console.log("ready")
  });


registerPromiseWorker(function (msg) {
  if (this.ready !== true) { throw new Error('not ready'); }
  //console.log('Worker: Message received from main script')
  switch (msg.job) {
    case "make_map":
      if (msg.arg.x !== undefined && msg.arg.y !== undefined) {
        this.lvl2_xy.x = msg.arg.x
        this.lvl2_xy.y = msg.arg.y
      }
      let centerMap = new Map()
      lvl1_adj.set(new Phaser.Math.Vector2(0,0), centerMap)
      return this.lvl3_adj
      break
    default:
      //console.log(myScene)
      //myArea = new Phaser.Tilemaps.Tilemap(myScene, { data: [], tileWidth: 2, tileHeight: 2 })
      return "no such job"
  }
})

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
