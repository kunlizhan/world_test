//dependencies: worker.js, perlin, phaser, custom_maths, t_type

const Area_Algos = {}

Area_Algos.paint = function({array, c_y, c_x, use_tile, fill}) {
  array[c_y][c_x] = use_tile
  if (!Object.is(fill, undefined)) {
    for (let y=c_y-1; y >= 0; y--) {
      array[y][c_x] = fill
    }
  }
}

Area_Algos.rand_walk_ortho = function({area_arr, pseudorand, horizontal, tile_index, fill}) { //draw horizontal, endpoints in top quadrants
  let array = area_arr
  let area_size = array.length
  let use_tile = tile_index
  function set_c_tile_ind() {
    Area_Algos.paint({array, c_y, c_x, use_tile, fill})
  }

  let target_x = area_size-1
  let target_y = Math.floor((area_size-1)/2)
  let c_x = 0
  let c_y = target_y

  let total_steps_x = Math.abs(c_x - target_x)

  let max_drift = Math.floor((area_size-1)/4)
  // add turns

  //console.log("drawing path: "+c_y+", "+c_x)
  function next_y(move_y) {
    let diff = c_y-target_y
    if (Math.abs(diff+move_y) > max_drift) {
      //console.log("correcting diff: "+diff)
      if (diff > 0) {
        move_y = -1
      } else if (diff < 0){
        move_y = 1
      } else {
        move_y = 0
      }
    }
    switch (move_y) {
      case -1:
        c_y += -1
        //set_c_tile_ind()
        break
      case 0:
        break
      case 1:
        c_y += 1
        //set_c_tile_ind()
        break
    }
  }

  pseudorand.set_bit_len(2)
  for (c_x; c_x <= target_x; c_x++) {
    set_c_tile_ind()

    let remain_distance = (target_x)-c_x
    if (remain_distance < Math.floor(total_steps_x/2)) { //tighten drift at halfway
      max_drift = Math.floor(Math.abs(  (total_steps_x/4)*((remain_distance-4)/(total_steps_x/2))  ))
      //array[c_y][c_x] = 8
      //console.log("at "+c_y+", "+(c_x+1)+" the drift is "+max_drift)
      if (remain_distance < 5) {
        max_drift = 0
        //console.log("drift set to zero: "+(c_y-target_y))
        //use_tile = 8
      }

    }
    switch (pseudorand.next_bits()) {
    //to do: add drift correction
    case 0:
    case 1:
      next_y(0) //stay forward
      break
    case 2:
      next_y(1) //turns -1 y
      break
    case 3:
      next_y(-1) //turns +1 y
      break
    }
  }
  if (!horizontal) { array = matrix_rot_R(array) }
  return array
}

Area_Algos.rand_walk_diag = function({area_arr, pseudorand, quad, tile_index, fill}) { // draw from left to top, in left top quadrant
  let array = area_arr
  let area_size = array.length
  let use_tile = tile_index
  c_x = 0
  c_y = Math.floor((area_size-1)/2)
  function set_c_tile_ind() {
    Area_Algos.paint({array, c_y, c_x, use_tile, fill})
  }

  let target_x = Math.floor((area_size-1)/2)
  let target_y = 0

  let total_steps_x = Math.abs(target_x - c_x)
  let total_steps_y = Math.abs(target_y - c_y)

  pseudorand.set_bit_len(1)
  //use_tile = -1
  set_c_tile_ind()
  use_tile = tile_index
  let ps_result = undefined
  //redirect with weights
  let x_taken = 1
  let y_taken = 1
  //smoothing with length cap
  let consecutive_cap = 4
  let x_consecutive = 1
  let y_consecutive = 1

  for (let step=0; step < (total_steps_x+total_steps_y); step++) {
    if (step > (total_steps_x+total_steps_y)/2) {
      if (x_taken >= y_taken*1.1) {
        ps_result = 1
      } else if (y_taken >= x_taken*1.1) {
        ps_result = 0
      } else {
        ps_result = pseudorand.next_bits()
      }
    } else {
      ps_result = pseudorand.next_bits()
    }

    if (x_consecutive == consecutive_cap) {
      ps_result = 1
    } else if (y_consecutive == consecutive_cap) {
      ps_result = 0
    }

    switch (ps_result) {
      case 0:
        c_x += 1
        x_taken += 1
        x_consecutive += 1
        y_consecutive = 0
        break
      case 1:
        c_y -= 1
        y_taken += 1
        y_consecutive += 1
        x_consecutive = 0
        break
    }
    set_c_tile_ind()
    //console.log("at "+c_x+", "+(c_y))
    if (c_x == target_x) {
      while (c_y != target_y) {
        c_y -= 1
        set_c_tile_ind()
        step++
      }
      break
    } else if (c_y == target_y) {
      while (c_x != target_x) {
        c_x += 1
        set_c_tile_ind()
        step++
      }
      break
    }
  }

  //apply rotations
  if (!Object.is(quad, undefined)) {
    current_quad = 2 //quadrant 2 is where we drew the diagonal from left to top
    while (current_quad != quad) {
      array = matrix_rot_R(array)
      current_quad = (current_quad === 4) ? 1 : current_quad +1 //loops
    }
  }
  return array
}
Area_Algos.perlin_L1_value = function(L1_gvec, detail=`medium`) { //returns a number between 0, 1
  let {x, y} = L1_gvec
  let scale = 0.05
  switch(detail) {
    case `large`: scale = 0.005
      break
    case `medium`: scale = 0.05
      break
    case `small`: scale = 0.5
      break
  }
  let value = noise.simplex2(x*scale, y*scale)
  //value = (value+1) /2
  return value
}
Area_Algos.draw_area = function(L2vec, op=undefined) {
  let arr = []
  let parent = new Vec2(L2vec)
  parent.scale(128)
  for (let x = 0; x < AREA_SIZE; x++) {
    let col = [];
    for (let y = 0; y < AREA_SIZE; y++) {
      let L1_vec = new Vec2(x,y)
      let L1_gvec = new Vec2(L1_vec)
      L1_gvec.add(parent)
      let tile = op({L1_gvec:L1_gvec, L1_vec:L1_vec})
      col.push(tile);
    }
    arr.push(col);
  }
  return arr
}
Area_Algos.L2tile_to_terrain_set = function(L2tile) {
  let set = TerrainSets.get(L2tile) //gets an array of tile numbers defined in t_type
  if (Object.is(set, undefined)) {set = [base_tile1_from(L2tile)]}
  return set
}

Area_Algos.perlin_fill = function({L2vec, L2tile}) {
  let area_algos = this
  let set = this.L2tile_to_terrain_set(L2tile) //gets an array of tile numbers defined in t_type
  let op = function({L1_gvec}) {
    let value = area_algos.perlin_content(L1_gvec)
    value = Math.floor(value*set.length)
    return set[value]
  }
  return this.draw_area(L2vec, op)
}
Area_Algos.perlin_border = function(L1_gvec) {
  let pv = this.perlin_L1_value
  let large = pv(L1_gvec, `large`)
  let medium = pv(L1_gvec, `medium`)
  let small = pv(L1_gvec, `small`)
  let value = ( (large*22)+medium*2+(small*0.1) )/24.1
  value = (value+1) /2 //range is 0, 1
  return value * 0.8
}
Area_Algos.perlin_content = function(L1_gvec) {
  let pv = this.perlin_L1_value
  let value = (pv(L1_gvec, `medium`) + pv(L1_gvec, `small`))/2
  value = (value+1) /2
  return value
}
Area_Algos.perlin_half = function({L2vec, quadrant_ind, trans}) {
  let area_algos = this
  let q2 = base_from_composite(quadrant_ind.get(2))
  let q4 = base_from_composite(quadrant_ind.get(4))
  let compare = new Area_Algos.Tile_Compare(q2, q4)
  let set1 = this.L2tile_to_terrain_set(compare.smaller)
  let set2 = this.L2tile_to_terrain_set(compare.larger)

  let op = function({L1_gvec, L1_vec}) {
    let tilt = 0
    if (trans.is_horizontal) {
      tilt = (L1_vec.y)/AREA_SIZE
    } else {
      tilt = (L1_vec.x)/AREA_SIZE
    }

    terrain_total = (q2 <= q4)? (tilt) : 1-(tilt)
    terrain_total += area_algos.perlin_border(L1_gvec) - 0.4

    let set = set1
    if (terrain_total > 0.5) { set = set2 }
    let detail_value = area_algos.perlin_content(L1_gvec)
    detail_value = Math.floor(detail_value*set.length)
    return set[detail_value]
  }
  return this.draw_area(L2vec, op)
}
Area_Algos.perlin_1_corner = function({L2vec, quadrant_ind, trans}) {
  let area_algos = this
  let tile_common = base_from_composite(trans.common_type)
  let tile_corner = base_from_composite(quadrant_ind.get(trans.unique_quadrant))
  let compare = new Area_Algos.Tile_Compare(tile_common, tile_corner)
  let set1 = this.L2tile_to_terrain_set(compare.smaller)
  let set2 = this.L2tile_to_terrain_set(compare.larger)

  let op = function({L1_gvec, L1_vec}) {
    let tilt = 0
    switch(trans.unique_quadrant) {
      case 1: tilt = (AREA_SIZE + L1_vec.x - L1_vec.y) / (2*AREA_SIZE)
        break
      case 2: tilt = (2*AREA_SIZE - L1_vec.x - L1_vec.y) / (2*AREA_SIZE)
        break
      case 3: tilt = (AREA_SIZE - L1_vec.x + L1_vec.y) / (2*AREA_SIZE)
        break
      case 4: tilt = (L1_vec.x + L1_vec.y) / (2*AREA_SIZE)
        break
    }
    tilt = tilt*(2/3)

    terrain_total = (tile_common <= tile_corner)? (tilt) : 1-(tilt)
    terrain_total += ( area_algos.perlin_border(L1_gvec) -0.4 )/3

    let set = set1
    if (terrain_total > 0.5) { set = set2 }
    let detail_value = area_algos.perlin_content(L1_gvec)
    detail_value = Math.floor(detail_value*set.length)
    return set[detail_value]
  }
  return this.draw_area(L2vec, op)
}
Area_Algos.Tile_Compare = class Tile_Compare extends Object {
  constructor(int1, int2) {
    super()
    if (int1 <= int2) { this.smaller = int1; this.larger = int2 }
    else { this.smaller = int2; this.larger = int1 }
  }
}
