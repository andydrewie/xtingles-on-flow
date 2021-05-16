//emulator
import Royalty from 0xf8d6e0586b0a20c7
import FungibleToken from 0xee82856bf20e2aa6

transaction(
    id: UInt64,
    firstCommissionAuthor: UFix64,
    firstCommissionPlatform: UFix64,
    secondCommissionAuthor: UFix64,
    secondCommissionPlatform: UFix64,
    authorAddress: Address,
    platformAddress: Address
) {
    let client: &Royalty.RoyaltyCollection
    
    prepare(account: AuthAccount) {
        self.client = account.borrow<&Royalty.RoyaltyCollection>(from: /storage/royaltyCollection) ?? panic("could not load admin")
    }  

    execute {
        let authorAccount = getAccount(authorAddress)  
        let authorVaultCap = authorAccount.getCapability<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)  

        let platformAccount = getAccount(platformAddress)
        let platformVaultCap = platformAccount.getCapability<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
        self.client.changeCommission(
            id: id, firstCommissionAuthor: firstCommissionAuthor,
            firstCommissionPlatform: firstCommissionPlatform,
            secondCommissionAuthor: secondCommissionAuthor,
            secondCommissionPlatform: secondCommissionPlatform,
            authorVaultCap: authorVaultCap,
            platformVaultCap: platformVaultCap
        )
    }
}