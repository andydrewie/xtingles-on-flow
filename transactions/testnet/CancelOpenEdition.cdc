import Collectible, OpenEdition, Edition from 0xfc747df8f5e61fcb
import FungibleToken from 0x9a0766d93b6608b7
import NonFungibleToken from 0x631e88ae7f1d7c20

transaction(      
        id: UInt64
    ) {

    let openEditionCollectionRef: &OpenEdition.OpenEditionCollection
    let clientEdition: &Edition.EditionCollection

    prepare(acct: AuthAccount) {

        let editionCap = acct.getCapability<&{Edition.EditionCollectionPublic}>(Edition.CollectionPublicPath)

        if !editionCap.check() {        
            let edition <- Edition.createEditionCollection()
            acct.save(<- edition, to: Edition.CollectionStoragePath)         
            acct.link<&{Edition.EditionCollectionPublic}>(Edition.CollectionPublicPath, target: Edition.CollectionStoragePath)
            log("Edition Collection Created for account")
        }  

        let openEditionCap = acct.getCapability<&{OpenEdition.OpenEditionCollectionPublic}>(OpenEdition.CollectionPublicPath)

        if !openEditionCap.check() {
            let minterCap = acct.getCapability<&Collectible.NFTMinter>(Collectible.MinterPrivatePath)!    
            let openEdition <- OpenEdition.createOpenEditionCollection(minterCap: minterCap)        
            acct.save( <-openEdition, to: OpenEdition.CollectionStoragePath)         
            acct.link<&{OpenEdition.OpenEditionCollectionPublic}>(OpenEdition.CollectionPublicPath, target: OpenEdition.CollectionStoragePath)
            log("Open Edition Collection created for account")
        } 

        self.openEditionCollectionRef = acct.borrow<&OpenEdition.OpenEditionCollection>(from: OpenEdition.CollectionStoragePath)
            ?? panic("could not borrow open edition collection reference")  

        self.clientEdition = acct.borrow<&Edition.EditionCollection>(from: Edition.CollectionStoragePath) ?? panic("could not borrow edition reference")
    }

    execute {    
        self.openEditionCollectionRef.cancelOpenEdition(id: id, clientEdition: self.clientEdition)       
    }
}