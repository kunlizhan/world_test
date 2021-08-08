//const Vec2 = Phaser.Math.Vector2
class VecMap extends Map
{
  delete(key) {
    key = vec_to_str(key)
    return super.delete(key)
  }
  get(key) {
    key = vec_to_str(key)
    return super.get(key)
  }
  has(key) {
    key = vec_to_str(key)
    return super.has(key)
  }
  set(key, value) {
    key = vec_to_str(key)
    return super.set(key, value)
  }
}
const static_overwrites = new Map()

{
  static_overwrites.set(`81_108`, new Map())
  static_overwrites.get(`81_108`).set(`special_arr`, `EXTERNAL URL` )
  static_overwrites.get(`81_108`).set(`39_96`, new Map() )
}
console.log(static_overwrites)
// console.log(static_overwrites.get(new Vec2(81,108)))
// static_overwrites.clear()
// console.log(new Vec2(81,108))
