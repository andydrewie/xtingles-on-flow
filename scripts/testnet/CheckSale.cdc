import MarketPlace from 0x01547a7e742007d9

pub fun main(address:Address): [MarketPlace.SaleData] {

    let status = MarketPlace.getSaleDatas(address: address)

    return status
}
 