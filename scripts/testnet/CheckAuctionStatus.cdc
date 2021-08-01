import Auction from 0xfc747df8f5e61fcb

// address, where auction collection is stored
// auction id
pub fun main(address:Address, id: UInt64): Auction.AuctionStatus? {
    let acct = getAccount(address)

    let acctAuctionRef = acct.getCapability<&AnyResource{Auction.AuctionCollectionPublic}>(Auction.CollectionPublicPath)
        .borrow()
        ?? panic("Could not borrow auction public reference")

    return acctAuctionRef.getAuctionStatus(id)
}