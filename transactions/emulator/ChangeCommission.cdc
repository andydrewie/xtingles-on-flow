import Edition from 0x01cf0e2f2f715450

transaction(id: UInt64) {

    let editionCollectionRef: &Edition.EditionCollection
   
    prepare(acct: AuthAccount) {

        self.editionCollectionRef = acct.borrow<&Edition.EditionCollection>(from: Edition.CollectionStoragePath)
            ?? panic("could not edition reference")
   
    }

    execute {

        self.editionCollectionRef.changeCommission(
            id: id,
            royalty: RoyaltyVariable,    
        )
    }
}
