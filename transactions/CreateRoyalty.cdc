import ASMR from 0xf8d6e0586b0a20c7
import FungibleToken from 0xee82856bf20e2aa6
import Royalty from 0xf8d6e0586b0a20c7
import NonFungibleToken from 0xf8d6e0586b0a20c7

transaction(
        firstCommissionAuthor: UFix64,
        firstCommissionPlatform: UFix64,
        secondCommissionAuthor: UFix64,
        secondCommissionPlatform: UFix64
    ) {

    let royaltyCollectionRef: &Royalty.RoyaltyCollection
   
    prepare(acct: AuthAccount) {

        let royaltyCap = acct.getCapability<&{Royalty.RoyaltyPublic}>(/public/royaltyCollection)

        if !royaltyCap.check() {        
            let royalty <- Royalty.createRoyaltyCollection()
            acct.save(<- royalty, to: /storage/royaltyCollection)         
            acct.link<&{Royalty.RoyaltyPublic}>(/public/royaltyCollection, target: /storage/royaltyCollection)
            log("Royalty Collection Created for account")
        }  

        self.royaltyCollectionRef = acct.borrow<&Royalty.RoyaltyCollection>(from: /storage/royaltyCollection)
            ?? panic("could not borrow minter reference")    
   
    }

    execute {    
        let id = self.royaltyCollectionRef.createRoyalty(
            firstCommissionAuthor: firstCommissionAuthor,
            firstCommissionPlatform: firstCommissionPlatform,
            secondCommissionAuthor: secondCommissionAuthor,
            secondCommissionPlatform: secondCommissionPlatform
        )

        log(id)
    }
}