import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken, FUSD from 0x01cf0e2f2f715450
import Collectible, Edition, OpenEditionV3 from  0x01cf0e2f2f715450

transaction(
    link: String,
    name: String,           
    author: String, 
    description: String, 
    price: UFix64,
    startTime: UFix64,
    saleLength: UFix64,
    platformAddress: Address,
    numberOfMaxNFT: UInt64
) {

    let openEditionCollectionRef: &OpenEditionV3.OpenEditionCollection
    let platformCap: Capability<&FUSD.Vault{FungibleToken.Receiver}>
    let metadata: Collectible.Metadata
    let royaltyCollectionRef: &Edition.EditionCollection
 
    prepare(acct: AuthAccount) {

        self.royaltyCollectionRef = acct.borrow<&Edition.EditionCollection>(from: Edition.CollectionStoragePath)
            ?? panic("could not borrow minter reference")            

        self.openEditionCollectionRef = acct.borrow<&OpenEditionV3.OpenEditionCollection>(from: OpenEditionV3.CollectionStoragePath)
            ?? panic("could not borrow open edition collection reference")  
        
        // Fake platform address, which is non-existen
        let platform = getAccount(Address(0x01cf0e2f2f715452))

        self.platformCap = platform.getCapability<&FUSD.Vault{FungibleToken.Receiver}>(/public/fusdReceiver)

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
            platformVaultCap: self.platformCap,
            numberOfMaxNFT:  numberOfMaxNFT
        )
    }
}
