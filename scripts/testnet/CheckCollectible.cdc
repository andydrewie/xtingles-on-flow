import NonFungibleToken from 0x631e88ae7f1d7c20
import Collectible from 0x2695ea898b04f0c0

/*
  This script will check an address and print out its Collectible resources
 */
pub fun main(address:Address) : [Collectible.CollectibleData] {

    let collectible = Collectible.getCollectible(address: address)
    
    return collectible
}