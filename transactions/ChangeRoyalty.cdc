//emulator
import Royalty from 0xf8d6e0586b0a20c7

transaction(
    id: UInt64,
    firstCommissionAuthor: UFix64,
    firstCommissionPlatform: UFix64,
    secondCommissionAuthor: UFix64,
    secondCommissionPlatform: UFix64
) {
    let client: &Royalty.RoyaltyCollection
    
    prepare(account: AuthAccount) {
        self.client = account.borrow<&Royalty.RoyaltyCollection>(from: /storage/royaltyCollection) ?? panic("could not load admin")
    }

    execute {
        self.client.changeCommission(id: id, firstCommissionAuthor: firstCommissionAuthor, firstCommissionPlatform: firstCommissionPlatform, secondCommissionAuthor: secondCommissionAuthor, secondCommissionPlatform: secondCommissionPlatform)
    }
}