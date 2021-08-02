import Auction from  0x01cf0e2f2f715450

pub fun main(address:Address, id: UInt64 ): Auction.AuctionStatus? {
    let acct = getAccount(address)

    let acctAuctionRef = acct.getCapability<&AnyResource{Auction.AuctionCollectionPublic}>(Auction.CollectionPublicPath)
        .borrow()
        ?? panic("Could not borrow auction public reference")

    return acctAuctionRef.getAuctionStatus(id)
}