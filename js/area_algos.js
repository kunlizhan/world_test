var array = []
var area_size = 0
var use_tile = -1
var c_x = 0
var c_y = 0
function set_c_tile_ind() {
  //console.log("drawing path: "+c_x+", "+c_y)
  array[c_x][c_y] = use_tile
}

export function rand_walk_ortho({area_arr, pseudorand, tile_index}) {
  array = area_arr
  area_size = array.length
  use_tile = tile_index

  let start_col = Math.floor((area_size-1)/2)
  array[start_col].forEach(function(item, index){
    array[start_col][index] = -1
  })
  c_x = start_col
  c_y = 0
  let max_drift = Math.floor((area_size-1)/4)
  // add turns

  //console.log("drawing path: "+c_x+", "+c_y)
  function turn(one) {
    let diff = c_x-start_col
    if (Math.abs(diff+one) <= max_drift) {
      return one
    } else {
      console.log("correcting diff: "+diff)
      if (diff > 0) {
        return -1
      } else if (diff < 0){
        return 1
      } else {
        return 0
      }
    }
  }
  pseudorand.set_bit_len(2)
  use_tile = -1
  set_c_tile_ind()
  use_tile = tile_index
  for (let row=0; row < area_size-1; row++) {

    if (row >= Math.floor((area_size-1)/2)) { //tighten drift at halfway
      let remain_distance = (area_size-1)-c_y
      max_drift = Math.floor(Math.abs(  ((area_size-1)/4)*((remain_distance-4)/(area_size/2))  ))
      //array[c_x][c_y] = 8
      //console.log("at "+c_x+", "+(c_y+1)+" the drift is "+max_drift)
      if ((area_size-1)-c_y < 5) {
        max_drift = 0
        console.log("drift set to zero: "+(c_x-start_col))
        use_tile = 8
      }
      /*if (max_drift == 0) {
        //console.error("got to zero at"+c_x+","+c_y)
        array[c_x][c_y] = 12
      }*/
    }
    switch (pseudorand.next_bits()) {
    //to do: add drift correction
    case 0:
    case 1:
       //stay forward
      break
    case 2:
      c_x += turn(1) //turns
      set_c_tile_ind()
      break
    case 3:
      c_x += turn(-1) //turn other way
      set_c_tile_ind()
      break
    }
    c_y += 1 //move forward and draw again
    set_c_tile_ind()
  }
  array[start_col][area_size-1] = 12
  console.error("done path")
  return array
}
export function rand_walk_diag({area_arr, pseudorand, tile_index}) {
  array = area_arr
  area_size = array.length
  use_tile = tile_index

  c_x = 0
  c_y = Math.floor((area_size-1)/2)
  let target_x = Math.floor((area_size-1)/2)
  let target_y = 0

  let total_steps_x = Math.abs(target_x - c_x)
  let total_steps_y = Math.abs(target_y - c_y)
  console.log("target_x: "+target_x)
  console.log("target_y: "+target_y)

  pseudorand.set_bit_len(1)
  use_tile = -1
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

  return array
}
