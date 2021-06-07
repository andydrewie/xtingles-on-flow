import ASMR from 0xf8d6e0586b0a20c7
import FungibleToken from 0xee82856bf20e2aa6
import Auction, Royalty from 0xf8d6e0586b0a20c7
import NonFungibleToken from 0xf8d6e0586b0a20c7

transaction(      
        auctionId: UInt64,
        url: String,
        picturePreview: String,
        animation: String,
        name: String, 
        artist: String,
        artistAddress: Address, 
        description: String,        
        edition: UInt64
    ) {

    let auctionCollectionRef: &Auction.AuctionCollection
    let minterRef: &ASMR.NFTMinter
    let royaltyCollectionRef: &Royalty.RoyaltyCollection
    let metadata: ASMR.Metadata
 
    prepare(acct: AuthAccount) {

        let auctionCap = acct.getCapability<&{Auction.AuctionPublic}>(/public/auctionCollection)

        if !auctionCap.check() {
            let receiver = acct.getCapability<&{FungibleToken.Receiver}>(/public/fusdReceiver)
            let sale <- Auction.createAuctionCollection(marketplaceVault: receiver)
            acct.save(<-sale, to: /storage/auctionCollection)         
            acct.link<&{Auction.AuctionPublic}>(/public/auctionCollection, target: /storage/auctionCollection)
            log("Auction Collection Created for account")
        }  

        self.auctionCollectionRef = acct.borrow<&Auction.AuctionCollection>(from: /storage/auctionCollection)
            ?? panic("could not borrow minter reference")   

        self.minterRef = acct.borrow<&ASMR.NFTMinter>(from: /storage/ASMRMinter)
            ?? panic("could not borrow minter reference")

        self.metadata = ASMR.Metadata(
            url: url,
            picturePreview: picturePreview,
            animation: animation,
            name: name, 
            artist: artist,
            artistAddress: 0xf8d6e0586b0a20c7, 
            description: description,        
            edition: edition      
        ) 

        let royaltyCap = acct.getCapability<&{Royalty.RoyaltyPublic}>(/public/royaltyCollection)

        if !royaltyCap.check() {        
            let royalty <- Royalty.createRoyaltyCollection()
            acct.save(<- royalty, to: /storage/royaltyCollection)         
            acct.link<&{Royalty.RoyaltyPublic}>(/public/royaltyCollection, target: /storage/royaltyCollection)
            log("Royalty Collection Created for account")
        }  

        self.royaltyCollectionRef = acct.borrow<&Royalty.RoyaltyCollection>(from: /storage/royaltyCollection)
            ?? panic("could not borrow minter reference")            
      
    }

    execute {    

        let id = self.royaltyCollectionRef.createRoyalty(
            royalty: {
                Address(0xf8d6e0586b0a20c7) : Royalty.CommissionStructure(
                    firstSalePercent: 1.00,
                    secondSalePercent: 2.00,
                    description: "xxx"
                ),
                Address(0x179b6b1cb6755e31) : Royalty.CommissionStructure(
                    firstSalePercent: 5.00,
                    secondSalePercent: 7.00,
                    description: "xxx"
                )
            },
            maxEdition: 1
        )       

        let newNFT <- self.minterRef.mintNFT(metadata: self.metadata, editionNumber: id)
     
        self.auctionCollectionRef.addNFT(id: auctionId,NFT:<- newNFT)
    }
}