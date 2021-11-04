import AuctionV2 from 0x01cf0e2f2f715450

pub fun main(address:Address): {UInt64: AuctionV2.AuctionStatus}? {
    let acct = getAccount(address)

    let acctAuctionRef = acct.getCapability<&AnyResource{AuctionV2.AuctionCollectionPublic}>(AuctionV2.CollectionPublicPath)
        .borrow()
        ?? panic("Could not borrow auction public reference")

    return acctAuctionRef.getAuctionStatuses()
}
