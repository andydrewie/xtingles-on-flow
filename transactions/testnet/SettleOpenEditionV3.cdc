import OpenEditionV3, Edition from 0x2695ea898b04f0c0
import FungibleToken from 0x9a0766d93b6608b7
import NonFungibleToken from 0x631e88ae7f1d7c20

transaction(id: UInt64) {

    let clientOpenEdition: &OpenEditionV3.OpenEditionCollection
    let clientEdition: &Edition.EditionCollection
    
    prepare(acct: AuthAccount) {

        self.clientOpenEdition = acct.borrow<&OpenEditionV3.OpenEditionCollection>(from: OpenEditionV3.CollectionStoragePath) ?? panic("could not borrow open edition reference")
        self.clientEdition = acct.borrow<&Edition.EditionCollection>(from: Edition.CollectionStoragePath) ?? panic("could not borrow edition reference")
    }

    execute {
        self.clientOpenEdition.settleOpenEdition(id: id, clientEdition: self.clientEdition)
    }
}
