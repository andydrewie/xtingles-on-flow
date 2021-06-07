import Pack from 0xf8d6e0586b0a20c7
import FungibleToken from 0xee82856bf20e2aa6
import PackSale from 0xf8d6e0586b0a20c7
import NonFungibleToken from 0xf8d6e0586b0a20c7

transaction(      
        price: UFix64,
        startTime: UFix64,
        saleLength: UFix64
    ) {

    let packSaleCollectionRef: &PackSale.PackSaleCollection
    let platformCap: Capability<&{FungibleToken.Receiver}>
 
    prepare(acct: AuthAccount) {

        let packSaleCap = acct.getCapability<&{PackSale.PackSalePublic}>(/public/packSaleCollection)

        if !packSaleCap.check() {          
            let sale <- PackSale.createPackSaleCollection()
            acct.save(<-sale, to: /storage/packSaleCollection)         
            acct.link<&{PackSale.PackSalePublic}>(/public/packSaleCollection, target: /storage/packSaleCollection)
            log("Pack Sale Collection Created for account")
        }  

        self.packSaleCollectionRef = acct.borrow<&PackSale.PackSaleCollection>(from: /storage/packSaleCollection)
            ?? panic("could not borrow minter reference")    

        self.platformCap = acct.getCapability<&{FungibleToken.Receiver}>(/public/fusdReceiver)
    }

    execute {   

        self.packSaleCollectionRef.createPackSale(          
            price: price,           
            startTime: startTime,
            saleLength: saleLength,
            royalty: {
                Address(0xf8d6e0586b0a20c7) : 10.00,
                Address(0x179b6b1cb6755e31) : 15.00
            },
            platformVaultCap: self.platformCap       
        )
    }
}