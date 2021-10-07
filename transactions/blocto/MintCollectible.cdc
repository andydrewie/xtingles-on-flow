import Collectible, Edition from 0xf5b0eb433389ac3f

transaction(
        receiver: Address,
        start: UInt64
    ) {
        
    let receiverRef: &{Collectible.CollectionPublic}
    let minterRef: &Collectible.NFTMinter
    let editionCollectionRef: &Edition.EditionCollection
    

    prepare(
        acct: AuthAccount     
    ) {
        let account = getAccount(receiver)

        self.receiverRef = account.getCapability<&{Collectible.CollectionPublic}>(Collectible.CollectionPublicPath)
            .borrow()
            ?? panic("Could not borrow receiver reference")        
        
        self.minterRef = acct.borrow<&Collectible.NFTMinter>(from: Collectible.MinterStoragePath)
            ?? panic("could not borrow minter reference")

        self.editionCollectionRef = acct.borrow<&Edition.EditionCollection>(from: Edition.CollectionStoragePath)
            ?? panic("could not borrow edition reference")  
    }

    execute {

        var edition = UInt64(1) +  UInt64(100) * (start - UInt64(1));

        while edition <= UInt64(100) * start {
             
            let metadata = Collectible.Metadata(
                link: "QmekZMSjQjieh4P5pPAgH9Xmdyd2UjkoyFuhLRz3cMqhJn",
                name: "Bubble Flow",           
                author: "xtingles", 
                description: "Hear the sound of water bubbles and listen to them pop as the tension builds up.",     
                edition: UInt64(edition),
                properties: {}
            )
                    
            let newNFT <- self.minterRef.mintNFT(metadata: metadata, editionNumber: 12)
        
            self.receiverRef.deposit(token: <-newNFT)
            edition = edition + 1;
        }
       
        log("NFTs Minted and deposited to Account's Collection")

        log(edition)
    }
}