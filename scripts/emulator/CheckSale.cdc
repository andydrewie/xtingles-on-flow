import MarketPlace from 0x01cf0e2f2f715450

pub fun main(address:Address): [MarketPlace.SaleData] {

    let status = MarketPlace.getSaleDatas(address: address)

    return status
}
