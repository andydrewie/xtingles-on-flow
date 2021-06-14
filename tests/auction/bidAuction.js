import * as t from "@onflow/types";
import path from "path";
import { ZERO_UFIX64, defaultAuctionParameters } from "../constants";
import * as fs from "fs";

import {
  sendTransaction,
  executeScript,
  init,

  getTransactionCode,

  shallRevert,
  getAccountAddress
} from "flow-js-testing";



const EMULATOR_ACCOUNT = '0xf8d6e0586b0a20c7';

export const testSuiteBidAuction = () => describe("bid auction", () => {
  beforeAll(async () => {
    init(path.resolve(__dirname, "../"));
  });

  test("initial setup", async () => {
    //  const Service = await getServiceAddress();
    /*const createAuctionTransactionCode = await getTransactionCode({
      name: "emulator/CreateAuction",
    });

    const createdAuctionWithNFTCode = await getTransactionCode({
      name: "emulator/CreateAuctionWithNFT"
    });

    await sendTransaction({
      code: createAuctionTransactionCode,
      args: defaultAuctionParameters,
      signers: [EMULATOR_ACCOUNT],
    });

    await sendTransaction({
      code: createdAuctionWithNFTCode,
      args: [
        ...defaultAuctionParameters,
        ["xxx", t.String],
        ["xxx", t.String],
        ["xxx", t.String],
        ["xxx", t.String],
      ],
      signers: [EMULATOR_ACCOUNT]
    });*/

    const acc = await getAccountAddress("emulator-account");
    console.log(acc)
  });

  test("Auction does not exists", async () => {
    // const Service = await getServiceAddress();
    const code = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/Bid.cdc`
      ),
      "utf8"
    );
    const args = [
      [999, t.UInt64],
      ["50.00", t.UFix64],
      [EMULATOR_ACCOUNT, t.Address],
    ];
    try {


      const acc = await getAccountAddress("emulator-account");
      console.log(acc)
      const txResult = await sendTransaction({
        code,
        args,
        signers: [acc]
      });


    } catch (err) {
      console.log(err);
      expect(err).toMatch(/Auction does not exist in this drop/);
    }


  });
});