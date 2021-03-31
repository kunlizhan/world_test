const area_size = 128

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
	let out = sjcl.hash.sha256.hash(seed); //hashes seed into bitArray
	let hash = sjcl.codec.hex.fromBits(out); //convert bitArray to 64 digit hexadecimal
	console.log( hash );

	let tree_count = hash.substring(0, 1);
	tree_count = parseInt(tree_count, 16);
	console.log( tree_count );

  let area = newArea();
	function tree_place(count) {
		//reset tile
		for (var i = 0; i < count; i++) {
			let x = hash.substring(64-4*i-2, 64-4*i); //out of last 4 hex digits, takes the last 2
			x = parseInt(x, 16); //this is a number from 0 to 255
      x = Math.floor(x/2) //scale to match space of area_size
			//console.log( x );
			let y = hash.substring(64-4*i-4, 64-4*i-2); //out of above 4 hex digits, takes the first 2
			y = parseInt(y, 16);
			//console.log( y );
      y = Math.floor(y/2)

			//place it
			area[x][y] = 1;
		}
	}

	tree_place(tree_count);
  return area;
}

export default function makeAreaMap(seed, game, pos) {
  // Load a map from a 2D array of tile indices
  let a_data = genArea(seed);
  // When loading from an array, make sure to specify the tileWidth and tileHeight
  let map = game.make.tilemap({ data: a_data, tileWidth: 16, tileHeight: 16 });
  let tiles = map.addTilesetImage('tiles');
  let layer = map.createLayer(0, tiles, pos[0], pos[1]).setDepth(-1);
  return map;
}
