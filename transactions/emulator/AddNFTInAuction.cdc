import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken from 0x01cf0e2f2f715450
import Auction, Collectible, Edition from  0x01cf0e2f2f715450

transaction(      
        auctionId: UInt64,  
        link: String,          
        name: String, 
        author: String,      
        description: String    
    ) {

    let auctionCollectionRef: &Auction.AuctionCollection
    let minterRef: &Collectible.NFTMinter
    let metadata: Collectible.Metadata
  
    prepare(acct: AuthAccount) {

        let auctionCap = acct.getCapability<&{Auction.AuctionPublic}>(/public/auctionCollection)

        if !auctionCap.check() {          
            let sale <- Auction.createAuctionCollection()
            acct.save(<-sale, to: /storage/auctionCollection)         
            acct.link<&{Auction.AuctionPublic}>(/public/auctionCollection, target: /storage/auctionCollection)
            log("Auction Collection Created for account")
        }  

        self.auctionCollectionRef = acct.borrow<&Auction.AuctionCollection>(from: /storage/auctionCollection)
            ?? panic("could not borrow minter reference")    

 
        self.minterRef = acct.borrow<&Collectible.NFTMinter>(from: /storage/CollectibleMinter)
            ?? panic("could not borrow minter reference")

        self.metadata = Collectible.Metadata(
            link: link,          
            name: name, 
            author: author,      
            description: description,        
            edition: 1,
            properties: {}   
        ) 
    }

    execute { 
        let newNFT <- self.minterRef.mintNFT(metadata: self.metadata, editionNumber: 1)
     
        self.auctionCollectionRef.addNFT(id: auctionId, NFT:<- newNFT)
    }
}