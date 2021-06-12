import NonFungibleToken from 0xf8d6e0586b0a20c7
import Collectible from 0xf8d6e0586b0a20c7

pub fun main(address:Address) : Bool {

    let account = getAccount(address)
    let collectionCap = account.getCapability<&{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath)
    
    return collectionCap.check()
}