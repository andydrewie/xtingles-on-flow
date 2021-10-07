import FungibleToken from 0xf233dcee88fe0abe
import FUSD from 0x3c5959b568896393
import Collectible from 0xf5b0eb433389ac3f
import NonFungibleToken from 0x1d7e57aa55817448
import Edition from 0xf5b0eb433389ac3f

transaction() {

    let editionCollectionRef: &Edition.EditionCollection
    let editionCap: Capability<&{Edition.EditionCollectionPublic}>

    prepare(acct: AuthAccount) {     
     
   
        self.editionCap = acct.getCapability<&{Edition.EditionCollectionPublic}>(Edition.CollectionPublicPath)

        self.editionCollectionRef = acct.borrow<&Edition.EditionCollection>(from: Edition.CollectionStoragePath)
            ?? panic("could not borrow edition reference reference")     
    }

    execute {         
         
        // Create item in collection Edition to store common infromation for the all copies of the one item 
        let editionId = self.editionCollectionRef.createEdition(
            // Commission charges in the case of the first (auction) and the secondary (marketplace) sale
            // In our sdk we'd prefer to replace this info as template in Javascript than pass as paramters in transaction
            royalty: {
                Address(0xef54fed7892f2163) : Edition.CommissionStructure(
                    firstSalePercent: 50.00,
                    secondSalePercent: 1.00,
                    description: "AUTHOR"
                ),
                Address(0x59fb75b55b8a06a9) : Edition.CommissionStructure(
                    firstSalePercent: 50.00,
                    secondSalePercent: 4.00,
                    description: "PLATFORM"
                )
            },
            // Amount copies of the item. This is 1 in case of auction
            maxEdition: 6000
        )       

        log(editionId);

    }
}
 