import MarketPlace from 0xf8d6e0586b0a20c7

pub fun main(address:Address, id: UInt64): UFix64? {
    let acct = getAccount(address)

    let acctsaleRef = acct.getCapability<&AnyResource{MarketPlace.SalePublic}>(MarketPlace.CollectionPublicPath)
        .borrow()
        ?? panic("Could not borrow nft sale reference")

    return acctsaleRef.idPrice(tokenID: id)
}
