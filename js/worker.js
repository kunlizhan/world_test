onmessage = function(e) {
  console.log('Worker: Message received from main script')
  const type = e.data[0]
  const arg = e.data[1]
  if (type == "make_map") {
    postMessage(arg)
  } else {
    console.log('Worker: no such job')
  }
}
