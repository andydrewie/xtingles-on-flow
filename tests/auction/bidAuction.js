import * as t from "@onflow/types";
import path from "path";
import { ZERO_UFIX64, defaultAuctionParameters } from "../constants";
import * as fs from "fs";

import { sendTransaction, mintFlow, getAccountAddress, init, emulator, deployContractByName } from "flow-js-testing";
import { ZERO_UFIX64, defaultAuctionParameters } from "../constants";

export const testSuiteBidAuction = () => describe("Bid auction", () => {
  let createAuctionTransaction,
    checkAuctionStatusScript,
    createdAuction,
    placeBidTransaction,
    createdAuctionWithNFT,
    createAuctionTransactionWithNFT,
    setupFUSDTransaction,
    tickTransaction,
    mintFUSDTransaction,
    cancelAuctionTransaction;
  ;

  beforeAll(async () => {
    jest.setTimeout(30000);
    init(path.resolve(__dirname, "../"));


    const EMULATOR_ACCOUNT = '0xf8d6e0586b0a20c7';

    export const testSuiteBidAuction = () => describe("bid auction", () => {
      beforeAll(async () => {
        init(path.resolve(__dirname, "../"));
      });

      placeBidTransaction = fs.readFileSync(
        path.join(
          __dirname,
          `../../transactions/emulator/Bid.cdc`
        ),
        "utf8"
      );

      setupFUSDTransaction = fs.readFileSync(
        path.join(
          __dirname,
          `../../transactions/emulator/SetupFUSD.cdc`
        ),
        "utf8"
      );

      cancelAuctionTransaction = fs.readFileSync(
        path.join(
          __dirname,
          `../../transactions/emulator/CancelAuction.cdc`
        ),
        "utf8"
      );

      mintFUSDTransaction = fs.readFileSync(
        path.join(
          __dirname,
          `../../transactions/emulator/MintFUSD.cdc`
        ),
        "utf8"
      );

      tickTransaction = fs.readFileSync(
        path.join(
          __dirname,
          `../../transactions/emulator/Tick.cdc`
        ),
        "utf8"
      );

    });

    beforeEach(async (done) => {
      const basePath = path.resolve(__dirname, "../../");
      const port = 8081;
      init(basePath, port);

      await emulator.start(port, false);

      const admin = await getAccountAddress("admin");

      await mintFlow(admin, "10.0");

      const addressMap = {
        NonFungibleToken: admin,
        FUSD: admin,
        Collectible: admin,
        Edition: admin,
      };

      await deployContractByName({ to: admin, name: "Edition" });
      await deployContractByName({ to: admin, name: "NonFungibleToken" });
      await deployContractByName({ to: admin, name: "FUSD" });
      await deployContractByName({ to: admin, name: "Collectible", addressMap });
      await deployContractByName({ to: admin, name: "Auction", addressMap });

      // Setup FUSD Vault
      await sendTransaction({
        code: setupFUSDTransaction,
        args: [],
        signers: [admin],
      });

      // Mint FUSD for Vault
      await sendTransaction({
        code: mintFUSDTransaction,
        args: [
          ["500.00", t.UFix64], [admin, t.Address]
        ],
        signers: [admin],
      });

      done();
    });

    // Stop emulator, so it could be restarted
    afterEach(async (done) => {
      await emulator.stop();
      done();
    });

    test("Throw error, when auction does not exists", async () => {
      let error;
      try {

        const admin = await getAccountAddress("admin");

        await sendTransaction({
          code: placeBidTransaction,
          args: [
            [999, t.UInt64],
            ["50.00", t.UFix64],
            [admin, t.Address],
          ],
          signers: [admin],
        });

      } catch (e) {
        error = e;
      }

      expect(error).toMatch(/Auction does not exist in this drop/);
    });

    test("NFT in auction does not exist", async () => {
      let error;
      try {
        const admin = await getAccountAddress("admin");

        const createdAuction = await sendTransaction({
          code: createAuctionTransaction,
          args: defaultAuctionParameters,
          signers: [admin],
        });

        const { events } = createdAuction;
        await sendTransaction({
          code: placeBidTransaction,
          args: [
            [events[0].data.auctionID, t.UInt64],
            ["50.00", t.UFix64],
            [admin, t.Address],
          ],
          signers: [admin],
        });
      } catch (e) {
        error = e;
      }
      expect(error).toMatch(/NFT in auction does not exist/);
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
        const admin = await getAccountAddress("admin");
        const commission = `{
        Address(0xf8d6e0586b0a20c7) : Edition.CommissionStructure(
            firstSalePercent: 1.00,
            secondSalePercent: 2.00,
            description: "xxx"
        ),
        Address(0x179b6b1cb6755e31) : Edition.CommissionStructure(
            firstSalePercent: 99.00,
            secondSalePercent: 7.00,
            description: "xxx"
        )
      }`;
        const createdAuctionWithNFT = await sendTransaction({
          code: createAuctionTransactionWithNFT.replace('RoyaltyVariable', commission),
          args: [
            ...defaultAuctionParameters,
            ["xxx", t.String],
            ["xxx", t.String],
            ["xxx", t.String],
            ["xxx", t.String],
            [1, t.UInt64],
          ],
          signers: [admin],
        });

        const { events } = createdAuctionWithNFT;

        await sendTransaction({
          code: placeBidTransaction,
          args: [
            [events[0].data.auctionID, t.UInt64],
            ["50.00", t.UFix64],
            [admin, t.Address],
          ],
          signers: [admin],
        });

      } catch (e) {
        error = e;
      }
      expect(error).toMatch(/The auction has not started yet/);
    });

    test("throw error, when the auction time expired", async () => {
      let error;
      try {
        const admin = await getAccountAddress("admin");

        const commission = `{
        Address(0xf8d6e0586b0a20c7) : Edition.CommissionStructure(
            firstSalePercent: 1.00,
            secondSalePercent: 2.00,
            description: "xxx"
        ),
        Address(0x179b6b1cb6755e31) : Edition.CommissionStructure(
            firstSalePercent: 99.00,
            secondSalePercent: 7.00,
            description: "xxx"
        )
      }`;

        const auctionParameters = [
          ["10.00", t.UFix64],

          // Auction length  
          ["1.00", t.UFix64],

          ["1300.00", t.UFix64],
          ["1300.00", t.UFix64],

          // Start time
          [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],

          ["50.00", t.UFix64],
          ["0x01cf0e2f2f715450", t.Address]
        ];

        const createdAuctionWithNFT = await sendTransaction({
          code: createAuctionTransactionWithNFT.replace('RoyaltyVariable', commission),
          args: [
            ...auctionParameters,
            ["xxx", t.String],
            ["xxx", t.String],
            ["xxx", t.String],
            ["xxx", t.String],
            [1, t.UInt64],
          ],
          signers: [admin],
        });

        await new Promise((r) => setTimeout(r, 3000));

        await sendTransaction({
          code: tickTransaction,
          args: [],
          signers: [admin],
        });

        const { events } = createdAuctionWithNFT;

        await sendTransaction({
          code: placeBidTransaction,
          args: [
            [events[0].data.auctionID, t.UInt64],
            ["50.00", t.UFix64],
            [admin, t.Address],
          ],
          signers: [admin],
        });

      } catch (e) {
        error = e;
      }
      expect(error).toMatch(/Time expired/);
    });

    test("throw error, when the auction was cancelled", async () => {
      let error;
      try {
        const admin = await getAccountAddress("admin");

        const commission = `{
        Address(0xf8d6e0586b0a20c7) : Edition.CommissionStructure(
            firstSalePercent: 1.00,
            secondSalePercent: 2.00,
            description: "xxx"
        ),
        Address(0x179b6b1cb6755e31) : Edition.CommissionStructure(
            firstSalePercent: 99.00,
            secondSalePercent: 7.00,
            description: "xxx"
        )
      }`;

        const auctionParameters = [
          ["10.00", t.UFix64],

          // Auction length  
          ["1000.00", t.UFix64],

          ["1300.00", t.UFix64],
          ["1300.00", t.UFix64],

          // Start time
          [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],

          ["50.00", t.UFix64],
          ["0x01cf0e2f2f715450", t.Address]
        ];

        const createdAuctionWithNFT = await sendTransaction({
          code: createAuctionTransactionWithNFT.replace('RoyaltyVariable', commission),
          args: [
            ...auctionParameters,
            ["xxx", t.String],
            ["xxx", t.String],
            ["xxx", t.String],
            ["xxx", t.String],
            [1, t.UInt64],
          ],
          signers: [admin],
        });

        const { events } = createdAuctionWithNFT;

        await sendTransaction({
          code: cancelAuctionTransaction,
          args: [
            [events[0].data.auctionID, t.UInt64]
          ],
          signers: [admin],
        });

        await sendTransaction({
          code: placeBidTransaction,
          args: [
            [events[0].data.auctionID, t.UInt64],
            ["50.00", t.UFix64],
            [admin, t.Address],
          ],
          signers: [admin],
        });

      } catch (e) {
        error = e;
      }
      expect(error).toMatch(/Auction was cancelled/);
    });

    test("throw error, when the bid is less than min", async () => {
      let error;
      try {
        const admin = await getAccountAddress("admin");

        const commission = `{
        Address(0xf8d6e0586b0a20c7) : Edition.CommissionStructure(
            firstSalePercent: 1.00,
            secondSalePercent: 2.00,
            description: "xxx"
        ),
        Address(0x179b6b1cb6755e31) : Edition.CommissionStructure(
            firstSalePercent: 99.00,
            secondSalePercent: 7.00,
            description: "xxx"
        )
      }`;

        const auctionParameters = [
          ["10.00", t.UFix64],

          // Auction length  
          ["1000.00", t.UFix64],

          ["1300.00", t.UFix64],
          ["1300.00", t.UFix64],

          // Start time
          [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],

          ["50.00", t.UFix64],
          ["0x01cf0e2f2f715450", t.Address]
        ];

        const createdAuctionWithNFT = await sendTransaction({
          code: createAuctionTransactionWithNFT.replace('RoyaltyVariable', commission),
          args: [
            ...auctionParameters,
            ["xxx", t.String],
            ["xxx", t.String],
            ["xxx", t.String],
            ["xxx", t.String],
            [1, t.UInt64],
          ],
          signers: [admin],
        });

        const { events } = createdAuctionWithNFT;

        await new Promise((r) => setTimeout(r, 3000));

        await sendTransaction({
          code: tickTransaction,
          args: [],
          signers: [admin],
        });

        await sendTransaction({
          code: placeBidTransaction,
          args: [
            [events[0].data.auctionID, t.UInt64],
            ["5.00", t.UFix64],
            [admin, t.Address],
          ],
          signers: [admin],
        });

      } catch (e) {
        error = e;
      }
      expect(error).toMatch(/Bid is less than min acceptable/);
    });

    test("successfull bid case", async () => {
      let error;
      try {
        const admin = await getAccountAddress("admin");

        const commission = `{
        Address(0xf8d6e0586b0a20c7) : Edition.CommissionStructure(
            firstSalePercent: 1.00,
            secondSalePercent: 2.00,
            description: "xxx"
        ),
        Address(0x179b6b1cb6755e31) : Edition.CommissionStructure(
            firstSalePercent: 99.00,
            secondSalePercent: 7.00,
            description: "xxx"
        )
      }`;

        const auctionParameters = [
          ["10.00", t.UFix64],

          // Auction length  
          ["1000.00", t.UFix64],

          ["1300.00", t.UFix64],
          ["1300.00", t.UFix64],

          // Start time
          [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],

          ["50.00", t.UFix64],
          ["0x01cf0e2f2f715450", t.Address]
        ];

        const createdAuctionWithNFT = await sendTransaction({
          code: createAuctionTransactionWithNFT.replace('RoyaltyVariable', commission),
          args: [
            ...auctionParameters,
            ["xxx", t.String],
            ["xxx", t.String],
            ["xxx", t.String],
            ["xxx", t.String],
            [1, t.UInt64],
          ],
          signers: [admin],
        });

        const { events } = createdAuctionWithNFT;

        const auctionId = events[0].data.auctionID;

        await new Promise((r) => setTimeout(r, 3000));

        await sendTransaction({
          code: tickTransaction,
          args: [],
          signers: [admin],
        });

        const result = await sendTransaction({
          code: placeBidTransaction,
          args: [
            [auctionId, t.UInt64],
            ["50.00", t.UFix64],
            [admin, t.Address],
          ],
          signers: [admin],
        });

        const { events: sucessfullBidEvents } = result;

        const bidEvent = sucessfullBidEvents.filter(event => event.type === `A.${admin.substr(2)}.Auction.Bid`)

        expect(result.errorMessage).toEqual('')

        expect(bidEvent.data).toMatchObject({
          auctionID: auctionId,
          bidPrice: '50.00000000'
        })
      } catch (e) {
        error = e;
      }
      console.log(error);
      expect(error).toEqual(undefined);
    });

  });
});