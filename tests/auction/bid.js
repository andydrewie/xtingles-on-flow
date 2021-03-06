import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, mintFlow, getAccountAddress, init, emulator, deployContractByName, executeScript } from "flow-js-testing";
import { defaultAuctionParameters } from "./constants";

export const testSuiteBidAuction = () => describe("Auction bid", () => {
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
    placeBidWithoutNFTStorageTransaction,
    bidWithFakeReturnVaultCapTransaction,
    bidWithVaultAndCollectionStorageDifferentOwner,
    commission;

  beforeAll(async () => {
    jest.setTimeout(120000);
    init(path.resolve(__dirname, "../"));

    createAuctionTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/auction/CreateAuction.cdc`
      ),
      "utf8"
    );

    createAuctionTransactionWithNFT = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/auction/CreateAuctionWithNFT.cdc`
      ),
      "utf8"
    );

    checkAuctionStatusScript = fs.readFileSync(
      path.join(
        __dirname,
        `../../scripts/emulator/auction/CheckAuctionStatus.cdc`
      ),
      "utf8"
    );

    placeBidTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/auction/Bid.cdc`
      ),
      "utf8"
    );


    placeBidWithoutNFTStorageTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/auction/BidWithoutNFTStorage.cdc`
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
        `../../transactions/emulator/auction/CancelAuction.cdc`
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

    bidWithFakeReturnVaultCapTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/auction/BidWithFakeReturnVaultCap.cdc`
      ),
      "utf8"
    );

    bidWithVaultAndCollectionStorageDifferentOwner = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/auction/BidWithVaultAndCollectionStorageDifferentOwner.cdc`
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

    commission = `{
      Address(${second}) : Edition.CommissionStructure(
          firstSalePercent: 1.00,
          secondSalePercent: 5.00,
          description: "xxx"
      ),
      Address(${admin}) : Edition.CommissionStructure(
          firstSalePercent: 99.00,
          secondSalePercent: 6.00,
          description: "xxx"
      )          
    }`;

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
        ["10000000.00", t.UFix64], [admin, t.Address]
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

  test("throw error, when auction does not exists", async () => {
    let error;
    try {

      const admin = await getAccountAddress("admin");

      const result = await sendTransaction({
        code: placeBidTransaction,
        args: [
          // Auction id, which does not exist
          [999, t.UInt64],
          // Bid Amount
          ["50.00", t.UFix64],
          // Address storage, where auction stores
          [admin, t.Address],
        ],
        signers: [admin],
      });

      expect(result).toEqual(null);

    } catch (e) {
      error = e;
    }

    expect(error).toMatch(/Auction does not exist in this drop/);
  });

  test("throw error, when NFT does not exist in auction", async () => {
    let error;
    try {
      const admin = await getAccountAddress("admin");

      const createdAuction = await sendTransaction({
        code: createAuctionTransaction,
        args: defaultAuctionParameters,
        signers: [admin],
      });

      const { events } = createdAuction;

      const result = await sendTransaction({
        code: placeBidTransaction,
        args: [
          // Auction id
          [events[0].data.auctionID, t.UInt64],
          // Bid amount
          ["50.00", t.UFix64],
          // Address storage, where auction stores
          [admin, t.Address],
        ],
        signers: [admin],
      });

      expect(result).toEqual(null);
    } catch (e) {
      error = e;
    }
    expect(error).toMatch(/NFT in auction does not exist/);
  });

  test("placeBid throws error, when bidder provides wrong vault's capabity", async () => {
    let error;
    try {
      const admin = await getAccountAddress("admin");
      const second = await getAccountAddress("second");

      const createdAuctionWithNFT = await sendTransaction({
        code: createAuctionTransactionWithNFT.replace('RoyaltyVariable', commission),
        args: [
          ...defaultAuctionParameters,
          // link to video
          ["xxx", t.String],
          // name
          ["xxx", t.String],
          // author
          ["xxx", t.String],
          // description
          ["xxx", t.String],
          // number of copies in one edition
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

      const result = await sendTransaction({
        code: bidWithFakeReturnVaultCapTransaction,
        args: [
          // Auction id
          [events[0].data.auctionID, t.UInt64],
          // Bid amount
          ["50.00", t.UFix64],
          // Address storage, where auction stores
          [admin, t.Address],
        ],
        signers: [second],
      });

      expect(result).toEqual(null);

    } catch (e) {
      error = e;
    }
    expect(error).toMatch(/Fungible token storage is not initialized on account/);
  });

  test("placeBid throws error, when bidder does not have NFT storage", async () => {
    let error;
    try {
      const admin = await getAccountAddress("admin");
      const second = await getAccountAddress("second");
  
      const createdAuctionWithNFT = await sendTransaction({
        code: createAuctionTransactionWithNFT.replace('RoyaltyVariable', commission),
        args: [
          ...defaultAuctionParameters,
          // link to video
          ["xxx", t.String],
          // name
          ["xxx", t.String],
          // author
          ["xxx", t.String],
          // description
          ["xxx", t.String],
          // number of copies in one edition
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

      const result = await sendTransaction({
        code: placeBidWithoutNFTStorageTransaction,
        args: [
          // Auction id
          [events[0].data.auctionID, t.UInt64],
          // Bid amount
          ["50.00", t.UFix64],
          // Address storage, where auction stores
          [admin, t.Address],
        ],
        signers: [second],
      });

      expect(result).toEqual(null);

    } catch (e) {
      error = e;
    }

    expect(error).toMatch(/NFT storage is not initialized on account/);
  });

  test("placeBid throws error, when the auction has not started yet", async () => {
    let error;

    try {
      const admin = await getAccountAddress("admin");
   
      const createdAuctionWithNFT = await sendTransaction({
        code: createAuctionTransactionWithNFT.replace('RoyaltyVariable', commission),
        args: [
          ...defaultAuctionParameters,
          // link to video
          ["xxx", t.String],
          // name
          ["xxx", t.String],
          // author
          ["xxx", t.String],
          // description
          ["xxx", t.String],
          // number of copies in one edition
          [1, t.UInt64],
        ],
        signers: [admin],
      });

      const { events } = createdAuctionWithNFT;

      await sendTransaction({
        code: placeBidTransaction,
        args: [
          // Auction id
          [events[0].data.auctionID, t.UInt64],
          // Bid amount
          ["50.00", t.UFix64],
          // Address storage, where auction stores
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
    
      const auctionParameters = [
        // Min bid increment in percent
        ["10.00", t.UFix64],
        // Auction length  
        ["1.00", t.UFix64],
        // Time until finish, when auction could be extended
        ["1300.00", t.UFix64],
        // Time lenght to extend auction      
        ["1300.00", t.UFix64],
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
          // link to video
          ["xxx", t.String],
          // name
          ["xxx", t.String],
          // author
          ["xxx", t.String],
          // description
          ["xxx", t.String],
          // number of copies in one edition
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
          // Auction id
          [events[0].data.auctionID, t.UInt64],
          // Bid amount
          ["50.00", t.UFix64],
          // Address storage, where auction stores
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

  test("throw error, when vault and collection capability have different addresses", async () => {
    let error;
    try {
      const admin = await getAccountAddress("admin");
      const second = await getAccountAddress("second");
      const third = await getAccountAddress("third");

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
          // link to video
          ["xxx", t.String],
          // name
          ["xxx", t.String],
          // author
          ["xxx", t.String],
          // description
          ["xxx", t.String],
          // number of copies in one edition
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

      const result = await sendTransaction({
        code: bidWithVaultAndCollectionStorageDifferentOwner,
        args: [
          // Auction id
          [events[0].data.auctionID, t.UInt64],
          // Bid amount
          ["50.00", t.UFix64],
          // Address storage, where auction stores
          [admin, t.Address],
        ],
        signers: [third],
      });

      expect(result).toEqual(null);

    } catch (e) {
      error = e;
    }

    expect(error).toMatch(/you cannot make a bid and send the Collectible to somebody else collection/);
  });

  test("throw error, when the bid is less than min", async () => {
    let error;
    try {
      const admin = await getAccountAddress("admin");     

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

  test("throw error, when the bid is more than 999 999.99", async () => {
    let error;
    try {
      const admin = await getAccountAddress("admin");    
      
      const extraBid = 1000000;

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
          [extraBid.toFixed(2), t.UFix64],
          [admin, t.Address],
        ],
        signers: [admin],
      });

    } catch (e) {
      error = e;
    }
    expect(error).toMatch(/Bid should be less than 1 000 000.00/);
  });

  test("successfull bid case", async () => {
    let error;
    try {
      const admin = await getAccountAddress("admin");   

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
