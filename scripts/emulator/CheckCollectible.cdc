//emulator
import Collectible from  0x01cf0e2f2f715450

/*
  This script will check an address and print out its Collectible resources
 */
pub fun main(address:Address) : [Collectible.CollectibleData] {

  let collectible = Collectible.getCollectibleDatas(address: address)

  return collectible
}