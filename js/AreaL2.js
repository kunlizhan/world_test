import PseudoRand from './PseudoRand.js';
import * as cm from './custom_maths.js';
import * as area_algos from './area_algos.js';
import * as t_type from './t_type.js';

const area_size = 128

function make_blank_arr(size) {
	let data = [];
	for (let i = 0; i < size; i++) {
		let x = [];
		for (let j = 0; j < size; j++) {
			x.push(0);
		}
		data.push(x);
	}
}

export default class AreaL2 {

  constructor({lvl3vec, scene}) {
		this.scene = scene
		let name = cm.vec_to_str(lvl3vec)
		let fullname = this.fullname = `my_lvl3_${name}`
    let area_arr = make_blank_arr(area_size)
  	let ps = new PseudoRand(name)
  	ps.set_bit_len(1)

		let key = (area_size)*lvl3vec.y+lvl3vec.x // converts 2d to 1d key
		this.lvl3_tile = scene.lvl3_arr[key]-1
		console.log("value of lvl3 "+cm.vec_to_str(lvl3vec)+": "+this.lvl3_tile)

		if (this.lvl3_tile == 4) { //special tile with custom lvl2_arr
			if (scene.cache.json.get(fullname) !== undefined) {
				//console.log(`${fullname} is already loaded!`)
				this.mapLoaded()
			} else {
				scene.load.json(fullname, `assets/maps/${fullname}.json`)
				scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
					this.mapLoaded()
				})
				scene.load.start()
			}
		}

  	this.layers = {}
		this.layers.terr = "terrain"
		this.layers.path = "paths"
  	this.seed = lvl3vec

    //
  }
	mapLoaded() {
		this.map = cm.unflatten({arr: this.scene.cache.json.get(this.fullname), row_len: area_size})
		console.log(this.map)
	}
}
