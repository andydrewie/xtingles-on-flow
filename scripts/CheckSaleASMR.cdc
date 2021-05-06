import FixPrice from 0x9cd9bd78a3826840

pub fun main(address:Address): [UInt64] {
    let account = getAccount(address)

    let acct1saleRef = account.getCapability<&AnyResource{FixPrice.SalePublic}>(/public/NFTSale)
        .borrow()
        ?? panic("Could not borrow acct2 nft sale reference")

    return acct1saleRef.getIDs()
}
