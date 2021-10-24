import AuctionV2 from 0x1bc62b2c04dfd147

// address, where auction collection is stored
// auction id
pub fun main(address:Address, id: UInt64): AuctionV2.AuctionStatus? {
    let acct = getAccount(address)

    let acctAuctionRef = acct.getCapability<&AnyResource{AuctionV2.AuctionCollectionPublic}>(AuctionV2.CollectionPublicPath)
        .borrow()
        ?? panic("Could not borrow auction public reference")

    return acctAuctionRef.getAuctionStatus(id)
}