//emulator
import Collectible from  0x01cf0e2f2f715450

/*
  This script will check an address and print out its Collectible resources
 */
pub fun main(address:Address, id: UInt64) : Collectible.CollectibleData {

  let collectible = Collectible.getCollectible(address: address, id: id)

  return collectible
}