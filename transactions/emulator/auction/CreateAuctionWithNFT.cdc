import FungibleToken from 0xee82856bf20e2aa6
import Auction, Collectible, Edition, NonFungibleToken from 0x01cf0e2f2f715450

transaction(      
        minimumBidIncrement: UFix64, 
        auctionLength: UFix64,
        extendedLength: UFix64, 
        remainLengthToExtend: UFix64,
        auctionStartTime: UFix64,
        startPrice: UFix64, 
        platformAddress: Address,
        link: String,          
        name: String, 
        author: String,      
        description: String,
        maxEdition: UInt64    
    ) {

    let auctionCollectionRef: &Auction.AuctionCollection
    let platformCap: Capability<&{FungibleToken.Receiver}>
    let minterRef: &Collectible.NFTMinter
    let editionCollectionRef: &Edition.EditionCollection
    let editionCap: Capability<&{Edition.EditionPublic}>
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
     
        let platform = getAccount(platformAddress)

        self.platformCap = platform.getCapability<&{FungibleToken.Receiver}>(/public/fusdReceiver)

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

        let editionCap = acct.getCapability<&{Edition.EditionPublic}>(/public/editionCollection)

        if !editionCap.check() {        
            let edition <- Edition.createEditionCollection()
            acct.save( <- edition, to: /storage/editionCollection)         
            acct.link<&{Edition.EditionPublic}>(/public/editionCollection, target: /storage/editionCollection)
            log("Edition Collection Created for account")
        }  

        self.editionCap = acct.getCapability<&{Edition.EditionPublic}>(/public/editionCollection)

        self.editionCollectionRef = acct.borrow<&Edition.EditionCollection>(from: /storage/editionCollection)
            ?? panic("could not borrow edition reference reference")     
    }

    execute {    
     
        let auctionId = self.auctionCollectionRef.createAuction(          
            minimumBidIncrement: minimumBidIncrement,
            auctionLength: auctionLength,       
            extendedLength: extendedLength, 
            remainLengthToExtend: remainLengthToExtend,
            auctionStartTime: auctionStartTime,
            startPrice: startPrice,
            platformVaultCap: self.platformCap,
            editionCap: self.editionCap   
        )

        let editionId = self.editionCollectionRef.createEdition(
            royalty: RoyaltyVariable,
            maxEdition: maxEdition
        )       

        let newNFT <- self.minterRef.mintNFT(metadata: self.metadata, editionNumber: editionId)
     
        self.auctionCollectionRef.addNFT(id: auctionId, NFT:<- newNFT)
    }
}