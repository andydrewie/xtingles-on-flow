import Edition from 0x01cf0e2f2f715450

transaction() {
   
    prepare(acct: AuthAccount) {

        let editionCap = acct.getCapability<&{Edition.EditionCollectionPublic}>(Edition.CollectionPublicPath)

        if !editionCap.check() {        
            let edition <- Edition.createEditionCollection()
            acct.save(<- edition, to: Edition.CollectionStoragePath)         
            acct.link<&{Edition.EditionCollectionPublic}>(Edition.CollectionPublicPath, target: Edition.CollectionStoragePath)
            log("Edition Collection Created for account")
        }   
    }

    execute {}
}
