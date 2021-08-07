// area level 1 tile types
// export const dirt = 0
// export const path = 2
// export const grass = 8
// export const rock = 12
const Tile1 = {
  DIRT: 0,
  PATH: 3,
  WATER: 13
}
const Tile2 = {
  SPECIAL: 1,
  PATH: 2,
  DIRT: 3,
  WATER: 5,
  CITY: 7
}
function base_tile1_from(tile2) {
  let base = terr_from_index(tile2)
  function terr_from_index(ind) {//returns the smallest prime that is a factor of ind, this represents terrain type, which combine by multiplication
    if (ind===Tile2.SPECIAL) {return ind}
    const set = [Tile2.DIRT, Tile2.WATER, Tile2.CITY, 11,13,17,19]
    for (let prime of set){
      if (ind%prime === 0) {
        return prime
      }
    }
    throw new Error("no terrain type for ind: "+ind)
  }
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
