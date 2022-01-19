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

    let openEditionCollectionRef: &PackLimitedEdition.LimitedEditionCollection
    let platformCap: Capability<&FUSD.Vault{FungibleToken.Receiver}>
    let royaltyCollectionRef: &Edition.EditionCollection
 
    prepare(acct: AuthAccount) {

        self.royaltyCollectionRef = acct.borrow<&Edition.EditionCollection>(from: Edition.CollectionStoragePath)
            ?? panic("could not borrow edition reference")            

        self.openEditionCollectionRef = acct.borrow<&PackLimitedEdition.LimitedEditionCollection>(from: PackLimitedEdition.CollectionStoragePath)
            ?? panic("could not borrow limited edition collection reference")  

        let platform = getAccount(platformAddress)

        self.platformCap = platform.getCapability<&FUSD.Vault{FungibleToken.Receiver}>(/public/fusdReceiver)
    }

    execute {    
        let editionNumber = self.royaltyCollectionRef.createEdition(
            royalty: {
                Address(0x01cf0e2f2f715450) : Edition.CommissionStructure(
                    firstSalePercent: 80.00,
                    secondSalePercent: 2.00,
                    description: "Author"
                ),
                Address(0x179b6b1cb6755e31) : Edition.CommissionStructure(
                    firstSalePercent: 20.00,
                    secondSalePercent: 7.00,
                    description: "Third party"
                )
            },
            maxEdition: numberOfMaxPack
        )   

        self.openEditionCollectionRef.createLimitedEdition(
            price: price,
            startTime: startTime,
            saleLength: saleLength, 
            editionNumber: editionNumber,
            platformVaultCap: self.platformCap,
            numberOfMaxPack: numberOfMaxPack
        )
    }
}