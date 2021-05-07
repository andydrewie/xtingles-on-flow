import MarketPlace from 0x175e958cf586f54c

pub fun main(address:Address): [MarketPlace.SaleData] {
    let account = getAccount(address)

    let status = MarketPlace.getASMR(address: address)

    return status
}
