import FungibleToken from 0x9a0766d93b6608b7
import NonFungibleToken from 0x631e88ae7f1d7c20
import FUSD from 0xe223d8a629e49c68
import Pack, Edition, PackLimitedEdition from 0x2695ea898b04f0c0

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
