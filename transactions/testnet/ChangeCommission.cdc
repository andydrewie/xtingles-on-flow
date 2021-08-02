import Edition from 0xfc747df8f5e61fcb

transaction(id: UInt64) {

    let editionCollectionRef: &Edition.EditionCollection
   
    prepare(acct: AuthAccount) {

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
