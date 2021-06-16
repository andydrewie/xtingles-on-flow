import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, mintFlow, getAccountAddress, init, emulator, deployContractByName, executeScript  } from "flow-js-testing";
import { ZERO_UFIX64, defaultAuctionParameters } from "../constants";

export const testSuiteExtendAuction = () => describe("Extend auction", () => {
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
        ["500.00",t.UFix64], [admin, t.Address]
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

        expect(auctionBeforeBid.currentLength).toEqual(auctionAfterBid.currentLength);
    } catch(e) {
      console.log(e);
      expect(e).toEqual('');
    }      
  });

  test("extend auction after bid, because time until finish less than remainLengthToExtend", async () => { 
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
            // Min bid increment in percent
            ["10.00", t.UFix64],  
            // Initial auction length  
            ["100.00", t.UFix64],               
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

        expect(parseInt(auctionBeforeBid.currentLength, 10) + 120).toEqual(parseInt(auctionAfterBid.currentLength, 10));
    } catch(e) {
      console.log(e);
      expect(e).toEqual('');
    }      
  });
})
