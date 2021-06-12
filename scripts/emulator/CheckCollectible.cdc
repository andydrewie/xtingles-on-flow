//emulator
import Collectible from 0xf8d6e0586b0a20c7

/*
  This script will check an address and print out its Collectible resources
 */
pub fun main(address:Address, id: UInt64) : Collectible.CollectibleData {

  let collectible = Collectible.getCollectible(address: address, id: id)

  return collectible
}