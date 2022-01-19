import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken, FUSD from 0x01cf0e2f2f715450
import Pack, Edition, PackLimitedEdition from 0x01cf0e2f2f715450

transaction(
    price: UFix64,
    startTime: UFix64,
    saleLength: UFix64,
    platformAddress: Address,
    numberOfMaxPack: UInt64
) {

    let limitedEditionCollectionRef: &PackLimitedEdition.LimitedEditionCollection
    let platformCap: Capability<&FUSD.Vault{FungibleToken.Receiver}>
    let royaltyCollectionRef: &Edition.EditionCollection
 
    prepare(acct: AuthAccount) {

        self.royaltyCollectionRef = acct.borrow<&Edition.EditionCollection>(from: Edition.CollectionStoragePath)
            ?? panic("could not borrow minter reference")            

        self.limitedEditionCollectionRef = acct.borrow<&PackLimitedEdition.LimitedEditionCollection>(from: PackLimitedEdition.CollectionStoragePath)
            ?? panic("could not borrow limited edition collection reference")  
        
        // Fake platform address, which is non-existen
        let platform = getAccount(Address(0x01cf0e2f2f715452))

        self.platformCap = platform.getCapability<&FUSD.Vault{FungibleToken.Receiver}>(/public/fusdReceiver)
    }

    execute {    
        let editionNumber = self.royaltyCollectionRef.createEdition(
            royalty: RoyaltyVariable, 
            maxEdition: numberOfMaxPack
        )   

        self.limitedEditionCollectionRef.createLimitedEdition(
            price: price,
            startTime: startTime,
            saleLength: saleLength, 
            editionNumber: editionNumber,
            platformVaultCap: self.platformCap,
            numberOfMaxPack: numberOfMaxPack
        )
    }
}
