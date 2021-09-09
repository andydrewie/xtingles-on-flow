import MarketPlace from 0xbf117454d836d021

pub fun main(address:Address): [MarketPlace.SaleData] {

    let status = MarketPlace.getSaleDatas(address: address)

    return status
}
 