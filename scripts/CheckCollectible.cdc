//emulator
import NonFungibleToken from 0xf8d6e0586b0a20c7
import Collectible from 0xf8d6e0586b0a20c7

/*
  This script will check an address and print out its Collectible resources
 */
pub fun main(address:Address) : [Collectible.CollectibleData] {

    let collectible = Collectible.getCollectible(address: address)
    
    return collectible
}