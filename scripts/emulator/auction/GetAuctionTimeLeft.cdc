import Auction from  0x01cf0e2f2f715450

pub fun main(address:Address, id: UInt64 ): Fix64? {
    let acct = getAccount(address)

    let acctAuctionRef = acct.getCapability<&AnyResource{Auction.AuctionPublic}>(Auction.CollectionPublicPath)
        .borrow()
        ?? panic("Could not borrow auction public reference")

    return acctAuctionRef.getTimeLeft(id)
}