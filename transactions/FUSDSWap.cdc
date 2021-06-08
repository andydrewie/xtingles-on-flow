import FungibleToken from 0x9a0766d93b6608b7 
import FlowToken from 0x7e60df042a9c0868
import TeleportedTetherToken from 0xab26e0a07d770ec1
import FlowSwapPair from 0xd9854329b7edf136

transaction(amountIn: UFix64, minAmountOut: UFix64) {
  prepare(signer: AuthAccount, proxyHolder: AuthAccount) {
    let flowVault = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
        ?? panic("Could not borrow a reference to Vault")
    
    let token1Vault <- flowVault.withdraw(amount: amountIn) as! @FlowToken.Vault

    if signer.borrow<&TeleportedTetherToken.Vault>(from: TeleportedTetherToken.TokenStoragePath) == nil {
      // Create a new teleportedTetherToken Vault and put it in storage
      signer.save(<-TeleportedTetherToken.createEmptyVault(), to: TeleportedTetherToken.TokenStoragePath)

      // Create a public capability to the Vault that only exposes
      // the deposit function through the Receiver interface
      signer.link<&TeleportedTetherToken.Vault{FungibleToken.Receiver}>(
        TeleportedTetherToken.TokenPublicReceiverPath,
        target: TeleportedTetherToken.TokenStoragePath
      )

      // Create a public capability to the Vault that only exposes
      // the balance field through the Balance interface
      signer.link<&TeleportedTetherToken.Vault{FungibleToken.Balance}>(
        TeleportedTetherToken.TokenPublicBalancePath,
        target: TeleportedTetherToken.TokenStoragePath
      )
    }

    let tetherVault = signer.borrow<&TeleportedTetherToken.Vault>(from: /storage/teleportedTetherTokenVault)
        ?? panic("Could not borrow a reference to Vault")

    let swapProxyRef = proxyHolder.borrow<&FlowSwapPair.SwapProxy>(from: /storage/flowUsdtSwapProxy)
        ?? panic("Could not borrow a reference to proxy holder")

    let token2Vault <- swapProxyRef.swapToken1ForToken2(from: <-token1Vault)

    assert(token2Vault.balance > minAmountOut, message: "Output amount too small")

    tetherVault.deposit(from: <- token2Vault)
  }
}