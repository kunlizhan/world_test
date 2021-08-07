function pad(str, digits) {
  while (str.length < digits) {str = "0" + str;}
  return str;
}

export default class PseudoRand
{
  constructor(seed) {
    this.seed = seed
    this.m_len= 64
    this.m_base = 16
  	this.m_base_bits = (this.m_base-1).toString(2).length
    this.set_bit_len(2)

    this.bits = ""
    let str = sjcl.hash.sha256.hash(this.seed) //makes new str
    str = sjcl.codec.hex.fromBits(str)
    this.str = str
    //console.log("this.str : "+this.str )
	}

  set_bit_len(b) {
    this.n_bits = b
  	this.chars_per_n = Math.ceil(this.n_bits/this.m_base_bits)
    this.bits_per_chars = this.m_base_bits*this.chars_per_n
  }

  next_bits() {
    if (this.bits.length < this.n_bits) { this.next_chars() }
    let taken = this.bits.slice(-this.n_bits)
    //console.log("this.bits: "+this.bits)
  	//console.log("taken: "+taken)
  	this.bits = this.bits.slice(0, -this.n_bits)

  	let result = parseInt(taken, 2)
    //console.log("result: "+result)
    return result
  }

  next_chars() {
    if (this.str.length < this.m_len+this.chars_per_n) { this.next_str() }
    //console.log("this.str : "+this.str )
    let chars = this.str.slice(-this.chars_per_n)
    chars = parseInt(chars, this.m_base)
    chars = pad(chars.toString(2), this.bits_per_chars)
    this.bits = chars+this.bits
    this.str = this.str.slice(0, -this.chars_per_n)
  }

  next_str() {
    let new_seed = this.str.slice(0, this.m_len)
    let next = sjcl.hash.sha256.hash(new_seed)
    next = sjcl.codec.hex.fromBits(next)
    this.str = next+this.str
  }

}
