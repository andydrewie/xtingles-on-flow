import Auction from 0xf8d6e0586b0a20c7
import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken from 0xf8d6e0586b0a20c7

transaction(
        auction: Address,
        id: UInt64
    ) {

    let auctionCollectionRef: &AnyResource{Auction.AuctionPublic}

    prepare(acct: AuthAccount) {
        let auctionOwner = getAccount(auction)       

        self.auctionCollectionRef = auctionOwner.getCapability<&AnyResource{Auction.AuctionPublic}>(/public/auctionCollection)
            .borrow()
            ?? panic("Could not borrow nft sale reference")
    }

    execute {    
        self.auctionCollectionRef.cancelAuction(id)       
    }
}