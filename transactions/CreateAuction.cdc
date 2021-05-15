import ASMR from 0xf8d6e0586b0a20c7
import FungibleToken from 0xee82856bf20e2aa6
import Auction from 0xf8d6e0586b0a20c7
import NonFungibleToken from 0xf8d6e0586b0a20c7

transaction(
        tokenId: UInt64,
        minimumBidIncrement: UFix64, 
        auctionLength: UFix64,
        maxAuctionLength: UFix64,
        extendedLength: UFix64, 
        remainLengthToExtend: UFix64,
        auctionStartTime: UFix64,
        startPrice: UFix64,
        author: Address,
        platformCommission: UFix64,
        authorCommission: UFix64
    ) {

    let auctionCollectionRef: &Auction.AuctionCollection
    let collectionRef: &{ASMR.CollectionPublic}
    let platformCap: Capability<&{FungibleToken.Receiver}>
    let platformCollection: Capability<&{ASMR.CollectionPublic}>
 
    prepare(acct: AuthAccount) {

        let auctionCap = acct.getCapability<&{Auction.AuctionPublic}>(/public/auctionCollection)

        if !auctionCap.check() {
            let receiver = acct.getCapability<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            let sale <- Auction.createAuctionCollection(marketplaceVault: receiver)
            acct.save(<-sale, to: /storage/auctionCollection)         
            acct.link<&{Auction.AuctionPublic}>(/public/auctionCollection, target: /storage/auctionCollection)
            log("Auction Collection Created for account")
        }  

        self.auctionCollectionRef = acct.borrow<&Auction.AuctionCollection>(from: /storage/auctionCollection)
            ?? panic("could not borrow minter reference")    

        self.platformCap = acct.getCapability<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)

        self.collectionRef = acct.getCapability<&{ASMR.CollectionPublic}>(/public/ASMRCollection)
            .borrow()
            ?? panic("Could not borrow receiver reference") 

        self.platformCollection = acct.getCapability<&{ASMR.CollectionPublic}>(ASMR.CollectionPublicPath)
    }

    execute {    
        let token <- self.collectionRef.withdraw(withdrawID: tokenId) as! @ASMR.NFT

        let authorAcct = getAccount(author)  

        let authorVaultCap = authorAcct.getCapability<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)  

        self.auctionCollectionRef.createAuction(
            token: <- token,
            minimumBidIncrement: minimumBidIncrement,
            auctionLength: auctionLength,
            maxAuctionLength:  maxAuctionLength,
            extendedLength: extendedLength, 
            remainLengthToExtend: remainLengthToExtend,
            auctionStartTime: auctionStartTime,
            startPrice: startPrice,
            platformVaultCap: self.platformCap,
            platformCollectionCap: self.platformCollection,
            authorVaultCap: authorVaultCap,
            platformCommission: platformCommission,
            authorCommission: authorCommission
        )
    }
}