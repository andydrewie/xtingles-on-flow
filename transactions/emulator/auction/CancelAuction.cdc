import Auction from 0x01cf0e2f2f715450
import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken from 0x01cf0e2f2f715450

transaction(      
        id: UInt64
    ) {

    let client: &Auction.AuctionCollection

    prepare(acct: AuthAccount) {

        self.client = acct.borrow<&Auction.AuctionCollection>(from:Auction.CollectionStoragePath) ?? panic("could not load admin storage for auction")
    }

    execute {    
        self.client.cancelAuction(id)       
    }
}