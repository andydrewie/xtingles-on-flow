import Edition from 0x01cf0e2f2f715450

transaction(id: UInt64) {

    let editionCollectionRef: &Edition.EditionCollection
   
    prepare(acct: AuthAccount) {

         let editionCap = acct.getCapability<&{Edition.EditionPublic}>(Edition.CollectionPublicPath)

        if !editionCap.check() {        
            let edition <- Edition.createEditionCollection()
            acct.save(<- edition, to: Edition.CollectionStoragePath)         
            acct.link<&{Edition.EditionPublic}>(Edition.CollectionPublicPath, target: Edition.CollectionStoragePath)
            log("Edition Collection Created for account")
        }  

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
