import { testSuiteCreateAuction } from './createAuction';
import { testSuiteBidAuction } from './bid';
import { testSuiteAddNFT } from './addNFT';
import { testSuiteSendBidTokens } from './sendBidTokens';
import { testSuiteCancelAuction } from './cancel';
import { testSuiteExtendAuction } from './extend';
import { testSuitSettleAuction } from './settle';
import { testSuitePayCommission } from './payCommission';
import { testSuiteAuctionStatus } from './status';
import { testSuiteSendNFT } from './sendNFT';

export const testSuiteAuction = () => describe("Auction", () => {
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
});