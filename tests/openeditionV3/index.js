import { testSuiteCreateOpenEdition } from "./create";
import { testSuiteOpenEditionStatus } from "./status";
import { testSuiteCancelOpenEdition } from "./cancel";
import { testSuitePurchaseOpenEdition } from "./purchase";
import { testSuiteCommissionPaymentsOpenEdition } from "./commission";
import { testSuiteSettleOpenEdition } from "./settle";
import { testSuiteOpenEditionPrice } from "./price";

export const testSuiteOpenEdition = () => describe("Open Edition", () => {
  testSuiteCreateOpenEdition();
  testSuiteOpenEditionStatus();
  testSuiteCancelOpenEdition();
  testSuitePurchaseOpenEdition();
  testSuiteCommissionPaymentsOpenEdition();
  testSuiteSettleOpenEdition();
  testSuiteOpenEditionPrice();
});