function rand_walk_ortho({area_arr, pseudorand, horizontal, tile_index, fill}) { //draw horizontal, endpoints in top quadrants
  let array = area_arr
  let area_size = array.length
  let use_tile = tile_index
  let do_fill = (fill==undefined)? false : true
  //console.log(do_fill)
  function set_c_tile_ind() {
    array[c_y][c_x] = use_tile
    if (do_fill) {
      for (let y=c_y-1; y >= 0; y--) {
        array[y][c_x] = fill
      }
    }
  }

  let target_x = area_size-1
  let target_y = Math.floor((area_size-1)/2)
  /*array.forEach(function(item, index){
    array[index][target_y] = -1
  })*/
  //c is for current, the current tile in question
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
      /*if (max_drift == 0) {
        //console.error("got to zero at"+c_y+","+c_x)
        array[c_y][c_x] = 12
      }*/
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
function rand_walk_diag({area_arr, pseudorand, quad, tile_index, fill}) { // draw from left to top, in left top quadrant
  let array = area_arr
  let area_size = array.length
  let use_tile = tile_index
  c_x = 0
  c_y = Math.floor((area_size-1)/2)
  function set_c_tile_ind() {
    array[c_y][c_x] = use_tile
  }

  let target_x = Math.floor((area_size-1)/2)
  let target_y = 0

  let total_steps_x = Math.abs(target_x - c_x)
  let total_steps_y = Math.abs(target_y - c_y)
  console.log("target_x: "+target_x)
  console.log("target_y: "+target_y)

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
      console.log("step: "+step)
      break
    } else if (c_y == target_y) {
      while (c_x != target_x) {
        c_x += 1
        set_c_tile_ind()
        step++
      }
      console.log("step: "+step)
      break
    }
  }
  //array[0][target_y+1] = 2
  //array[target_x+1][target_y] = 2
  return array
}
