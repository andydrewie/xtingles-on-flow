//emulator
import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken, Auction from 0xf8d6e0586b0a20c7

transaction(id: UInt64) {

    let client: &Auction.AuctionCollection
    
    prepare(account: AuthAccount) {
        self.client = account.borrow<&Auction.AuctionCollection>(from: /storage/auctionCollection) ?? panic("could not load admin")
    }

    execute {
        self.client.settleAuction(id)
    }
}