function pad(str, digits) {
  while (str.length < digits) {str = "0" + str;}
  return str;
}

export default class PseudoRand
{
  constructor(seed, max_n)
	{
  	this.max_n = max_n
  	this.n_bits = (this.max_n-1).toString(2).length

    this.m_base = 16
  	this.m_base_bits = (this.m_base-1).toString(2).length

  	this.chars_per_n = Math.ceil(this.n_bits/this.m_base_bits)
    this.seed = seed
    this.m_iter = 0
    let m = sjcl.hash.sha256.hash(this.seed) //makes new hash
    this.m = sjcl.codec.hex.fromBits(m)
    //console.log("this.m : ")
    //console.log(this.m)
	}

  nextN() {
    //console.log(this.m)
    if (this.m.length < this.chars_per_n) { this.newM() }
  	let taken = this.m.slice(-this.chars_per_n)
  	//console.log("taken: "+taken)
  	this.m = this.m.slice(0, -this.chars_per_n)

  	let bits = parseInt(taken, this.m_base)
  	bits = pad(bits.toString(2), this.m_base_bits)
  	//console.log("bits: "+bits)
  	let result = bits.slice(-this.n_bits)
  	result = parseInt(result, 2)

  	//console.log(result)
  	return result
  }

  newM() {
    this.m_iter++
    let m = sjcl.hash.sha256.hash(this.seed)
    let runs = 0
    while (runs < this.m_iter) {
      m = sjcl.hash.sha256.hash(m)
      runs++
    }
    m = sjcl.codec.hex.fromBits(m)
    /*console.log("grown hash")
    console.log(m)
    console.log(runs)*/
    this.m = m
    this.m_iter = runs
  }
}
