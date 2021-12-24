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
function matrix_rot_R(m) {//rotates a [col][row] matrix by a quarter turn clockwise, if [row][col] this is a ccw turn instead, such as [y][x]
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
      row_arr[col] = arr[col_len*row+col] -1 //compensate for Tiled exporting with +1
      col++
    }
    new_m[row] = row_arr
    row++
  }
  //console.log(new_m)
	return new_m
}
//custom_maths end
function str_to_vec(str) {
  let arr = str.split("_")
  let vec = new Phaser.Math.Vector2(parseInt(arr[0]), parseInt(arr[1]))
  return vec
}
function point_mirror_xy(vec) {
  let {x, y} = vec
  return new Vec2(y,x)
}
function point_mirror_x(vec, size=AREA_SIZE) {
  let {x, y} = vec
  y = size -1 -y
  return new Vec2(x,y)
}
function point_mirror_y(vec, size=AREA_SIZE) {
  let {x, y} = vec
  x = size -1 -x
  return new Vec2(x,y)
}
function point_rot_R(vec, size=AREA_SIZE) {
  let result = point_mirror_x(vec, size)
  result = point_mirror_xy(result)
  return result
}
function point_rot_L(vec, size=AREA_SIZE) {
  let result = point_mirror_y(vec, size)
  result = point_mirror_xy(result)
  return result
}

function get_orth_from_hypotenuse(x=0, r=0) {
  return (r**2 - x**2)**(0.5)
}
function clamp(n, min=0, max=AREA_SIZE-1) {
  return Math.min(Math.max(n, min), max)
}
function line_points_btwn(vec1, vec2) {
  let d = vec1.distance(vec2)
  let ROOT2 = 1.42
  let return_points = []
  if (d>ROOT2) {
    for (let i=1; i<=d-1; i++) {
      let interpolation = new Vec2(vec1)
      interpolation.lerp(vec2, i/d)
      interpolation.x = Math.round(interpolation.x)
      interpolation.y = Math.round(interpolation.y)
      return_points.push(interpolation)
    }
  }
  return_points.push(new Vec2(vec2))
  return return_points
}
