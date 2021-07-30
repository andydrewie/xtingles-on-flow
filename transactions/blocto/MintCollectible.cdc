import Collectible, Edition from 0x01cf0e2f2f715450

transaction(
        link: String,          
        name: String, 
        author: String,      
        description: String,        
        maxEdition: UInt64  
    ) {
        
    let receiverRef: &{Collectible.CollectionPublic}
    let minterRef: &Collectible.NFTMinter
    
    let editionCollectionRef: &Edition.EditionCollection

    prepare(
        acct: AuthAccount     
    ) {
        self.receiverRef = acct.getCapability<&{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath)
            .borrow()
            ?? panic("Could not borrow receiver reference")        
        
        self.minterRef = acct.borrow<&Collectible.NFTMinter>(from: Collectible.MinterStoragePath)
            ?? panic("could not borrow minter reference")

        self.editionCollectionRef = acct.borrow<&Edition.EditionCollection>(from: Edition.CollectionStoragePath)
            ?? panic("could not borrow edition reference")  
    }

    execute {

        var edition = 1;

        while edition <= maxEdition {

            let editionNumber = self.editionCollectionRef.createEdition(
                royalty: RoyaltyVariable,
                maxEdition: maxEdition
            )       
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
        }

       
        log("NFT Minted and deposited to Account's Collection")
    }
}