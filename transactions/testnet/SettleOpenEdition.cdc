import OpenEdition, Edition from 0xfc747df8f5e61fcb
import FungibleToken from 0x9a0766d93b6608b7
import NonFungibleToken from 0x631e88ae7f1d7c20

transaction(id: UInt64) {

    let clientOpenEdition: &OpenEdition.OpenEditionCollection
    let clientEdition: &Edition.EditionCollection
    
    prepare(acct: AuthAccount) {
        let editionCap = acct.getCapability<&{Edition.EditionPublic}>(/public/editionCollection)

        if !editionCap.check() {        
            let edition <- Edition.createEditionCollection()
            acct.save(<- edition, to: /storage/editionCollection)         
            acct.link<&{Edition.EditionPublic}>(/public/editionCollection, target: /storage/editionCollection)
            log("Edition Collection Created for account")
        }  

        self.clientOpenEdition = acct.borrow<&OpenEdition.OpenEditionCollection>(from: /storage/openEditionCollection) ?? panic("could not borrow open edition reference")
        self.clientEdition = acct.borrow<&Edition.EditionCollection>(from: /storage/editionCollection) ?? panic("could not borrow edition reference")
    }

    execute {
        self.clientOpenEdition.settleOpenEdition(id: id, clientEdition: self.clientEdition)
    }
}
