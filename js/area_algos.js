//dependencies: worker.js, perlin, phaser, custom_maths, t_type

const Area_Algos = {}

Area_Algos.blank = function(tile) {
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
Area_Algos.Tile_Compare = class Tile_Compare extends Object {
  constructor(int1, int2) {
    super()
    if (int1 <= int2) { this.smaller = int1; this.larger = int2 }
    else { this.smaller = int2; this.larger = int1 }
  }
}
Area_Algos.perlin_half = function({L2vec, quadrant_ind, trans}) {
  let area_algos = this
  let q2 = base_from_composite(quadrant_ind.get(2))
  let q4 = base_from_composite(quadrant_ind.get(4))
  let compare = new this.Tile_Compare(q2, q4)
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
  let compare = new this.Tile_Compare(tile_common, tile_corner)
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
Area_Algos.comp_3_adj = function({L2vec, quadrant_ind, trans}) {
}
Area_Algos.get_perlin_border_value = function(L1_gvec) {
  let pv = this.perlin_L1_value
  let large = pv(L1_gvec, `large`)
  let medium = pv(L1_gvec, `medium`)
  let small = pv(L1_gvec, `small`)
  let value = ( (large*22)+medium*2+(small*0.1) )/24.1
  //range is -1, 1
  return value
}

Area_Algos.border_half = function({L2vec, quadrant_ind, trans, arr}) {
  let current_L1 = new Vec2()
  if (trans.is_horizontal) { current_L1.set(0, AREA_SIZE/2) }
  else  { current_L1.set(AREA_SIZE/2, 0) }
  function next_point() {
    let move_current = new Vec2()
    if (trans.is_horizontal) { move_current.set(1,0) }
    else  { move_current.set(0,1) }
    current_L1.add(move_current)
  }
  //console.log(current_point)
  let parent = new Vec2(L2vec)
  parent.scale(AREA_SIZE)
  for (let i=AREA_SIZE; i>0; i--) {
    let L1_gvec = new Vec2(parent)
    L1_gvec.add(current_L1)
    let perlin = this.get_perlin_border_value(L1_gvec) * (AREA_SIZE*(3/8))
    perlin = Math.floor(perlin)

    let target_L1 = new Vec2(current_L1)
    let move_target = new Vec2()
    if (trans.is_horizontal) { move_target.set(0, perlin) }
    else  { move_target.set(perlin, 0) }
    target_L1.add(move_target)
    let {x, y} = target_L1
    arr[x][y] = 1

    next_point()
  }
  let set2 = this.L2tile_to_terrain_set(base_from_composite(quadrant_ind.get(2)))
  let set4 = this.L2tile_to_terrain_set(base_from_composite(quadrant_ind.get(4)))
  for (let i=0; i<AREA_SIZE; i++) {
    let PASSED_BORDER = false
    for (let j=0; j<AREA_SIZE; j++) {
      let [x, y] = trans.is_horizontal? [i,j] : [j,i]
      if (arr[x][y] === 1) { PASSED_BORDER = true }
      let set = undefined
      set = !PASSED_BORDER? set2 : set4
      let L1_gvec = new Vec2(x,y)
      L1_gvec.add(parent)
      //console.log(L1_gvec)
      let detail_value = this.perlin_content(L1_gvec)
      detail_value = Math.floor(detail_value*set.length)
      arr[x][y] = set[detail_value]
    }
  }
  return arr
}

Area_Algos.border_1_corner = function({L2vec, quadrant_ind, trans, arr}) {
  // create new arr filled with a non-corner quadrant
  let circle = new this.Corner_Circle(trans.unique_quadrant)
  let transformed = new this.Perlin_from_Circle(circle, L2vec)
  let points = transformed.points
  let first = points[0]

  // draw first point, then loop through remaining points, drawing lines from the last point each time.
  arr[first.x][first.y] = trans.non_unique_quadrant
  for (let i=1; i< points.length; i++) {
    let p_to_next = line_points_btwn(points[i-1], points[i]) // array of vec to next point
    p_to_next.forEach( point => {
      let {x,y} = point
      arr[x][y] = trans.non_unique_quadrant
    })
  }

  // fill
  let start_corner = undefined
  switch (trans.unique_quadrant) {
    case 1: start_corner = new Vec2(AREA_SIZE-1, 0)
      break
    case 2: start_corner = new Vec2(0, 0)
      break
    case 3: start_corner = new Vec2(0, AREA_SIZE-1)
      break
    case 4: start_corner = new Vec2(AREA_SIZE-1, AREA_SIZE-1)
      break
  }
  let start_non_corner = point_mirror_x(point_mirror_y(start_corner))
  this.boundary_fill(arr, start_corner, trans.unique_quadrant)
  this.boundary_fill(arr, start_non_corner, trans.non_unique_quadrant)
  //this.detail_quadrants(arr, quadrant_ind)
  return arr
}
Area_Algos.Corner_Circle = class Corner_Circle extends Object {
  constructor(quad) {
    super()
    let points = []
    let r = AREA_SIZE/2
    let middle = Math.floor(((r**2)/2)**0.5)
    //draw circle in quadrant 2
    for (let x = 0; x <= middle; x++) {
      let y = Math.round(get_orth_from_hypotenuse(x,r))
      let vec = new Vec2(x,y)
      points.push(vec)
    }
    for (let y = middle; y >= 0; y--) {
      let x = Math.round(get_orth_from_hypotenuse(y,r))
      let vec = new Vec2(x,y)
      points.push(vec)
    }
    // transform circle to correct quadrant. Mirrors so that first vec is always on horizontal
    let transform = undefined
    switch (quad) {
      case 1: transform = (vec) => point_mirror_y(vec)
        break
      case 2: transform = (vec) => vec
        break
      case 3: transform = (vec) => point_mirror_x(vec)
        break
      case 4: transform = (vec) => point_mirror_x(point_mirror_y(vec))
        break
    }
    this.points = []
    for (let i=0; i<points.length; i++) {
      if (i%3 === 2) {continue} // remove some points for smoothing
      this.points.push(transform(points[i]))
    }
  }
}
Area_Algos.Perlin_from_Circle = class Perlin_from_Circle extends Object {
  constructor(circle, L2gvec) {
    super()
    this.points = []
    let parent = new Vec2(L2gvec)
    parent.scale(AREA_SIZE)
    let max_ind = circle.points.length-1

    circle.points.forEach(
      (vec, ind, arr) => {
        let L1_gvec = new Vec2(vec)
        L1_gvec.add(parent)

        let perlin = Area_Algos.get_perlin_border_value(L1_gvec) * (AREA_SIZE*(3/8))
        let influence_x = Math.floor( perlin * (ind) / max_ind )
        let influence_y = Math.floor( perlin * (max_ind - ind) / max_ind )

        let r_vec = new Vec2(influence_x, influence_y)
        r_vec.add(vec)

        let {x,y} = r_vec
        x = clamp(x)
        y = clamp(y)
        r_vec.set(x,y)
        this.points.push(r_vec)
      }
    )
  }
}
Area_Algos.boundary_fill = function(arr, vec, tile) {
  let queue = []
  queue.push(vec)
  let color = arr[vec.x][vec.y]
  if (color === tile) {console.warn(`vec tile value is already equal`); return}
  while (queue.length > 0) {
    let current_vec = queue.pop()
    let {x,y} = current_vec
    try { current_color = arr[x][y] }
    catch(e) {
      if (e instanceof TypeError) { continue }
      else { throw e }
    }
    if (current_color === color) {
      arr[x][y] = tile
      let q_add = []
      q_add.push(new Vec2(Phaser.Math.Vector2.RIGHT))
      q_add.push(new Vec2(Phaser.Math.Vector2.LEFT))
      q_add.push(new Vec2(Phaser.Math.Vector2.UP))
      q_add.push(new Vec2(Phaser.Math.Vector2.DOWN))
      q_add.forEach(v => {
        v.add(current_vec)
        queue.push(v)
      })
    }
  }
}
