import OpenEdition, Edition from 0x01cf0e2f2f715450
import FungibleToken  from 0xee82856bf20e2aa6
import NonFungibleToken from 0x01cf0e2f2f715450

transaction(id: UInt64) {

    let clientOpenEdition: &OpenEdition.OpenEditionCollection
    let clientEdition: &Edition.EditionCollection
    
    prepare(acct: AuthAccount) {
  
        self.clientOpenEdition = acct.borrow<&OpenEdition.OpenEditionCollection>(from: OpenEdition.CollectionStoragePath) ?? panic("could not borrow open edition reference")
        self.clientEdition = acct.borrow<&Edition.EditionCollection>(from: Edition.CollectionStoragePath) ?? panic("could not borrow edition reference")
    }

    execute {
        self.clientOpenEdition.settleOpenEdition(id: id, clientEdition: self.clientEdition)
    }
}
