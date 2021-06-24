import Collectible, MarketPlace from  0x01cf0e2f2f715450

pub fun main(address: Address, id: UInt64): &Collectible.NFT? {
    let acct = getAccount(address)

    let saleRef = acct.getCapability<&AnyResource{MarketPlace.SalePublic}>(MarketPlace.CollectionPublicPath)
        .borrow()
        ?? panic("Could not borrow sale reference")  

    return saleRef.borrowCollectible(id: id)
}