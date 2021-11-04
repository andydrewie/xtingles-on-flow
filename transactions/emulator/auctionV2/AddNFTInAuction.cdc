import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken from 0x01cf0e2f2f715450
import AuctionV2, Collectible, Edition from  0x01cf0e2f2f715450

transaction(      
        auctionId: UInt64,  
        link: String,          
        name: String, 
        author: String,      
        description: String    
    ) {

    let auctionCollectionRef: &AuctionV2.AuctionCollection
    let minterRef: &Collectible.NFTMinter
    let metadata: Collectible.Metadata
  
    prepare(acct: AuthAccount) {

        self.auctionCollectionRef = acct.borrow<&AuctionV2.AuctionCollection>(from:AuctionV2.CollectionStoragePath)
            ?? panic("could not borrow auction reference") 
 
        self.minterRef = acct.borrow<&Collectible.NFTMinter>(from: Collectible.MinterStoragePath)
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