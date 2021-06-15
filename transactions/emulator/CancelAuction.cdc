import Auction from 0x01cf0e2f2f715450
import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken from 0x01cf0e2f2f715450

transaction(      
        id: UInt64
    ) {

    let auctionCollectionRef: &AnyResource{Auction.AuctionPublic}

    prepare(acct: AuthAccount) {
        self.auctionCollectionRef = acct.getCapability<&AnyResource{Auction.AuctionPublic}>(/public/auctionCollection)
            .borrow()
            ?? panic("Could not borrow nft sale reference")
    }

    execute {    
        self.auctionCollectionRef.cancelAuction(id)       
    }
}