import { testSuitePurchase } from "./purchase";
import { testSuiteChangePrice } from "./changePrice";
import { testSuiteMarketPlaceWithdrawFromSale } from "./withdrawFromSale";
import { testSuiteSale } from "./sale";
import { testSuitePrice } from "./price";
import { testSuiteIDs } from "./getIDs";
import { testSuiteBorrowCollectible } from "./borrowCollectible";
import { testSuiteCollectibles } from "./getCollectible";
import { testSuitePayments } from "./handlePayments";

export const testSuiteMarketPlace = () => describe("Market Place", () => {
   testSuiteSale();
   testSuitePrice();
   testSuiteIDs();
   testSuiteBorrowCollectible();
   testSuiteCollectibles();
   testSuiteChangePrice();
   testSuiteMarketPlaceWithdrawFromSale();
   testSuitePurchase(); 
   testSuitePayments();
 });


