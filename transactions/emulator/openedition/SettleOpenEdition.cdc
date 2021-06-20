import OpenEdition, Edition from 0x01cf0e2f2f715450
import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken from 0x01cf0e2f2f715450

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
