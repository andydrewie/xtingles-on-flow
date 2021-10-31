import Collectible, OpenEditionV3, Edition from 0xfc747df8f5e61fcb
import FungibleToken from 0x9a0766d93b6608b7
import NonFungibleToken from 0x631e88ae7f1d7c20

transaction(      
        id: UInt64
    ) {

    let openEditionCollectionRef: &OpenEditionV3.OpenEditionCollection
    let clientEdition: &Edition.EditionCollection

    prepare(acct: AuthAccount) {

        self.openEditionCollectionRef = acct.borrow<&OpenEditionV3.OpenEditionCollection>(from: OpenEditionV3.CollectionStoragePath)
            ?? panic("could not borrow open edition collection reference")  

        self.clientEdition = acct.borrow<&Edition.EditionCollection>(from: Edition.CollectionStoragePath) ?? panic("could not borrow edition reference")
    }

    execute {    
        self.openEditionCollectionRef.cancelOpenEdition(id: id, clientEdition: self.clientEdition)       
    }
}