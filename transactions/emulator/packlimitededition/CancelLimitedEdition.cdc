import PackLimitedEdition, Edition from 0x01cf0e2f2f715450
import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken from 0x01cf0e2f2f715450

transaction(      
        id: UInt64
    ) {

    let limitedEditionCollectionRef: &PackLimitedEdition.LimitedEditionCollection

    prepare(acct: AuthAccount) {   
        self.limitedEditionCollectionRef = acct.borrow<&PackLimitedEdition.LimitedEditionCollection>(from: PackLimitedEdition.CollectionStoragePath)
            ?? panic("could not borrow limited edition collection reference")  
    }

    execute {    
        self.limitedEditionCollectionRef.cancelLimitedEdition(id: id)       
    }
}