// area level 1 tile types
// export const dirt = 0
// export const path = 2
// export const grass = 8
// export const rock = 12
const Tile1 = {
  DIRT: 0,
  PATH: 3,
  ROCK: 12,
  WATER: 13,
  GREEN: 14
}
const Tile2 = {
  SPECIAL: 1,
  PATH: 2,
  DIRT: 3,
  WATER: 5,
  CITY: 7
}
function base_tile1_from(tile2) {
  let base = base_from_composite(tile2)

  switch (base) {
    case Tile2.DIRT: return Tile1.DIRT
    case Tile2.WATER: return Tile1.WATER
    case Tile2.CITY: return Tile1.DIRT
    default: {
      console.error(`no tile rule for ${tile2}`)
      return 0
    }
  }
}
function base_from_composite(ind) {//returns the smallest prime that is a factor of ind, this represents terrain type, which combine by multiplication
  if (ind===Tile2.SPECIAL) {return ind}
  const set = [Tile2.DIRT, Tile2.WATER, Tile2.CITY, 11,13,17,19]
  for (let prime of set){
    if (ind%prime === 0) {
      //console.log(ind, prime)
      return prime
    }
  }
  throw new Error("no terrain type for ind: "+ind)
}
function make_terrain_arr(kv_itr) {
  let arr = []
  let map = new Map(kv_itr)
  map.forEach((value, key) => {
    let i = value
    while (i >= 1) {
      arr.push(key)
      i--
    }
  })
  return arr
}
const TerrainSets = new Map([
  [Tile2.DIRT, make_terrain_arr([
    [Tile1.DIRT, 15],
    [11,1],
    [10,1],
    [9,2],
    [8,1]
  ])]
])
