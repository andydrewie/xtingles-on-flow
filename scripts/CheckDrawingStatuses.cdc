import Drawing from 0xf8d6e0586b0a20c7

pub fun main(address:Address): {UInt64: Drawing.DrawingStatus} {
    let acct = getAccount(address)

    let acctDrawingRef = acct.getCapability<&AnyResource{Drawing.DrawingPublic}>(/public/drawingCollection)
        .borrow()
        ?? panic("Could not borrow open edition reference")

    return acctDrawingRef.getDrawingStatuses()
}
