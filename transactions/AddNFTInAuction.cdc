import FungibleToken from 0xee82856bf20e2aa6
import Auction, Edition, ASMR from 0xf8d6e0586b0a20c7
import NonFungibleToken from 0xf8d6e0586b0a20c7

transaction(   
        auctionId: UInt64,
        link: String,          
        name: String, 
        author: String,      
        description: String,        
        edition: UInt64   
    ) {

    let auctionCollectionRef: &Auction.AuctionCollection
    let minterRef: &ASMR.NFTMinter
    let editionCollectionRef: &Edition.EditionCollection
    let metadata: ASMR.Metadata
 
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

        self.minterRef = acct.borrow<&ASMR.NFTMinter>(from: /storage/ASMRMinter)
            ?? panic("could not borrow minter reference")

        self.metadata = ASMR.Metadata(
            link: link,          
            name: name, 
            author: author,      
            description: description,        
            edition: edition,
            properties: {}   
        ) 

        let editionCap = acct.getCapability<&{Edition.EditionPublic}>(/public/editionCollection)

        if !editionCap.check() {        
            let edition <- Edition.createEditionCollection()
            acct.save( <- edition, to: /storage/editionCollection)         
            acct.link<&{Edition.EditionPublic}>(/public/editionCollection, target: /storage/editionCollection)
            log("Royalty Collection Created for account")
        }  

        self.editionCollectionRef = acct.borrow<&Edition.EditionCollection>(from: /storage/editionCollection)
            ?? panic("could not borrow edition reference reference")            
      
    }

    execute {    

        let id = self.editionCollectionRef.createEdition(
            royalty: {
                Address(0xf8d6e0586b0a20c7) : Edition.CommissionStructure(
                    firstSalePercent: 1.00,
                    secondSalePercent: 2.00,
                    description: "xxx"
                ),
                Address(0x179b6b1cb6755e31) : Edition.CommissionStructure(
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