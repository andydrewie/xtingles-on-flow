import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, mintFlow, getAccountAddress, init, emulator, deployContractByName  } from "flow-js-testing";
import { ZERO_UFIX64, defaultAuctionParameters } from "./constants";

export const testSuiteAddNFT = () => describe("Auction add NFT", () => {
  let createAuctionTransaction,
      addNFTInAuctionTransaction,
      createAuctionTransactionWithNFT,
      checkAuctionStatusScript,
      createEditionTransaction,
      setupFUSDTransaction,
      mintFUSDTransaction,
      commission;

  beforeAll(() => {
    init(path.resolve(__dirname, "../"));   
    jest.setTimeout(120000);

    createAuctionTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/auctionV2/CreateAuction.cdc`
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

    mintFUSDTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/MintFUSD.cdc`
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

    addNFTInAuctionTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/auctionV2/AddNFTInAuction.cdc`
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
    
    createAuctionTransactionWithNFT = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/auctionV2/CreateAuctionWithNFT.cdc`
      ),
      "utf8"    
    );

    createEditionTransaction = fs.readFileSync(
      path.join(
          __dirname,
          `../../transactions/emulator/CreateEdition.cdc`
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
    await deployContractByName({ to: admin, name: "AuctionV2", addressMap });

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

    // Create the common edition infromation for all copies of the item
    await sendTransaction({
        code: createEditionTransaction.replace('RoyaltyVariable', commission),
        args: [[1, t.UInt64]], 
        signers: [admin],
    });  
    
		done();
	});

  // Stop emulator, so it could be restarted
	afterEach(async (done) => {
		await emulator.stop();
		done();
	});
  
  test("addNFT throws error, when auction does not exist", async () => { 
    let error;
    try {
      const admin = await getAccountAddress("admin");
      await sendTransaction({
        code: addNFTInAuctionTransaction,
        args: [      
          [999, t.UInt64],
          ["50.00", t.String],
          ["50.00", t.String],
          ["50.00", t.String],
          ["50.00", t.String],
        ], 
        signers: [admin],
      }); 
    } catch(e) {
      error = e;
    } 
    expect(error).toMatch(/Auction does not exist/);  
  });

  test("addNFT throws error, when NFT in auction has already existed", async () => { 
    let error;
    try {
      const admin = await getAccountAddress("admin");
      const auctionParameters = [...defaultAuctionParameters];
      
      // Start bid time 
      auctionParameters[5] = ZERO_UFIX64;

      const result = await sendTransaction({
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

      const { events } = result;
  
      await sendTransaction({
        code: addNFTInAuctionTransaction,
        args: [      
          [events[0].data.auctionID, t.UInt64],
          ["50.00", t.String],
          ["50.00", t.String],
          ["50.00", t.String],
          ["50.00", t.String],
        ], 
        signers: [admin],
      }); 
    } catch(e) {
      error = e;
    } 
    expect(error).toMatch(/NFT in auction has already existed/);  
  });

  test("addNFT check events", async () => { 
    let error;
    try {
      const admin = await getAccountAddress("admin"); 

      const auctionParameters = [...defaultAuctionParameters];  

      // Start bid time 
      auctionParameters[5] = ZERO_UFIX64;

      const createdAuction = await sendTransaction({
        code: createAuctionTransaction,
        args: auctionParameters, 
        signers: [admin],
      }); 

      const { events } = createdAuction;

      const result = await sendTransaction({
        code: addNFTInAuctionTransaction,
        args: [      
          [events[0].data.auctionID, t.UInt64],
          ["50.00", t.String],
          ["50.00", t.String],
          ["50.00", t.String],
          ["50.00", t.String],
        ], 
        signers: [admin],
      }); 

      const { events: eventsAddNFT } = result;

      expect(eventsAddNFT[1].type).toEqual(`A.${admin.substr(2)}.AuctionV2.AddNFT`); 

      expect(eventsAddNFT[1].data.auctionID).toEqual(events[0].data.auctionID);
    } catch(e) {
      error = e;
    } 
    expect(error).toEqual(undefined);  
  });
})