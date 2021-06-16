import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import {
  sendTransaction, mintFlow, getAccountAddress,
  init, emulator, deployContractByName, executeScript
} from "flow-js-testing";

export const testSuitSettlelAuction = () => describe("Settle auction", () => {
  let placeBidTransaction,
    createAuctionTransactionWithNFT,
    setupFUSDTransaction,
    tickTransaction,
    mintFUSDTransaction,
    cancelAuctionTransaction,
    createAuctionTransaction,
    checkAuctionStatusScript,
    settleAuctionTransaction;

  let commission = `{
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

  beforeAll(async () => {
    jest.setTimeout(30000);
    init(path.resolve(__dirname, "../"));

    createAuctionTransactionWithNFT = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/CreateAuctionWithNFT.cdc`
      ),
      "utf8"
    );

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

    settleAuctionTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/SettleAuction.cdc`
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

    createAuctionTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/CreateAuction.cdc`
      ),
      "utf8"
    );

    checkAuctionStatusScript = fs.readFileSync(
      path.join(
        __dirname,
        `../../scripts/emulator/CheckAuctionStatus.cdc`
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
    const second = await getAccountAddress("second");
    const third = await getAccountAddress("third");

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

    // Setup FUSD Vault for the admin account
    await sendTransaction({
      code: setupFUSDTransaction,
      args: [],
      signers: [admin],
    });

    // Mint FUSD for Vault and sent to the admin account
    await sendTransaction({
      code: mintFUSDTransaction,
      args: [
        ["500.00", t.UFix64], [admin, t.Address]
      ],
      signers: [admin],
    });

    // Setup FUSD Vault for the second account
    await sendTransaction({
      code: setupFUSDTransaction,
      args: [],
      signers: [second],
    });

    // Mint FUSD for Vault and sent to the second account
    await sendTransaction({
      code: mintFUSDTransaction,
      args: [
        ["500.00", t.UFix64], [second, t.Address]
      ],
      signers: [admin],
    });

    // Setup FUSD Vault for the third account
    await sendTransaction({
      code: setupFUSDTransaction,
      args: [],
      signers: [third],
    });

    // Mint FUSD for Vault and sent to the third account
    await sendTransaction({
      code: mintFUSDTransaction,
      args: [
        ["500.00", t.UFix64], [third, t.Address]
      ],
      signers: [admin],
    });

    commission = `{
      Address(${second}) : Edition.CommissionStructure(
          firstSalePercent: 1.00,
          secondSalePercent: 2.00,
          description: "xxx"
      ),
      Address(${third}) : Edition.CommissionStructure(
          firstSalePercent: 99.00,
          secondSalePercent: 7.00,
          description: "xxx"
      )
  }`;

    done();
  });

  // Stop emulator, so it could be restarted
  afterEach(async (done) => {
    await emulator.stop();
    done();
  });

  test("throw error, when auction does not exist", async () => {
    try {
      const admin = await getAccountAddress("admin");

      await sendTransaction({
        code: settleAuctionTransaction,
        args: [
          [1, t.UInt64]
        ],
        signers: [admin],
      });

    } catch (e) {
      expect(e).toMatch(/Auction does not exist/);
    }
  });

  test("throw error, when auction without NFT", async () => {
    try {
      const admin = await getAccountAddress("admin");

      const auctionParameters = [
        // Min bid increment in percent
        ["10.00", t.UFix64],
        // Initial auction length  
        ["1000.00", t.UFix64],
        // Time until finish, when auction could be extended
        ["120.00", t.UFix64],
        // Time lenght to extend auction
        ["120.00", t.UFix64],
        // Start time
        [(new Date().getTime() / 1000 + 1000).toFixed(2), t.UFix64],
        // Initial price
        ["50.00", t.UFix64],
        // Platform vault address
        ["0x01cf0e2f2f715450", t.Address]
      ];

      await sendTransaction({
        code: createAuctionTransaction.replace('RoyaltyVariable', commission),
        args: [
          ...auctionParameters
        ],
        signers: [admin],
      });

      const result = await sendTransaction({
        code: settleAuctionTransaction,
        args: [
          [1, t.UInt64]
        ],
        signers: [admin],
      });

      expect(result).toEqual(null);

    } catch (e) {
      expect(e).toMatch(/NFT in auction does not exist/);
    }
  });

  test("throw error, when auction time is not expired", async () => {
    try {
      const admin = await getAccountAddress("admin");

      const auctionParameters = [
        // Min bid increment in percent
        ["10.00", t.UFix64],
        // Initial auction length  
        ["1000.00", t.UFix64],
        // Time until finish, when auction could be extended
        ["120.00", t.UFix64],
        // Time lenght to extend auction
        ["120.00", t.UFix64],
        // Start time
        [(new Date().getTime() / 1000 + 1000).toFixed(2), t.UFix64],
        // Initial price
        ["50.00", t.UFix64],
        // Platform vault address
        ["0x01cf0e2f2f715450", t.Address]
      ];

      const createdAuctionWithNFT = await sendTransaction({
        code: createAuctionTransactionWithNFT.replace('RoyaltyVariable', commission),
        args: [
          ...auctionParameters,
          // Link to NFT
          ["xxx", t.String],
          // name
          ["xxx", t.String],
          // author
          ["xxx", t.String],
          // description
          ["xxx", t.String],
          // Number of copy in one edition
          [1, t.UInt64],
        ],
        signers: [admin],
      });

      const { events } = createdAuctionWithNFT;

      // Id of created auction
      const auctionId = events[0].data.auctionID;

      await new Promise((r) => setTimeout(r, 3000));

      // Sample transaction to change last block time
      await sendTransaction({
        code: tickTransaction,
        args: [],
        signers: [admin],
      });

      const result = await sendTransaction({
        code: settleAuctionTransaction,
        args: [
          [1, t.UInt64]
        ],
        signers: [admin],
      });

      expect(result).toEqual(null);

    } catch (e) {
      expect(e).toMatch(/Auction has not completed yet/);
    }
  });

  test("throw error, because auction was cancelled", async () => {
    try {
      const admin = await getAccountAddress("admin");

      const auctionParameters = [
        // Min bid increment in percent
        ["10.00", t.UFix64],
        // Initial auction length  
        ["1000.00", t.UFix64],
        // Time until finish, when auction could be extended
        ["120.00", t.UFix64],
        // Time lenght to extend auction
        ["120.00", t.UFix64],
        // Start time
        [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
        // Initial price
        ["50.00", t.UFix64],
        // Platform vault address
        ["0x01cf0e2f2f715450", t.Address]
      ];

      const createdAuctionWithNFT = await sendTransaction({
        code: createAuctionTransactionWithNFT.replace('RoyaltyVariable', commission),
        args: [
          ...auctionParameters,
          // Link to NFT
          ["xxx", t.String],
          // name
          ["xxx", t.String],
          // author
          ["xxx", t.String],
          // description
          ["xxx", t.String],
          // Number of copy in one edition
          [1, t.UInt64],
        ],
        signers: [admin],
      });

      const { events } = createdAuctionWithNFT;

      // Id of created auction
      const auctionId = events[0].data.auctionID;

      await new Promise((r) => setTimeout(r, 3000));

      // Sample transaction to change last block time
      await sendTransaction({
        code: tickTransaction,
        args: [],
        signers: [admin],
      });

      // Cancel auction
      await sendTransaction({
        code: cancelAuctionTransaction,
        args: [
          [events[0].data.auctionID, t.UInt64]
        ],
        signers: [admin],
      });

      const result = await sendTransaction({
        code: settleAuctionTransaction,
        args: [
          [1, t.UInt64]
        ],
        signers: [admin],
      });

      expect(result).toEqual(null);
    } catch (e) {
      expect(e).toMatch(/The auction was cancelled/);
    }
  });

  test("throw error, because auction was settled earlier", async () => {
    try {
      const admin = await getAccountAddress("admin");

      const auctionParameters = [
        // Min bid increment in percent
        ["10.00", t.UFix64],
        // Initial auction length  
        ["1.00", t.UFix64],
        // Time until finish, when auction could be extended
        ["120.00", t.UFix64],
        // Time lenght to extend auction
        ["120.00", t.UFix64],
        // Start time
        [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
        // Initial price
        ["50.00", t.UFix64],
        // Platform vault address
        ["0x01cf0e2f2f715450", t.Address]
      ];

      const createdAuctionWithNFT = await sendTransaction({
        code: createAuctionTransactionWithNFT.replace('RoyaltyVariable', commission),
        args: [
          ...auctionParameters,
          // Link to NFT
          ["xxx", t.String],
          // name
          ["xxx", t.String],
          // author
          ["xxx", t.String],
          // description
          ["xxx", t.String],
          // Number of copy in one edition
          [1, t.UInt64],
        ],
        signers: [admin],
      });

      const { events } = createdAuctionWithNFT;

      // Id of created auction
      const auctionId = events[0].data.auctionID;

      await new Promise((r) => setTimeout(r, 3000));

      // Sample transaction to change last block time
      await sendTransaction({
        code: tickTransaction,
        args: [],
        signers: [admin],
      });

      // First settle
      await sendTransaction({
        code: settleAuctionTransaction,
        args: [
          [auctionId, t.UInt64]
        ],
        signers: [admin],
      });

      // Second settle
      const result = await sendTransaction({
        code: settleAuctionTransaction,
        args: [
          [auctionId, t.UInt64]
        ],
        signers: [admin],
      });

      expect(result).toEqual(null);
    } catch (e) {
      expect(e).toMatch(/The auction has been already settled/);
    }
  });

  test("check events, when auction was settled without bids", async () => {
    try {
      const admin = await getAccountAddress("admin");

      const auctionParameters = [
        // Min bid increment in percent
        ["10.00", t.UFix64],
        // Initial auction length  
        ["1.00", t.UFix64],
        // Time until finish, when auction could be extended
        ["120.00", t.UFix64],
        // Time lenght to extend auction
        ["120.00", t.UFix64],
        // Start time
        [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
        // Initial price
        ["50.00", t.UFix64],
        // Platform vault address
        ["0x01cf0e2f2f715450", t.Address]
      ];

      const createdAuctionWithNFT = await sendTransaction({
        code: createAuctionTransactionWithNFT.replace('RoyaltyVariable', commission),
        args: [
          ...auctionParameters,
          // Link to NFT
          ["xxx", t.String],
          // name
          ["xxx", t.String],
          // author
          ["xxx", t.String],
          // description
          ["xxx", t.String],
          // Number of copy in one edition
          [1, t.UInt64],
        ],
        signers: [admin],
      });

      const { events } = createdAuctionWithNFT;

      // Id of created auction
      const auctionId = events[0].data.auctionID;

      // timeout to start auction
      await new Promise((r) => setTimeout(r, 3000));

      // Sample transaction to change last block time
      await sendTransaction({
        code: tickTransaction,
        args: [],
        signers: [admin],
      });

      // Settle
      const result = await sendTransaction({
        code: settleAuctionTransaction,
        args: [
          [auctionId, t.UInt64]
        ],
        signers: [admin],
      });

      const { events: setlleEvents } = result;

      // Only two events
      expect(setlleEvents.length).toEqual(2);

      // 1. Burn NFT
      expect(setlleEvents[0].type).toEqual(`A.${admin.substr(2)}.Auction.BurnNFT`);

      // 2. Auction settle
      expect(setlleEvents[1].type).toEqual(`A.${admin.substr(2)}.Auction.Settled`);

    } catch (e) {
      expect(e).toEqual('');
    }
  });

  test("check events, when auction was settled with bids", async () => {
    try {
      const admin = await getAccountAddress("admin");
      const second = await getAccountAddress("second");
      const third = await getAccountAddress("third");

      const auctionParameters = [
        // Min bid increment in percent
        ["10.00", t.UFix64],
        // Initial auction length  
        ["4.00", t.UFix64],
        // Time until finish, when auction could be extended
        ["0.01", t.UFix64],
        // Time lenght to extend auction
        ["0.01", t.UFix64],
        // Start time
        [(new Date().getTime() / 1000 + 1).toFixed(2), t.UFix64],
        // Initial price
        ["50.00", t.UFix64],
        // Platform vault address
        ["0x01cf0e2f2f715450", t.Address]
      ];

      const createdAuctionWithNFT = await sendTransaction({
        code: createAuctionTransactionWithNFT.replace('RoyaltyVariable', commission),
        args: [
          ...auctionParameters,
          // Link to NFT
          ["xxx", t.String],
          // name
          ["xxx", t.String],
          // author
          ["xxx", t.String],
          // description
          ["xxx", t.String],
          // Number of copy in one edition
          [1, t.UInt64],
        ],
        signers: [admin],
      });

      const { events } = createdAuctionWithNFT;

      // Id of created auction
      const auctionId = events[0].data.auctionID;

      // timeout to start auction
      await new Promise((r) => setTimeout(r, 2000));

      // Sample transaction to change last block time
      await sendTransaction({
        code: tickTransaction,
        args: [],
        signers: [admin],
      });

      // Bid from the second account
      await sendTransaction({
        code: placeBidTransaction,
        args: [
          // Auction id     
          [auctionId, t.UInt64],
          // Bid amount
          ["50.00", t.UFix64],
          // Platform address
          [admin, t.Address],
        ],
        signers: [second],
      });

      await new Promise((r) => setTimeout(r, 3000));

      // Sample transaction to change last block time
      await sendTransaction({
        code: tickTransaction,
        args: [],
        signers: [admin],
      });

      // Settle
      const result = await sendTransaction({
        code: settleAuctionTransaction,
        args: [
          [auctionId, t.UInt64]
        ],
        signers: [admin],
      });

      const { events: setlleEvents } = result;

      const auction = await executeScript({
        code: checkAuctionStatusScript,
        args: [
          [admin, t.Address],
          [events[0].data.auctionID, t.UInt64],
        ]
      });

      const { leader } = auction;

      const earnedAuctionEvents = setlleEvents.filter(event => event.type === `A.${admin.substr(2)}.Auction.Earned`);
      const collectibelDepositEvents = setlleEvents.filter(event => event.type === `A.${admin.substr(2)}.Collectible.Deposit`);
      const settleAuctionEvents = setlleEvents.filter(event => event.type === `A.${admin.substr(2)}.Auction.Settled`);

      // Deposit collectible to winner. In case of finished auction is leader
      expect(collectibelDepositEvents[0].data.to).toEqual(leader);

      // Settle auction event
      expect(settleAuctionEvents[0].data.auctionID).toEqual(auctionId);

      // Count of earned events is 2, because in commission object we have 2 recipient of commission
      expect(earnedAuctionEvents.length).toBe(2);

    } catch (e) {
      expect(e).toEqual('');
    }
  });
})
