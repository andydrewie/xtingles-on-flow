import PackLimitedEdition from 0x2695ea898b04f0c0
import FungibleToken from 0x9a0766d93b6608b7
import NonFungibleToken from 0x631e88ae7f1d7c20

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