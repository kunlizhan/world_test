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
  switch (tile2) {
    case Tile2.DIRT: return Tile1.DIRT
    case Tile2.WATER: return Tile1.WATER
    case Tile2.CITY: return Tile1.DIRT
    default: return undefined
  }
}
