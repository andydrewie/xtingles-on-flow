import MarketPlace from  0x01cf0e2f2f715450

pub fun main(address:Address, id: UInt64): UFix64? {
    let acct = getAccount(address)

    let saleRef = acct.getCapability<&AnyResource{MarketPlace.SalePublic}>(/public/CollectibleSale)
        .borrow()
        ?? panic("Could not borrow sale reference")  

    return saleRef.idPrice(tokenID: id)
}