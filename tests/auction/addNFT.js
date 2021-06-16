import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, mintFlow, getAccountAddress, init, emulator, deployContractByName  } from "flow-js-testing";
import { defaultAuctionParameters } from "../constants";

export const testSuiteAddNFT = () => describe("Add NFT", () => {
  let createAuctionTransaction,
      addNFTInAuctionTransaction,
      setupFUSDTransaction,
      createAuctionTransactionWithNFT; 

  beforeAll(() => {
    init(path.resolve(__dirname, "../"));   
    jest.setTimeout(30000);

    createAuctionTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/CreateAuction.cdc`
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

    checkAuctionStatusScript = fs.readFileSync(
      path.join(
        __dirname,
        `../../scripts/emulator/CheckAuctionStatus.cdc`
      ),
      "utf8"    
    );

    addNFTInAuctionTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/AddNFTInAuction.cdc`
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
    
    createAuctionTransactionWithNFT = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/CreateAuctionWithNFT.cdc`
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
		done();
	});

  // Stop emulator, so it could be restarted
	afterEach(async (done) => {
		await emulator.stop();
		done();
	});

  
  test("Auction doesn't exist", async () => { 
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

  test("throw error, when NFT in auction has already existed", async () => { 
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
      await sendTransaction({
        code: setupFUSDTransaction,
        args: [], 
        signers: [admin],
      }); 
      const result = await sendTransaction({
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

  test("Add NFT in Auction", async () => { 
    try {
      const admin = await getAccountAddress("admin");   
      await sendTransaction({
        code: setupFUSDTransaction,
        args: [], 
        signers: [admin],
      }); 

      const createdAuction = await sendTransaction({
        code: createAuctionTransaction,
        args: defaultAuctionParameters, 
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

      expect(eventsAddNFT[1].type).toEqual(`A.${admin.substr(2)}.Auction.AddNFT`); 

      expect(eventsAddNFT[1].data.auctionID).toEqual(events[0].data.auctionID);
    } catch(e) {
     console.error(e)
    } 
  });
})