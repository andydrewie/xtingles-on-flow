import Collectible from 0xf5b0eb433389ac3f

/*
  This script will check an address and print out its Collectible resources
 */
pub fun main(address:Address) : [Collectible.CollectibleData] {

    let collectible = Collectible.getCollectibleDatas(address: address)
    
    return collectible
}