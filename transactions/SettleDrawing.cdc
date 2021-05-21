//emulator
import FungibleToken from 0xee82856bf20e2aa6
import NonFungibleToken, Drawing from 0xf8d6e0586b0a20c7

transaction(id: UInt64) {

    let client: &Drawing.DrawingCollection
    
    prepare(account: AuthAccount) {
        self.client = account.borrow<&Drawing.DrawingCollection>(from: /storage/drawingCollection) ?? panic("could not load admin")
    }

    execute {
        self.client.settleDrawing(id: id, lotterryWinners: [Address(0x179b6b1cb6755e31)])
    }
}