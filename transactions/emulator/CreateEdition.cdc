import Edition from 0x01cf0e2f2f715450

transaction(maxEdition: UInt64) {

    let editionCollectionRef: &Edition.EditionCollection
   
    prepare(acct: AuthAccount) {

        self.editionCollectionRef = acct.borrow<&Edition.EditionCollection>(from: Edition.CollectionStoragePath)
            ?? panic("could not borrow edition reference")            
   
    }

    execute {

        let id = self.editionCollectionRef.createEdition(
            royalty: RoyaltyVariable,
            maxEdition: maxEdition
        )       

        log(id)
    }
}
