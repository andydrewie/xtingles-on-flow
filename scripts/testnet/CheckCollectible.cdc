import Collectible from 0x01547a7e742007d9

/*
  This script will check an address and print out its Collectible resources
 */
pub fun main(address:Address) : [Collectible.CollectibleData] {

    let collectible = Collectible.getCollectibleDatas(address: address)
    
    return collectible
}