import { testSuiteCreatePackLimitedEdition } from "./create";
import { testSuitePackLimitedPrice } from "./price";
import { testSuitePurchaseLimitedEdition } from "./purchase";
import { testSuiteCancelLimitedEdition } from "./cancel";
import { testSuiteSettleLimitedEdition } from "./settle";
import { testSuiteLimitedEditionStatus } from './status';
import { testSuiteCommissionPaymentsLimitedEdition } from './commission';

export const testSuitePackLimitedEdition = () => describe("Pack limited edition", () => {
  testSuiteCreatePackLimitedEdition();
  testSuitePackLimitedPrice();
  testSuitePurchaseLimitedEdition();
  testSuiteCancelLimitedEdition();
  testSuiteSettleLimitedEdition();
  testSuiteLimitedEditionStatus();
  testSuiteCommissionPaymentsLimitedEdition();
});