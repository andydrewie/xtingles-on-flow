import FungibleToken from 0xee82856bf20e2aa6
import Auction, Collectible, Edition, NonFungibleToken from 0x01cf0e2f2f715450

transaction(      
        minimumBidIncrement: UFix64, 
        auctionLength: UFix64,    
        extendedLength: UFix64, 
        remainLengthToExtend: UFix64,
        auctionStartTime: UFix64,
        startPrice: UFix64, 
        platformAddress: Address   
    ) {

    let auctionCollectionRef: &Auction.AuctionCollection
    let platformCap: Capability<&{FungibleToken.Receiver}>
    let editionCollectionRef: &Edition.EditionCollection
    let editionCap: Capability<&{Edition.EditionPublic}>

    prepare(acct: AuthAccount) {

        let auctionCap = acct.getCapability<&{Auction.AuctionPublic}>(Auction.CollectionPublicPath)

        if !auctionCap.check() {          
            let sale <- Auction.createAuctionCollection()
            acct.save(<-sale, to:Auction.CollectionStoragePath)         
            acct.link<&{Auction.AuctionPublic}>(Auction.CollectionPublicPath, target:Auction.CollectionStoragePath)
            log("Auction Collection Created for account")
        }  

        self.auctionCollectionRef = acct.borrow<&Auction.AuctionCollection>(from:Auction.CollectionStoragePath)
            ?? panic("could not borrow minter reference")    

        let platform = getAccount(platformAddress)

        self.platformCap = platform.getCapability<&{FungibleToken.Receiver}>(/public/fusdReceiver)
   
        let editionCap = acct.getCapability<&{Edition.EditionPublic}>(Edition.CollectionPublicPath)

        if !editionCap.check() {        
            let edition <- Edition.createEditionCollection()
            acct.save( <- edition, to: Edition.CollectionStoragePath)         
            acct.link<&{Edition.EditionPublic}>(Edition.CollectionPublicPath, target: Edition.CollectionStoragePath)
            log("Edition Collection Created for account")
        }  

        self.editionCap = acct.getCapability<&{Edition.EditionPublic}>(Edition.CollectionPublicPath)

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
            platformVaultCap: self.platformCap,  
            editionCap: self.editionCap   
        )   
    }
}