import ASMR from 0xf8d6e0586b0a20c7
import FungibleToken from 0xee82856bf20e2aa6
import Auction from 0xf8d6e0586b0a20c7

transaction(
        tokenId: UInt64,
        minimumBidIncrement: UFix64, 
        auctionLength: UFix64,
        auctionstartTime: UFix64,
        startPrice: UFix64
    ) {

    let auctionCollectionRef: &Auction.AuctionCollection
    let collectionRef: &{ASMR.CollectionPublic}
    let vaultCap: Capability<&{FungibleToken.Receiver}>

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

        self.vaultCap = acct.getCapability<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)

        self.collectionRef = acct.getCapability<&{ASMR.CollectionPublic}>(/public/ASMRCollection)
            .borrow()
            ?? panic("Could not borrow receiver reference") 

    }

    execute {    
        let token <- self.collectionRef.withdraw(withdrawID: tokenId) as! @ASMR.NFT
        self.auctionCollectionRef.createAuction(
            token: <- token,
            minimumBidIncrement: minimumBidIncrement,
            auctionLength: auctionLength,
            auctionstartTime: auctionstartTime,
            startPrice: startPrice,
            vaultCap: self.vaultCap)
    }
}