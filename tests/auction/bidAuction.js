import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, mintFlow, getAccountAddress, init, emulator, deployContractByName, executeScript } from "flow-js-testing";
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
    cancelAuctionTransaction,
    placeBidWithoutNFTStorageTransaction;

  beforeAll(async () => {
    jest.setTimeout(30000);
    init(path.resolve(__dirname, "../"));

    createAuctionTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/CreateAuction.cdc`
      ),
      "utf8"
    );

    createAuctionTransactionWithNFT = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/CreateAuctionWithNFT.cdc`
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

    placeBidTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/Bid.cdc`
      ),
      "utf8"
    );


    placeBidWithoutNFTStorageTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/BidWithoutNFTStorage.cdc`
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
    const second = await getAccountAddress("second");
    const third = await getAccountAddress("third");

    await mintFlow(admin, "10.0");
    await mintFlow(second, "10.0");
    await mintFlow(third, "10.0");

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

  test("throw error, when bidder does not have collection NFT storage", async () => {
    let error;
    try {
      const admin = await getAccountAddress("admin");
      const second = await getAccountAddress("second");
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
        code: placeBidWithoutNFTStorageTransaction,
        args: [
          [events[0].data.auctionID, t.UInt64],
          ["50.00", t.UFix64],
          [admin, t.Address],
        ],
        signers: [second],
      });

    } catch (e) {
      error = e;
    }

    expect(error).toMatch(/NFT storage is not initialized on account/);
  });

  test("The auction has not started yet", async () => {
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

      expect(bidEvent[0].data).toMatchObject({
        auctionID: auctionId,
        bidderAddress: admin
      })

      expect(parseFloat(bidEvent[0].data.bidPrice, 10)).toEqual(50)
    } catch (e) {
      error = e;
    }
    expect(error).toEqual(undefined);
  });

  test("check case, when the same bidder bids twice in a row and the second bid is equals min bid increment", async () => {
    let error;
    try {
      const admin = await getAccountAddress("admin");
      const second = await getAccountAddress("second");

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

      const resultFirstBid = await sendTransaction({
        code: placeBidTransaction,
        args: [
          [auctionId, t.UInt64],
          ["50.00", t.UFix64],
          [admin, t.Address],
        ],
        signers: [second],
      });

      const auction = await executeScript({
        code: checkAuctionStatusScript,
        args: [
          [admin, t.Address],
          [events[0].data.auctionID, t.UInt64],
        ]
      });

      const minBid = parseFloat(auction.minNextBid, 10) - parseFloat(auction.price, 10);

      const resultSecondBid = await sendTransaction({
        code: placeBidTransaction,
        args: [
          [auctionId, t.UInt64],
          // The current bid 
          [minBid.toFixed(2), t.UFix64],
          [admin, t.Address],
        ],
        signers: [second],
      });

      console.log(resultSecondBid);

      const bidEvent = resultSecondBid.events.filter(event => event.type === `A.${admin.substr(2)}.Auction.Bid`);

      expect(bidEvent.length).toBe(1);

    } catch (e) {
      error = e;
    }
    expect(error).toEqual(undefined);
  });

  test("throw error, when the same bidder bids twice in a row and the second bid is less than min bid increment", async () => {
    let error;
    try {
      const admin = await getAccountAddress("admin");
      const second = await getAccountAddress("second");

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

      const resultFirstBid = await sendTransaction({
        code: placeBidTransaction,
        args: [
          [auctionId, t.UInt64],
          ["50.00", t.UFix64],
          [admin, t.Address],
        ],
        signers: [second],
      });

      const auction = await executeScript({
        code: checkAuctionStatusScript,
        args: [
          [admin, t.Address],
          [events[0].data.auctionID, t.UInt64],
        ]
      });

      const minBid = parseFloat(auction.minNextBid, 10) - parseFloat(auction.price, 10);

      const resultSecondBid = await sendTransaction({
        code: placeBidTransaction,
        args: [
          [auctionId, t.UInt64],
          // The current bid 
          [(minBid - 0.01).toFixed(2), t.UFix64],
          [admin, t.Address],
        ],
        signers: [second],
      });

      const bidEvent = resultSecondBid.events.filter(event => event.type === `A.${admin.substr(2)}.Auction.Bid`);

      expect(bidEvent.length).toBe(1);

    } catch (e) {
      error = e;
    }
    expect(error).toMatch(/Bid is less than min acceptable/);
  });

  test("check min acceptable bid from the different bidder than previous", async () => {
    let error;
    try {
      const admin = await getAccountAddress("admin");
      const second = await getAccountAddress("second");
      const third = await getAccountAddress("third");

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

      const resultFirstBid = await sendTransaction({
        code: placeBidTransaction,
        args: [
          [auctionId, t.UInt64],
          ["50.00", t.UFix64],
          [admin, t.Address],
        ],
        signers: [second],
      });

      const auction = await executeScript({
        code: checkAuctionStatusScript,
        args: [
          [admin, t.Address],
          [events[0].data.auctionID, t.UInt64],
        ]
      });

      const minBid = parseFloat(auction.minNextBid, 10);

      const resultSecondBid = await sendTransaction({
        code: placeBidTransaction,
        args: [
          [auctionId, t.UInt64],
          // The current bid 
          [minBid.toFixed(2), t.UFix64],
          [admin, t.Address],
        ],
        signers: [third],
      });

      const bidEvent = resultSecondBid.events.filter(event => event.type === `A.${admin.substr(2)}.Auction.Bid`);

      expect(bidEvent.length).toBe(1);

    } catch (e) {
      error = e;
    }
    expect(error).toEqual(undefined);
  });

  test("throw error, when the bid from the different bidder is less than min acceptable", async () => {
    let error;
    try {
      const admin = await getAccountAddress("admin");
      const second = await getAccountAddress("second");
      const third = await getAccountAddress("third");

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

      const resultFirstBid = await sendTransaction({
        code: placeBidTransaction,
        args: [
          [auctionId, t.UInt64],
          ["50.00", t.UFix64],
          [admin, t.Address],
        ],
        signers: [second],
      });

      const auction = await executeScript({
        code: checkAuctionStatusScript,
        args: [
          [admin, t.Address],
          [events[0].data.auctionID, t.UInt64],
        ]
      });

      const minBid = parseFloat(auction.minNextBid, 10);

      const resultSecondBid = await sendTransaction({
        code: placeBidTransaction,
        args: [
          [auctionId, t.UInt64],
          // The current bid 
          [(minBid - 1).toFixed(2), t.UFix64],
          [admin, t.Address],
        ],
        signers: [third],
      });

      const bidEvent = resultSecondBid.events.filter(event => event.type === `A.${admin.substr(2)}.Auction.Bid`);

      expect(bidEvent.length).toBe(1);

    } catch (e) {
      error = e;
    }
    expect(error).toMatch(/Bid is less than min acceptable/);
  });
})
