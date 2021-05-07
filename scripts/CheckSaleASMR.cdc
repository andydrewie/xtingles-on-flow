import MarketPlace from 0x175e958cf586f54c

pub fun main(address:Address): [UInt64] {
    let account = getAccount(address)

    let acctsaleRef = account.getCapability<&AnyResource{MarketPlace.SalePublic}>(/public/ASMRSale)
        .borrow()
        ?? panic("Could not borrow acct2 nft sale reference")

    return acctsaleRef.getIDs()
}
