import Collectible, Edition from 0x01547a7e742007d9

transaction(
        link: String,          
        name: String, 
        author: String,      
        description: String,        
        maxEdition: UInt64  
    ) {
        
    let receiverRef: &Collectible.Collection{Collectible.CollectionPublic}
    let minterRef: &Collectible.NFTMinter
    
    let editionCollectionRef: &Edition.EditionCollection

    prepare(
        acct: AuthAccount     
    ) {
        self.receiverRef = acct.getCapability<&Collectible.Collection{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath)
            .borrow()
            ?? panic("Could not borrow receiver reference")        
        
        self.minterRef = acct.borrow<&Collectible.NFTMinter>(from: Collectible.MinterStoragePath)
            ?? panic("could not borrow minter reference")

        self.editionCollectionRef = acct.borrow<&Edition.EditionCollection>(from: Edition.CollectionStoragePath)
            ?? panic("could not borrow edition reference")  
    }

    execute {

        var edition = 1 as UInt64;

        let editionNumber = self.editionCollectionRef.createEdition(
            royalty: {
                Address(0xefb501878aa34730) : Edition.CommissionStructure(
                    firstSalePercent: 100.00,
                    secondSalePercent: 2.00,
                    description: "PLATFORM"
                )
            },
            maxEdition: maxEdition
        )  

        while edition <= maxEdition {
             
            let metadata = Collectible.Metadata(
                link: link,
                name: name,           
                author: author, 
                description: description,     
                edition: edition,
                properties: {}
            )
                    
            let newNFT <- self.minterRef.mintNFT(metadata: metadata, editionNumber: editionNumber)
        
            self.receiverRef.deposit(token: <-newNFT)
            edition = edition + 1;
        }
       
        log("NFTs Minted and deposited to Account's Collection")
    }
}