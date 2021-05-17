import ASMR from 0xf8d6e0586b0a20c7
import FungibleToken from 0xee82856bf20e2aa6
import Royalty from 0xf8d6e0586b0a20c7
import NonFungibleToken from 0xf8d6e0586b0a20c7

transaction() {

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
            royalty: {
                Address(0xf8d6e0586b0a20c7) : Royalty.CommissionStructure(
                    firstSalePercent: 1.00,
                    secondSalePercent: 2.00,
                    description: "xxx"
                ),
                Address(0x179b6b1cb6755e31) : Royalty.CommissionStructure(
                    firstSalePercent: 5.00,
                    secondSalePercent: 7.00,
                    description: "xxx"
                )
            }
        )       

        log(id)
    }
}