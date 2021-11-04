import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import {
  sendTransaction, mintFlow, getAccountAddress,
  init, emulator, deployContractByName, executeScript
} from "flow-js-testing";

export const testSuiteReclaimSendNFT = () => describe("Auction reclaim send NFT", () => {
  let placeBidTransaction,
    createAuctionTransactionWithNFT,
    setupFUSDTransaction,
    tickTransaction,
    mintFUSDTransaction,
    cancelAuctionTransaction,
    createAuctionTransaction,
    checkAuctionStatusScript,
    settleAuctionTransaction,
    unlinkCollectible,
    commission,
    reclaimSendNFTTransaction,
    setupNFTStorage;

  beforeAll(async () => {
    jest.setTimeout(120000);
    init(path.resolve(__dirname, "../"));

    createAuctionTransactionWithNFT = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/auctionV2/CreateAuctionWithNFT.cdc`
      ),
      "utf8"
    );

    placeBidTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/auctionV2/Bid.cdc`
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
        `../../transactions/emulator/auctionV2/CancelAuction.cdc`
      ),
      "utf8"
    );

    settleAuctionTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/auctionV2/SettleAuction.cdc`
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
        `../../transactions/emulator/auctionV2/CreateAuction.cdc`
      ),
      "utf8"
    );

    checkAuctionStatusScript = fs.readFileSync(
      path.join(
        __dirname,
        `../../scripts/emulator/auctionV2/CheckAuctionStatus.cdc`
      ),
      "utf8"
    );

    unlinkCollectible = fs.readFileSync(
      path.join(
          __dirname,
          `../../transactions/emulator/UnlinkCollectible.cdc`
      ),
      "utf8"
    ); 

    reclaimSendNFTTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/auctionV2/ReclaimSendNFT.cdc`
      ),
      "utf8"
    );

    setupNFTStorage = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/SetupNFTStorage.cdc`
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
      Address(${third}) : Edition.CommissionStructure(
          firstSalePercent: 99.00,
          secondSalePercent: 6.00,
          description: "xxx"
      )          
    }`;

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
    await deployContractByName({ to: admin, name: "AuctionV2", addressMap });

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

    done();
  });

  // Stop emulator, so it could be restarted
  afterEach(async (done) => {
    await emulator.stop();
    done();
  });

  test("reclaimSendNFT throws error, when auction doesn't ", async () => {
    let error;
    try {
      const admin = await getAccountAddress("admin");
      const second = await getAccountAddress("second");   
      const nonExistedAuction = 1;   

      // Reclaim send NFT
      const result = await sendTransaction({
        code: reclaimSendNFTTransaction,
        args: [
          // Auction id     
          [nonExistedAuction, t.UInt64],
          // Recipient
          [second, t.Address],
        ],
        signers: [admin],
      });

      expect(result).toEqual('');

    } catch (e) {
      error = e;
    }
    expect(error).toMatch(/Auction does not exist/);
  }); 

  test("reclaimSendNFT throws error, when auction is not settled", async () => {
    let error;
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
        // Start bid time
        ["0.00", t.UFix64], 
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

      // Reclaim send NFT
      const resultReclaim = await sendTransaction({
        code: reclaimSendNFTTransaction,
        args: [
          // Auction id     
          [auctionId, t.UInt64],
          // Recipient
          [second, t.Address],
        ],
        signers: [admin],
      });

      expect(result).toEqual('');

    } catch (e) {
      error = e;
    }
    expect(error).toMatch(/The auction has not been settled yet/);
  });

  test("reclaimSendNFT throws error, when NFT in auction does not exist", async () => {
    let error;
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
        // Start bid time
        ["0.00", t.UFix64], 
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
       await sendTransaction({
        code: settleAuctionTransaction,
        args: [
          [auctionId, t.UInt64]
        ],
        signers: [admin],
      });

      // Reclaim send NFT
      const resultReclaim = await sendTransaction({
        code: reclaimSendNFTTransaction,
        args: [
          // Auction id     
          [auctionId, t.UInt64],
          // Recipient
          [second, t.Address],
        ],
        signers: [admin],
      });

      expect(result).toEqual('');

    } catch (e) {
      error = e;
    }
    expect(error).toMatch(/NFT in auction does not exist/);
  });

  test("reclaimSendNFT check events", async () => {
    let error;
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
        // Start bid time
        ["0.00", t.UFix64], 
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

      // Unlink the NFT storage of the second account
      await sendTransaction({
          code: unlinkCollectible,
          args: [], 
          signers: [second],
      }); 

      // Settle
      const resultSettle = await sendTransaction({
        code: settleAuctionTransaction,
        args: [
          [auctionId, t.UInt64]
        ],
        signers: [admin],
      });

      const { events: setlleEvents } = resultSettle;

      // Setup NFT storage for the thrid account
      await sendTransaction({
        code: setupNFTStorage,
        args: [], 
        signers: [third],
      }); 

      // Reclaim send NFT
      const resultReclaim = await sendTransaction({
        code: reclaimSendNFTTransaction,
        args: [
          // Auction id     
          [auctionId, t.UInt64],
          // Recipient
          [third, t.Address],
        ],
        signers: [admin],
      });

      const { events: reclaimEvents } = resultReclaim;
  
      const collectibleDepositEventsFirst = setlleEvents.filter(event => event.type === `A.${admin.substr(2)}.Collectible.Deposit`);
      const burnNFTEvents = setlleEvents.filter(event => event.type === `A.${admin.substr(2)}.AuctionV2.BurnNFT`); 

      // There are no events to deposit NFT to leader
      expect(collectibleDepositEventsFirst.length).toEqual(0);
      
      // This event is burn NFT
      expect(burnNFTEvents.length).toEqual(0);

      const collectibleDepositEventsSecond = reclaimEvents.filter(event => event.type === `A.${admin.substr(2)}.Collectible.Deposit`);
      const sendNFTEvents = reclaimEvents.filter(event => event.type === `A.${admin.substr(2)}.AuctionV2.SendNFT`); 

      // There is to deposit NFT to winner
      expect(collectibleDepositEventsSecond.length).toEqual(1);
      
      // This event is send NFT
      expect(sendNFTEvents.length).toEqual(1);

      // 1. Send NFT to winner
      expect(collectibleDepositEventsSecond[0].type).toEqual(`A.${admin.substr(2)}.Collectible.Deposit`);
      expect(collectibleDepositEventsSecond[0].data.to).toEqual(third);

      // 2. Send NFT to winner
      expect(sendNFTEvents[0].type).toEqual(`A.${admin.substr(2)}.AuctionV2.SendNFT`);
      expect(sendNFTEvents[0].data.to).toEqual(third);

    } catch (e) {
      error = e;
    }
    expect(error).toEqual(undefined);
  }); 
})
