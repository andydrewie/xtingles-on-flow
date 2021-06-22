import FungibleToken from 0x9a0766d93b6608b7
import NonFungibleToken from 0x631e88ae7f1d7c20
import Collectible, Edition, OpenEdition from 0xfc747df8f5e61fcb

transaction(
    link: String,
    name: String,           
    author: String, 
    description: String, 
    price: UFix64,
    startTime: UFix64,
    saleLength: UFix64,
    platformAddress: Address 
) {

    let openEditionCollectionRef: &OpenEdition.OpenEditionCollection
    let platformCap: Capability<&{FungibleToken.Receiver}>
    let metadata: Collectible.Metadata
    let royaltyCollectionRef: &Edition.EditionCollection
 
    prepare(acct: AuthAccount) {

        let  editionCap = acct.getCapability<&{Edition.EditionPublic}>(/public/editionCollection)

        if !editionCap.check() {        
            let edition <- Edition.createEditionCollection()
            acct.save(<- edition, to: /storage/editionCollection)         
            acct.link<&{Edition.EditionPublic}>(/public/editionCollection, target: /storage/editionCollection)
            log("Edition Collection Created for account")
        }  

        self.royaltyCollectionRef = acct.borrow<&Edition.EditionCollection>(from: /storage/editionCollection)
            ?? panic("could not borrow minter reference")            

        let openEditionCap = acct.getCapability<&{OpenEdition.OpenEditionPublic}>(/public/openEditionCollection)

        if !openEditionCap.check() {
            let minterCap = acct.getCapability<&Collectible.NFTMinter>(/private/CollectibleMinter)!    
            let openEdition <- OpenEdition.createOpenEditionCollection(minterCap: minterCap)        
            acct.save( <-openEdition, to: /storage/openEditionCollection)         
            acct.link<&{OpenEdition.OpenEditionPublic}>(/public/openEditionCollection, target: /storage/openEditionCollection)
            log("Open Edition Collection created for account")
        } 

        self.openEditionCollectionRef = acct.borrow<&OpenEdition.OpenEditionCollection>(from: /storage/openEditionCollection)
            ?? panic("could not borrow open edition collection reference")  

        let platform = getAccount(platformAddress)

        self.platformCap = platform.getCapability<&{FungibleToken.Receiver}>(/public/fusdReceiver)

        self.metadata = Collectible.Metadata(
            link: link,
            name: name,           
            author: author, 
            description: description,     
            edition: 0,
            properties: {}
        )
    }

    execute {    
        let editionNumber = self.royaltyCollectionRef.createEdition(
            royalty: {
                Address(0xf9e164b413a74d51) : Edition.CommissionStructure(
                    firstSalePercent: 80.00,
                    secondSalePercent: 2.00,
                    description: "Author"
                ),
                Address(0xefb501878aa34730) : Edition.CommissionStructure(
                    firstSalePercent: 20.00,
                    secondSalePercent: 7.00,
                    description: "Third party"
                )
            }, 
            maxEdition: 0
        )   

        self.openEditionCollectionRef.createOpenEdition(
            price: price,
            startTime: startTime,
            saleLength: saleLength, 
            editionNumber: editionNumber,
            metadata: self.metadata,  
            platformVaultCap: self.platformCap
        )
    }
}
