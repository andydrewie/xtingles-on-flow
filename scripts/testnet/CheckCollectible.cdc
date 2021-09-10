import Collectible from 0xef28e7ce9a3cea1d

/*
  This script will check an address and print out its Collectible resources
 */
pub fun main(address:Address) : [Collectible.CollectibleData] {

    let collectible = Collectible.getCollectibleDatas(address: address)
    
    return collectible
}