import Royalty from 0xf8d6e0586b0a20c7

pub fun main(address:Address, id: UInt64): Royalty.RoyaltyStatus {
 
    let acct = getAccount(address)

    let receiverRef = acct.getCapability<&{Royalty.RoyaltyPublic}>(/public/royaltyCollection)
        .borrow()
        ?? panic("Could not borrow receiver reference")    
     
    return receiverRef.getRoyalty(id)
}
