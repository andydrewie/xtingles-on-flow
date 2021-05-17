//emulator
import Royalty from 0xf8d6e0586b0a20c7
import FungibleToken from 0xee82856bf20e2aa6

transaction(id: UInt64) {
    let client: &Royalty.RoyaltyCollection
    
    prepare(account: AuthAccount) {
        self.client = account.borrow<&Royalty.RoyaltyCollection>(from: /storage/royaltyCollection) ?? panic("could not load admin")
    }  

    execute {      
        self.client.changeCommission(
            id: id,
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
    }
}