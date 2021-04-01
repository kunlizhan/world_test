const area_size = 128
function vec_to_str(vec) { return vec.x.toString()+","+vec.y.toString() }

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
	//console.log( "seed:"+seed );
	//console.log( "hash:"+hash );
	let tree_count = hash.substring(0, 1);
	tree_count = parseInt(tree_count, 16);
	console.log( "trees:"+tree_count );

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
  let a_data = genArea(vec_to_str(seed));
  // When loading from an array, make sure to specify the tileWidth and tileHeight
  let map = game.make.tilemap({ data: a_data, tileWidth: 8, tileHeight: 8 })
  let tiles = map.addTilesetImage('tiles_set', 'tiles_png', 8, 8, 1, 2)
  let layer = map.createLayer(0, tiles, pos[0], pos[1])
	map.setCollision(1)

	let area = {}
	area['map'] = map
	area['cld'] = game.physics.add.collider(game.player, layer)
	area['seed'] = seed
	//var test = game.physics.add.collider(game.player, layer)
	//test.name = seed
	//game.physics.world.removeCollider(test);
	//console.log(game.physics.world.colliders.getActive())
	//game.physics.world.removeCollider(game.physics.world.colliders.getActive()[0]);
  return area;
}
