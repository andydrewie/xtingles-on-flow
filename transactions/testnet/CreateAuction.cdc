import FungibleToken from 0xf233dcee88fe0abe
import FUSD from 0x3c5959b568896393
import Collectible from 0xf5b0eb433389ac3f
import NonFungibleToken from 0x1d7e57aa55817448
import Edition from 0xf5b0eb433389ac3f
import Auction from 0xf5b0eb433389ac3f

transaction(      
        minimumBidIncrement: UFix64, 
        auctionLength: UFix64,
        extendedLength: UFix64, 
        remainLengthToExtend: UFix64,
        auctionStartTime: UFix64,
        startPrice: UFix64, 
        platformAddress: Address,

        // Metadata for NFT
        link: String,          
        name: String, 
        author: String,      
        description: String     
    ) {

    let auctionCollectionRef: &Auction.AuctionCollection
    let platformCap: Capability<&FUSD.Vault{FungibleToken.Receiver}>
    let minterRef: &Collectible.NFTMinter
    let editionCollectionRef: &Edition.EditionCollection
    let editionCap: Capability<&{Edition.EditionCollectionPublic}>
    let metadata: Collectible.Metadata
  
    prepare(acct: AuthAccount) {

        // Auction refrerence
        self.auctionCollectionRef = acct.borrow<&Auction.AuctionCollection>(from:Auction.CollectionStoragePath)
            ?? panic("could not borrow minter reference")    
     
        // Platform account to handle fail commission payments
        let platform = getAccount(platformAddress)

        // Capability to FUSD vault
        self.platformCap = platform.getCapability<&FUSD.Vault{FungibleToken.Receiver}>(/public/fusdReceiver)

        // Reference to resource mint NFT on the account
        let minterRef = signer.borrow<&Collectible.NFTMinter>(from: Collectible.MinterStoragePath)
           ?? panic("could not borrow minter reference")

        // Create metadata for NFT
        self.metadata = Collectible.Metadata(
            link: link,          
            name: name, 
            author: author,      
            description: description,    
            // Number of copy. In case auction it is always 1    
            edition: 1,
            // Reserve for the future metadata
            properties: {}   
        ) 

        self.editionCap = acct.getCapability<&{Edition.EditionCollectionPublic}>(Edition.CollectionPublicPath)

        self.editionCollectionRef = acct.borrow<&Edition.EditionCollection>(from: Edition.CollectionStoragePath)
            ?? panic("could not borrow edition reference reference")     
    }

    execute {    
     
        // Create acution without NFT
        let auctionId = self.auctionCollectionRef.createAuction(          
            minimumBidIncrement: minimumBidIncrement,
            auctionLength: auctionLength,       
            extendedLength: extendedLength, 
            remainLengthToExtend: remainLengthToExtend,
            auctionStartTime: auctionStartTime,
            startPrice: startPrice,
            platformVaultCap: self.platformCap,
            // Capability to get the common information for the all copies of the one item (in our case commission and amount of copies)
            editionCap: self.editionCap   
        )

        // Create item in collection Edition to store common infromation for the all copies of the one item 
        let editionId = self.editionCollectionRef.createEdition(
            // Commission charges in the case of the first (auction) and the secondary (marketplace) sale
            // In our sdk we'd prefer to replace this info as template in Javascript than pass as paramters in transaction
            royalty: {
                Address(0xf9e164b413a74d51) : Edition.CommissionStructure(
                    firstSalePercent: 80.00,
                    secondSalePercent: 2.00,
                    description: "Author"
                ),
                Address(0xefb501878aa34730) : Edition.CommissionStructure(
                    firstSalePercent: 20.00,
                    secondSalePercent: 7.00,
                    description: "Third party"
                )
            },
            // Amount copies of the item. This is 1 in case of auction
            maxEdition: 1
        )       

        // Mint NFT
        let newNFT <- self.minterRef.mintNFT(metadata: self.metadata, editionNumber: editionId)
     
        // Add NFT in auction
        self.auctionCollectionRef.addNFT(id: auctionId, NFT:<- newNFT)
    }
}
