import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, mintFlow, getAccountAddress, init, emulator, deployContractByName, executeScript  } from "flow-js-testing";

export const testSuiteExtendAuction = () => describe("Auction extend", () => {
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
          ["500.00",t.UFix64], [admin, t.Address]
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
              ["500.00",t.UFix64], [second, t.Address]
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
              ["500.00",t.UFix64], [third, t.Address]
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
 
  test("not extend auction after bid, because time until finish more than remainLengthToExtend", async () => { 
    let error;
    try {
        const admin = await getAccountAddress("admin");  
        const extendedLength = 120;

        const auctionParameters = [
            // Min bid increment in percent
            ["10.00", t.UFix64],  
            // Initial auction length  
            ["1000.00", t.UFix64],               
            // Time until finish, when auction could be extended
            ["120.00", t.UFix64],  
            // Time lenght to extend auction
            [extendedLength.toFixed(2), t.UFix64],               
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

        const auctionId = events[0].data.auctionID;

        await new Promise((r) => setTimeout(r, 3000));

        // Write the last block to change time
        await sendTransaction({
            code: tickTransaction,
            args: [], 
            signers: [admin],
        }); 

        const auctionBeforeBid = await executeScript({
            code: checkAuctionStatusScript,
            args: [
              [admin, t.Address],
              [events[0].data.auctionID, t.UInt64],
            ] 
        });

        // Bid
        await sendTransaction({
            code: placeBidTransaction,
            args: [      
              [auctionId, t.UInt64],
              ["50.00", t.UFix64],
              [admin, t.Address],   
            ], 
            signers: [admin],
        });   

        const auctionAfterBid = await executeScript({
            code: checkAuctionStatusScript,
            args: [
              [admin, t.Address],
              [events[0].data.auctionID, t.UInt64],
            ] 
        });

        expect(auctionBeforeBid.currentLength).toEqual(auctionAfterBid.currentLength);
    } catch(e) {
      error = e;     
    }      
      expect(error).toEqual(undefined);
  });

  test("extend auction after bid, because time until finish less than remainLengthToExtend", async () => { 
    let error;
    try {
        const admin = await getAccountAddress("admin");  
        const extendedLength = 120;

        const auctionParameters = [
            // Min bid increment in percent
            ["10.00", t.UFix64],  
            // Initial auction length  
            ["100.00", t.UFix64],               
            // Time until finish, when auction could be extended
            ["120.00", t.UFix64],  
            // Time lenght to extend auction
            [extendedLength.toFixed(2), t.UFix64],               
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

        const auctionId = events[0].data.auctionID;

        await new Promise((r) => setTimeout(r, 3000));
        
        // Write the last block to change time
        await sendTransaction({
            code: tickTransaction,
            args: [], 
            signers: [admin],
        }); 

        const auctionBeforeBid = await executeScript({
            code: checkAuctionStatusScript,
            args: [
              [admin, t.Address],
              [events[0].data.auctionID, t.UInt64],
            ] 
        });

        await sendTransaction({
            code: placeBidTransaction,
            args: [      
              [auctionId, t.UInt64],
              ["50.00", t.UFix64],
              [admin, t.Address],   
            ], 
            signers: [admin],
        });   

        const auctionAfterBid = await executeScript({
            code: checkAuctionStatusScript,
            args: [
              [admin, t.Address],
              [events[0].data.auctionID, t.UInt64],
            ] 
        });

        expect(parseInt(auctionBeforeBid.currentLength, 10) + extendedLength).toEqual(parseInt(auctionAfterBid.currentLength, 10));
      } catch(e) {
        error = e;     
      }      
        expect(error).toEqual(undefined);
  });
})
