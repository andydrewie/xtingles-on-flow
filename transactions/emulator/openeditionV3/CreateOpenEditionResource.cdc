import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken from 0x01cf0e2f2f715450
import Collectible, OpenEditionV3 from 0x01cf0e2f2f715450

transaction() {

    prepare(acct: AuthAccount) {

        let openEditionCap = acct.getCapability<&{OpenEditionV3.OpenEditionCollectionPublic}>(OpenEditionV3.CollectionPublicPath)

        if !openEditionCap.check() {
            let minterCap = acct.getCapability<&Collectible.NFTMinter>(Collectible.MinterPrivatePath)!    
            let openEdition <- OpenEditionV3.createOpenEditionCollection(minterCap: minterCap)        
            acct.save( <-openEdition, to: OpenEditionV3.CollectionStoragePath)         
            acct.link<&{OpenEditionV3.OpenEditionCollectionPublic}>(OpenEditionV3.CollectionPublicPath, target: OpenEditionV3.CollectionStoragePath)
            log("Open Edition Collection created for account")
        } 
    }

    execute {}
}
