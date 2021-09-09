import Collectible from 0xbf117454d836d021

/*
  This script will check an address and print out its Collectible resources
 */
pub fun main(address:Address) : [Collectible.CollectibleData] {

    let collectible = Collectible.getCollectibleDatas(address: address)
    
    return collectible
}