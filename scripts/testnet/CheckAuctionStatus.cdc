import Auction from 0x2695ea898b04f0c0

pub fun main(address:Address, id: UInt64 ): Auction.AuctionStatus? {
    let acct = getAccount(address)

    let acctAuctionRef = acct.getCapability<&AnyResource{Auction.AuctionPublic}>(/public/auctionCollection)
        .borrow()
        ?? panic("Could not borrow auction public reference")

    return acctAuctionRef.getAuctionStatus(id)
}