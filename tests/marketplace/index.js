import { testSuitePurchase } from "./purchase";
import { testSuiteChangePrice } from "./changePrice";
import { testSuiteMarketPlaceWithdraw } from "./withdraw";
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
   testSuiteMarketPlaceWithdraw();
   testSuitePurchase(); 
   testSuitePayments();
 });


