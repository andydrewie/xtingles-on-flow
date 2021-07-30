import Edition from 0xfc747df8f5e61fcb

transaction(id: UInt64) {

    let editionCollectionRef: &Edition.EditionCollection
   
    prepare(acct: AuthAccount) {

         let editionCap = acct.getCapability<&{Edition.EditionCollectionPublic}>(Edition.CollectionPublicPath)

        if !editionCap.check() {        
            let edition <- Edition.createEditionCollection()
            acct.save(<- edition, to: Edition.CollectionStoragePath)         
            acct.link<&{Edition.EditionCollectionPublic}>(Edition.CollectionPublicPath, target: Edition.CollectionStoragePath)
            log("Edition Collection Created for account")
        }  

        self.editionCollectionRef = acct.borrow<&Edition.EditionCollection>(from: Edition.CollectionStoragePath)
            ?? panic("could not edition reference")                     
   
    }

    execute {

        self.editionCollectionRef.changeCommission(
            id: id,
            royalty:  {
                Address(0xf9e164b413a74d51) : Edition.CommissionStructure(
                    firstSalePercent: 60.00,
                    secondSalePercent: 3.00,
                    description: "Author"
                ),
                Address(0xefb501878aa34730) : Edition.CommissionStructure(
                    firstSalePercent: 40.00,
                    secondSalePercent: 2.00,
                    description: "Third party"
                )
            },    
        )
    }
}
