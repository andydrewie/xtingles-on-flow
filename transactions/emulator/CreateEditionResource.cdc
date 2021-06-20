import Edition from 0x01cf0e2f2f715450

transaction() {
   
    prepare(acct: AuthAccount) {

        let editionCap = acct.getCapability<&{Edition.EditionPublic}>(/public/editionCollection)

        if !editionCap.check() {        
            let edition <- Edition.createEditionCollection()
            acct.save(<- edition, to: /storage/editionCollection)         
            acct.link<&{Edition.EditionPublic}>(/public/editionCollection, target: /storage/editionCollection)
            log("Edition Collection Created for account")
        }   
    }

    execute {}
}
