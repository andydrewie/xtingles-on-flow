import NonFungibleToken from 0x01cf0e2f2f715450
import MarketPlace from 0x01cf0e2f2f715450

pub fun main(address:Address) : Bool {

    let acct = getAccount(address)
    let marketplaceCap = acct.getCapability<&{MarketPlace.SalePublic}>(MarketPlace.CollectionPublicPath)
    
    return marketplaceCap.check()
}