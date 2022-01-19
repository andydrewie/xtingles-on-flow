import FungibleToken from 0xee82856bf20e2aa6
import AuctionV2, Collectible, Edition, NonFungibleToken, FUSD from 0x01cf0e2f2f715450

transaction(      
        minimumBidIncrement: UFix64, 
        auctionLength: UFix64,
        extendedLength: UFix64, 
        remainLengthToExtend: UFix64,
        auctionStartTime: UFix64,
        auctionStartBidTime: UFix64,
        startPrice: UFix64, 
        platformAddress: Address,
        link: String,          
        name: String, 
        author: String,      
        description: String,
        maxEdition: UInt64    
    ) {

    let auctionCollectionRef: &AuctionV2.AuctionCollection
    let platformCap: Capability<&FUSD.Vault{FungibleToken.Receiver}>
    let minterRef: &Collectible.NFTMinter
    let editionCollectionRef: &Edition.EditionCollection
    let editionCap: Capability<&{Edition.EditionCollectionPublic}>
    let metadata: Collectible.Metadata
  
    prepare(acct: AuthAccount) {

        self.auctionCollectionRef = acct.borrow<&AuctionV2.AuctionCollection>(from:AuctionV2.CollectionStoragePath)
            ?? panic("could not borrow minter reference")    
     
        let platform = getAccount(platformAddress)

        self.platformCap = platform.getCapability<&FUSD.Vault{FungibleToken.Receiver}>(/public/fusdReceiver)

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

        self.editionCap = acct.getCapability<&{Edition.EditionCollectionPublic}>(Edition.CollectionPublicPath)

        self.editionCollectionRef = acct.borrow<&Edition.EditionCollection>(from: Edition.CollectionStoragePath)
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
            startBidTime: auctionStartBidTime,
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