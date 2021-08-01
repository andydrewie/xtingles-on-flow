import NonFungibleToken from 0x01cf0e2f2f715450
import Collectible from 0x01cf0e2f2f715450

pub fun main(address:Address) : Bool {

    let account = getAccount(address)
    let collectionCap = account.getCapability<&Collectible.Collection{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath)
    
    return collectionCap.check()
}