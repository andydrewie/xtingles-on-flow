import FungibleToken from 0xee82856bf20e2aa6
import FUSD from 0x01cf0e2f2f715450

transaction {
  prepare(signer: AuthAccount) {
    log("Unlinking fusd for ".concat(signer.address.toString()))
    signer.unlink(/public/fusdReceiver)
  }
}