import Auction from 0x01cf0e2f2f715450
import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken from 0x01cf0e2f2f715450

transaction(id: UInt64) {

    let client: &Auction.AuctionCollection
    
    prepare(acct: AuthAccount) {
        let auctionCap = acct.getCapability<&{Auction.AuctionPublic}>(/public/auctionCollection)

        if !auctionCap.check() {          
            let sale <- Auction.createAuctionCollection()
            acct.save(<-sale, to: /storage/auctionCollection)         
            acct.link<&{Auction.AuctionPublic}>(/public/auctionCollection, target: /storage/auctionCollection)
            log("Auction Collection Created for account")
        }  

        self.client = acct.borrow<&Auction.AuctionCollection>(from: /storage/auctionCollection) ?? panic("could not load admin storage for auction")
    }

    execute {
        self.client.settleAuction(id)
    }
}