import FungibleToken from "./FungibleToken.cdc"
import FlowToken from "./FlowToken.cdc"
import ASMR from "./ASMR.cdc"
import NonFungibleToken from "./NonFungibleToken.cdc"

pub contract MarketPlace {

    pub init() {
        self.CollectionPublicPath = /public/ASMRSale
        self.CollectionStoragePath = /storage/ASMRSale
    }

    pub let CollectionStoragePath: StoragePath
    pub let CollectionPublicPath: PublicPath

    // Event that is emitted when a new NFT is put up for sale
    pub event ForSale(id: UInt64, price: UFix64)

    // Event that is emitted when the price of an NFT changes
    pub event PriceChanged(id: UInt64, newPrice: UFix64)
    
    // Event that is emitted when a token is purchased
    pub event TokenPurchased(id: UInt64, price: UFix64, from:Address, to:Address)

    // Event that is emitted when a seller withdraws their NFT from the sale
    pub event SaleWithdrawn(id: UInt64)

    pub resource interface SalePublic {
        pub fun purchase(tokenID: UInt64, recipientCap: Capability<&{ASMR.CollectionPublic}>, buyTokens: @FungibleToken.Vault)
        pub fun idPrice(tokenID: UInt64): UFix64?
        pub fun getIDs(): [UInt64]
        pub fun borrowASMR(id: UInt64): &ASMR.NFT? {
            // If the result isn't nil, the id of the returned reference
            // should be the same as the argument to the function
            post {
                (result == nil) || (result?.id == id):
                    "Cannot borrow collectible reference: The id of the returned reference is incorrect."
            }
        }
    }

    // SaleCollection
    //
    // NFT Collection object that allows a user to put their NFT up for sale
    // where others can send fungible tokens to purchase it
    //
    pub resource SaleCollection: SalePublic {

        // Dictionary of the NFTs that the user is putting up for sale
        pub var forSale: @{UInt64: ASMR.NFT}

        // Dictionary of the prices for each NFT by ID
        pub var prices: {UInt64: UFix64}

        // The fungible token vault of the owner of this sale.
        // When someone buys a token, this resource can deposit
        // tokens into their account.
        access(account) let ownerVault: Capability<&AnyResource{FungibleToken.Receiver}>

        init (vault: Capability<&AnyResource{FungibleToken.Receiver}>) {
            self.forSale <- {}
            self.ownerVault = vault
            self.prices = {}
        }

        // withdraw gives the owner the opportunity to remove a sale from the collection
        pub fun withdraw(tokenID: UInt64): @ASMR.NFT {
            // remove the price
            self.prices.remove(key: tokenID)
            // remove and return the token
            let token <- self.forSale.remove(key: tokenID) ?? panic("missing NFT")
            emit SaleWithdrawn(id: tokenID)
            return <-token
        }

        // listForSale lists an NFT for sale in this collection
        pub fun listForSale(token: @ASMR.NFT, price: UFix64) {
            let id = token.id

            // store the price in the price array
            self.prices[id] = price

            // put the NFT into the the forSale dictionary
            let oldToken <- self.forSale[id] <- token
            destroy oldToken

            emit ForSale(id: id, price: price)
        }

        // changePrice changes the price of a token that is currently for sale
        pub fun changePrice(tokenID: UInt64, newPrice: UFix64) {
            self.prices[tokenID] = newPrice

            emit PriceChanged(id: tokenID, newPrice: newPrice)
        }

        // purchase lets a user send tokens to purchase an NFT that is for sale
        pub fun purchase(tokenID: UInt64, recipientCap: Capability<&{ASMR.CollectionPublic}>, buyTokens: @FungibleToken.Vault) {
            pre {
                self.forSale[tokenID] != nil && self.prices[tokenID] != nil:
                    "No token matching this ID for sale!"
                buyTokens.balance >= (self.prices[tokenID] ?? 0.0):
                    "Not enough tokens to by the NFT!"
            }

            let recipient = recipientCap.borrow()!

            // get the value out of the optional
            let price = self.prices[tokenID]!
            
            self.prices[tokenID] = nil

            let vaultRef = self.ownerVault.borrow()
                ?? panic("Could not borrow reference to owner token vault")
            
            let token <- self.withdraw(tokenID: tokenID)

            // deposit the purchasing tokens into the owners vault
            vaultRef.deposit(from: <-buyTokens)

            // deposit the NFT into the buyers collection
            recipient.deposit(token: <- token)

            emit TokenPurchased(id: tokenID, price: price, from: vaultRef.owner!.address, to:  recipient.owner!.address)
        }

        // idPrice returns the price of a specific token in the sale
        pub fun idPrice(tokenID: UInt64): UFix64? {
            return self.prices[tokenID]
        }

        // getIDs returns an array of token IDs that are for sale
        pub fun getIDs(): [UInt64] {
            return self.forSale.keys
        }

        pub fun borrowASMR(id: UInt64): &ASMR.NFT? {
            if self.forSale[id] != nil {
                let ref = &self.forSale[id] as auth &NonFungibleToken.NFT
                return ref as! &ASMR.NFT
            } else {
                return nil
            }
        }       

        destroy() {
            destroy self.forSale
        }
    }

    // structure for display NFTs data
    pub struct SaleData {
        pub let metadata: ASMR.Metadata
        pub let id: UInt64  
        pub let price: UFix64?
        init(metadata: ASMR.Metadata, id: UInt64, price: UFix64?) {
            self.metadata = metadata
            self.id = id 
            self.price = price
        }
    }

    // get info for NFT including metadata
    pub fun getASMR(address:Address) : [SaleData] {

        var saleData: [SaleData] = []
        let account = getAccount(address)

        let asmrCollection = account.getCapability<&AnyResource{MarketPlace.SalePublic}>(/public/ASMRSale)
            .borrow()
            ?? panic("Could not borrow acct2 nft sale reference")
     
            for id in asmrCollection.getIDs() {
                var asmr = asmrCollection.borrowASMR(id: id) 
                var price = asmrCollection.idPrice(tokenID: id)
                saleData.append(SaleData(
                    metadata: asmr!.metadata,
                    id: id,
                    price: price             
                ))
            }        
        return saleData
    } 
        

    // createCollection returns a new collection resource to the caller
    pub fun createSaleCollection(ownerVault: Capability<&{FungibleToken.Receiver}>): @SaleCollection {
        return <- create SaleCollection(vault: ownerVault)
    }
}
 
