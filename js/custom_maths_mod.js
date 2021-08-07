export const _90dg_in_rad = 1.570796
export function vec_to_str(vec) { return vec.x.toString()+"_"+vec.y.toString() }
export function rand_int_before(int) { return Math.floor(Math.random()*int) }
export function rand_rot(interval) {	return rand_int_before(4)*_90dg_in_rad*interval }
export function transpose(m) {
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
export function matrix_rot_R(m) {//rotates a [col][row] matrix by a quarter turn clockwise, if [row][col] this is a ccw turn instead
	for (let col of m) { col.reverse() }
	m = transpose(m)
	return m
}
export function unflatten({arr, row_len, col_len=row_len}) {
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
