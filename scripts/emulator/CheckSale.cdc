import MarketPlace from 0xf8d6e0586b0a20c7

pub fun main(address:Address): [MarketPlace.SaleData] {

    let status = MarketPlace.getCollectible(address: address)

    return status
}
