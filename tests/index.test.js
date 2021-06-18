import {
   testSuiteCreateAuction, testSuiteBidAuction, testSuiteAddNFT,
   testSuiteSendBidTokens, testSuiteCancelAuction,
   testSuiteExtendAuction, testSuitSettlelAuction,
   testSuitePayCommission, testSuiteAuctionStatus,
} from './auction';
import { testSuiteCollectible } from "./collectible"
import { testSuiteEdition } from "./edition"
import {
   testSuiteMarketPlacePuchase,
   testSuiteMarketPlaceCommon
} from "./marketPlace";

import {
   testSuiteCreateOpenEdition,
   testSuiteOpenEditionStatus,
   testSuiteCancelOpenEdition
} from "./openedition";

describe('sequentially run tests', () => {
   // testSuiteCollectible();
   // testSuiteEdition()
   // testSuiteCreateAuction();
   /*testSuiteAddNFT();
   testSuiteBidAuction();
   testSuiteSendBidTokens();
   testSuiteCancelAuction();
   testSuiteExtendAuction();
   testSuitSettlelAuction(); 
   testSuitePayCommission();
   testSuiteAuctionStatus();
   testSuiteMarketPlacePuchase();*/
   //testSuiteMarketPlaceCommon();
  // testSuiteCreateOpenEdition();
  // testSuiteOpenEditionStatus();
   testSuiteCancelOpenEdition();
})
