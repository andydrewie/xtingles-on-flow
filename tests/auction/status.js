import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import {
  sendTransaction, mintFlow, getAccountAddress,
  init, emulator, deployContractByName, executeScript
} from "flow-js-testing";

export const testSuiteAuctionStatus = () => describe("Auction status", () => {
  let placeBidTransaction,
    createAuctionTransactionWithNFT,
    setupFUSDTransaction,
    tickTransaction,
    mintFUSDTransaction,
    cancelAuctionTransaction,
    createAuctionTransaction,
    checkAuctionStatusScript,
    settleAuctionTransaction,
    checkAuctionStatusesScript,
    getAuctionTimeLeft,
    commission;


  beforeAll(async () => {
    jest.setTimeout(120000);
    init(path.resolve(__dirname, "../"));

    createAuctionTransactionWithNFT = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/auction/CreateAuctionWithNFT.cdc`
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

    settleAuctionTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/auction/SettleAuction.cdc`
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
        `../../transactions/emulator/auction/CreateAuction.cdc`
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

    checkAuctionStatusesScript = fs.readFileSync(
      path.join(
        __dirname,
        `../../scripts/emulator/auction/CheckAuctionStatuses.cdc`
      ),
      "utf8"
    );

    getAuctionTimeLeft = fs.readFileSync(
      path.join(
        __dirname,
        `../../scripts/emulator/auction/GetAuctionTimeLeft.cdc`
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

    test("getAuctionStatus return nil, when auction does not exist", async () => {
        let error;
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

            const auction = await executeScript({
                code: checkAuctionStatusScript,
                args: [
                    [admin, t.Address],
                    // Auction id does not exist
                    [999, t.UInt64],
                ]
            });

            expect(auction).toEqual(null);

        } catch (e) {           
          error = e;
        }
        expect(error).toEqual(undefined);
    });

    test("getTimeLeft return nil, when auction does not exist", async () => {
      let error;
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

          const auction = await executeScript({
              code: getAuctionTimeLeft,
              args: [
                  [admin, t.Address],
                  // Auction id does not exist
                  [999, t.UInt64],
              ]
          });

          expect(auction).toEqual(null);

      } catch (e) {           
         error = e;
      } 
      expect(error).toEqual(undefined);
    });

    test("getTimeLeft return positive value if auction does not expire", async () => {
      let error;
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
      
          const createdAuction = await sendTransaction({
              code: createAuctionTransaction.replace('RoyaltyVariable', commission),
              args: [
                ...auctionParameters
              ],
              signers: [admin],
          });

          const { events } = createdAuction;

          await new Promise((r) => setTimeout(r, 3000));

          // Sample transaction to change last block time
          await sendTransaction({
            code: tickTransaction,
            args: [],
            signers: [admin],
          });

          const timeLeft = await executeScript({
              code: getAuctionTimeLeft,
              args: [
                  [admin, t.Address],
                  // Auction id does not exist
                  [events[0].data.auctionID, t.UInt64],
              ]
          });

          const auctionStatus = await executeScript({
            code: checkAuctionStatusScript,
            args: [
                [admin, t.Address],
                // Auction id does not exist
                [events[0].data.auctionID, t.UInt64],
            ]
          });

          expect(parseFloat(timeLeft, 10)).toBeGreaterThan(0);
          expect(auctionStatus.expired).toBeFalsy();

      } catch (e) {           
         error = e;
      } 
      expect(error).toEqual(undefined);
    });   

    test("getTimeLeft return negative value if auction expired", async () => {
      let error;
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
      
          const createdAuction = await sendTransaction({
              code: createAuctionTransaction.replace('RoyaltyVariable', commission),
              args: [
                ...auctionParameters
              ],
              signers: [admin],
          });

          const { events } = createdAuction;

          await new Promise((r) => setTimeout(r, 5000));

          // Sample transaction to change last block time
          await sendTransaction({
            code: tickTransaction,
            args: [],
            signers: [admin],
          });

          // Sample transaction to change last block time
          await sendTransaction({
            code: tickTransaction,
            args: [],
            signers: [admin],
          });

          const timeLeft = await executeScript({
              code: getAuctionTimeLeft,
              args: [
                  [admin, t.Address],
                  // Auction id does not exist
                  [events[0].data.auctionID, t.UInt64],
              ]
          });

          const auctionStatus = await executeScript({
            code: checkAuctionStatusScript,
            args: [
                [admin, t.Address],
                // Auction id does not exist
                [events[0].data.auctionID, t.UInt64],
            ]
          });

          expect(parseFloat(timeLeft, 10)).toBeLessThan(0);
          expect(auctionStatus.expired).toBe(true);

      } catch (e) {           
          error = e;
      } 
      expect(error).toEqual(undefined);
    });   
})
