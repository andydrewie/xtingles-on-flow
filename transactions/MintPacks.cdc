import Pack from 0xf8d6e0586b0a20c7
import PackSale from 0xf8d6e0586b0a20c7

transaction(
        url: String,
        picturePreview: String,
        animation: String,
        name: String, 
        artist: String,
        artistAddress: Address, 
        description: String,        
        edition: UInt64,
        maxEdition: UInt64,
        packSaleId: UInt64) {

    let packSaleCollectionRef: &PackSale.PackSaleCollection
    let metadata: Pack.Metadata

    prepare(
        acct: AuthAccount     
    ) {

        let packSaleCap = acct.getCapability<&{PackSale.PackSalePublic}>(/public/packSaleCollection)

        if !packSaleCap.check() {          
            let sale <- PackSale.createPackSaleCollection()
            acct.save(<-sale, to: /storage/packSaleCollection)         
            acct.link<&{PackSale.PackSalePublic}>(/public/packSaleCollection, target: /storage/packSaleCollection)
            log("Pack Sale Collection Created for account")
        }  

        self.packSaleCollectionRef = acct.borrow<&PackSale.PackSaleCollection>(from: /storage/packSaleCollection)
            ?? panic("could not borrow minter reference")    

        self.metadata = Pack.Metadata(
            url: url,
            picturePreview: picturePreview,
            animation: animation,
            name: name, 
            artist: artist,
            artistAddress: 0xf8d6e0586b0a20c7, 
            description: description,        
            edition: edition,
            maxEdition: maxEdition    
        )
    }

    execute {
                       
        self.packSaleCollectionRef.mintPacks(metadata: self.metadata, maxEdition: maxEdition, id: packSaleId)

        log("NFT Minted and deposited to Account's Collection")
    }
}