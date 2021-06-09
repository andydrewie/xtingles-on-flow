import Auction from 0xf8d6e0586b0a20c7

pub fun main(address:Address, id: UInt64 ): Auction.AuctionStatus {
    let acct = getAccount(address)

    let acctAuctionRef = acct.getCapability<&AnyResource{Auction.AuctionPublic}>(/public/auctionCollection)
        .borrow()
        ?? panic("Could not borrow auction public reference")

    return acctAuctionRef.getAuctionStatus(id)
}