
import Collectible from 0xf5b0eb433389ac3f
transaction {
    prepare(signer: AuthAccount) {
    let minterRef = signer.borrow<&Collectible.NFTMinter>(from: Collectible.MinterStoragePath)
        ?? panic("could not borrow minter reference")
    }
}