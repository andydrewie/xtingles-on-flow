import FungibleToken from 0x9a0766d93b6608b7
import NonFungibleToken from 0x631e88ae7f1d7c20
import Auction from 0xfc747df8f5e61fcb

transaction(id: UInt64) {

    let client: &Auction.AuctionCollection
    
    prepare(account: AuthAccount) {
        self.client = account.borrow<&Auction.AuctionCollection>(from: /storage/auctionCollection) ?? panic("could not load admin auction reference")
    }

    execute {
        self.client.settleAuction(id)
    }
}