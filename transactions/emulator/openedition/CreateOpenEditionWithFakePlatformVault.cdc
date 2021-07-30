import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken from 0x01cf0e2f2f715450
import Collectible, Edition, OpenEdition from  0x01cf0e2f2f715450

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

        self.royaltyCollectionRef = acct.borrow<&Edition.EditionCollection>(from: Edition.CollectionStoragePath)
            ?? panic("could not borrow minter reference")            

        let openEditionCap = acct.getCapability<&{OpenEdition.OpenEditionCollectionPublic}>(OpenEdition.CollectionPublicPath)

        if !openEditionCap.check() {
            let minterCap = acct.getCapability<&Collectible.NFTMinter>(Collectible.MinterPrivatePath)!    
            let openEdition <- OpenEdition.createOpenEditionCollection(minterCap: minterCap)        
            acct.save( <-openEdition, to: OpenEdition.CollectionStoragePath)         
            acct.link<&{OpenEdition.OpenEditionCollectionPublic}>(OpenEdition.CollectionPublicPath, target: OpenEdition.CollectionStoragePath)
            log("Open Edition Collection created for account")
        } 

        self.openEditionCollectionRef = acct.borrow<&OpenEdition.OpenEditionCollection>(from: OpenEdition.CollectionStoragePath)
            ?? panic("could not borrow open edition collection reference")  
        
        // Fake platform address, which is non-existen
        let platform = getAccount(Address(0x01cf0e2f2f715452))

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
            royalty: RoyaltyVariable, 
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
