import {
   testSuiteCreateAuction, testSuiteBidAuction, testSuiteAddNFT,
   testSuiteSendBidTokens, testSuiteCancelAuction,
   testSuiteExtendAuction, testSuitSettleAuction,
   testSuitePayCommission, testSuiteAuctionStatus,
   testSuiteSendNFT
} from './auction';
import { testSuiteCollectible } from "./collectible"
import { testSuiteCreateEdition, testSuiteChangeCommission, testSuiteChangeMaxEdition, testSuiteGetEdition } from "./edition"
import {
   testSuiteMarketPlacePuchase,
   testSuiteMarketPlaceCommon
} from "./marketPlace";

import {
   testSuiteCreateOpenEdition,
   testSuiteOpenEditionStatus,
   testSuiteCancelOpenEdition,
   testSuitePurchaseOpenEdition,
   testSuiteCommissionPaymentsOpenEdition,
   testSuiteSettleOpenEdition,
   testSuiteOpenEditionPrice
} from "./openedition";

describe('sequentially run tests', () => {
  /* testSuiteCollectible();
   testSuiteCreateEdition();
   testSuiteChangeCommission();
   testSuiteChangeMaxEdition();
   testSuiteGetEdition();*/
   testSuiteCreateAuction();
   testSuiteAddNFT();
   testSuiteBidAuction();
   testSuiteSendBidTokens();
   testSuiteCancelAuction();
   testSuiteExtendAuction();
   testSuitSettleAuction(); 
   testSuitePayCommission();
   testSuiteAuctionStatus();
   testSuiteSendNFT();
  // testSuiteMarketPlacePuchase();
  // testSuiteMarketPlaceCommon();
 /*  testSuiteCreateOpenEdition();
   testSuiteOpenEditionStatus();
   testSuiteCancelOpenEdition(); 
   testSuitePurchaseOpenEdition();
   testSuiteCommissionPaymentsOpenEdition();
   testSuiteSettleOpenEdition();
   testSuiteOpenEditionPrice(); */
})
