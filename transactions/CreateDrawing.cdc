import ASMR from 0xf8d6e0586b0a20c7
import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken from 0xf8d6e0586b0a20c7
import Drawing from 0xf8d6e0586b0a20c7
import Royalty from 0xf8d6e0586b0a20c7

transaction(
    url: String,
    picturePreview: String,
    animation: String,
    name: String, 
    artist: String,
    artistAddress: Address, 
    description: String,        
    edition: UInt64,  
    price: UFix64,
    startTime: UFix64,
    saleLength: UFix64
) {

    let drawingCollectionRef: &Drawing.DrawingCollection
    let platformCap: Capability<&{FungibleToken.Receiver}>
    let metadata: ASMR.Metadata
    let royaltyCollectionRef: &Royalty.RoyaltyCollection
 
    prepare(acct: AuthAccount) {

        let royaltyCap = acct.getCapability<&{Royalty.RoyaltyPublic}>(/public/royaltyCollection)

        if !royaltyCap.check() {        
            let royalty <- Royalty.createRoyaltyCollection()
            acct.save(<- royalty, to: /storage/royaltyCollection)         
            acct.link<&{Royalty.RoyaltyPublic}>(/public/royaltyCollection, target: /storage/royaltyCollection)
            log("Royalty Collection Created for account")
        }  

        self.royaltyCollectionRef = acct.borrow<&Royalty.RoyaltyCollection>(from: /storage/royaltyCollection)
            ?? panic("could not borrow minter reference")            

        let drawingCap = acct.getCapability<&{Drawing.DrawingPublic}>(/public/drawingCollection)

        if !drawingCap.check() {
            let Drawing <- Drawing.createDrawingCollection()        
            acct.save( <-Drawing, to: /storage/drawingCollection)         
            acct.link<&{Drawing.DrawingPublic}>(/public/drawingCollection, target: /storage/drawingCollection)
            log("Drawing Collection created for account")
        } 

        self.drawingCollectionRef = acct.borrow<&Drawing.DrawingCollection>(from: /storage/drawingCollection)
            ?? panic("could not borrow open edition collection reference")  

        self.platformCap = acct.getCapability<&{FungibleToken.Receiver}>(/public/fusdReceiver)

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
    }

    execute {    
        let editionNumber = self.royaltyCollectionRef.createRoyalty(
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
            maxEdition: 0
        )   

        self.drawingCollectionRef.createDrawing(
            price: price,
            startTime: startTime,
            drawingLength: saleLength,          
            platformVaultCap: self.platformCap,
            metadata: self.metadata,
            editionNumber: editionNumber            
          
        )
    }
}