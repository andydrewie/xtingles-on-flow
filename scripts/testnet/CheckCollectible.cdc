import Collectible from 0xfc747df8f5e61fcb

/*
  This script will check an address and print out its Collectible resources
 */
pub fun main(address:Address) : [Collectible.CollectibleData] {

    let collectible = Collectible.getCollectible(address: address)
    
    return collectible
}