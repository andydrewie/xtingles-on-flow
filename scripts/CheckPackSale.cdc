import PackSale from 0xf8d6e0586b0a20c7

pub fun main(address:Address): {UInt64: PackSale.PackSaleStatus} {
    let acct = getAccount(address)

    let acctPackSaleRef = acct.getCapability<&AnyResource{PackSale.PackSalePublic}>(/public/packSaleCollection)
        .borrow()
        ?? panic("Could not borrow nft sale reference")

    return acctPackSaleRef.getPackSaleStatuses()
}
