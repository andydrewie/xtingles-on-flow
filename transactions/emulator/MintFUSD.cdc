import FungibleToken from 0xee82856bf20e2aa6
import FUSD from 0x01cf0e2f2f715450

transaction(amount: UFix64, to: Address) {

  // The Vault resource that holds the tokens being transferred
  let sentVault: @FungibleToken.Vault

  prepare(acct: AuthAccount) {
   
    let minter = acct.borrow<&FUSD.Minter>(from: /storage/FUSDMinter)!

    self.sentVault <- minter.mintTokens(amount: amount)
  
  }

  execute {
    // Get the recipient's public account object
    let recipient = getAccount(to)

    // Get a reference to the recipient's Receiver
    let receiverRef = recipient
      .getCapability(/public/fusdReceiver)
      .borrow<&{FungibleToken.Receiver}>()
      ?? panic("Could not borrow receiver reference to the recipient's Vault")

    // Deposit the withdrawn tokens in the recipient's receiver
    receiverRef.deposit(from: <-self.sentVault)
  }
}