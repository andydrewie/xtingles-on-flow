import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, executeScript, mintFlow, getAccountAddress, init, emulator, deployContractByName  } from "flow-js-testing";
import { ZERO_UFIX64, defaultAuctionParameters } from "./constants";

export const testSuiteCreateAuction = () => describe("Auction create", () => {
  let createAuctionTransaction, checkAuctionStatusScript, setupFUSDTransaction; 

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

    checkAuctionStatusScript = fs.readFileSync(
      path.join(
        __dirname,
        `../../scripts/emulator/auctionV2/CheckAuctionStatus.cdc`
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
    
    await deployContractByName({ to: admin, name: "NonFungibleToken" });    
    await deployContractByName({ to: admin, name: "FUSD" }); 
    await deployContractByName({ to: admin, name: "Edition" });
    await deployContractByName({ to: admin, name: "Collectible", addressMap });
    await deployContractByName({ to: admin, name: "AuctionV2", addressMap });
		done();
	});

	// Stop emulator, so it could be restarted
	afterEach(async (done) => {
		await emulator.stop();
		done();
	});
 
  test("createAuction throws panic, when bid increment is 0.00", async () => { 
    let error;
    try {
      const admin = await getAccountAddress("admin");
      const auctionParameters = [...defaultAuctionParameters];
      auctionParameters[0] = ZERO_UFIX64;
      await sendTransaction({
        code: createAuctionTransaction,
        args: auctionParameters, 
        signers: [admin],
      }); 
    } catch(e) {
      error = e;
    } 
    expect(error).toMatch(/Minimum bid increment should be more than 0.00/);  
  });

  test("createAuction throws panic, when auction length is 0.00", async () => { 
    let error;
    try {
      const admin = await getAccountAddress("admin");
      const auctionParameters = [...defaultAuctionParameters];
      auctionParameters[1] = ZERO_UFIX64;
      await sendTransaction({
        code: createAuctionTransaction,
        args: auctionParameters, 
        signers: [admin],
      }); 
    } catch(e) {
      error = e;
    } 
    expect(error).toMatch(/Auction lenght should be more than 0.00/);  
  });

  test("createAuction throws panic, when start time in the past", async () => { 
    let error;
    try {
      const admin = await getAccountAddress("admin");
      const auctionParameters = [...defaultAuctionParameters];
      auctionParameters[4] = ["1623417982.00", t.UFix64];  
      await sendTransaction({
        code: createAuctionTransaction,
        args: auctionParameters, 
        signers: [admin],
      }); 
    } catch(e) {
      error = e;
    } 
    expect(error).toMatch(/(Auction start time can't be in the past)/);  
  });

  test("createAuction throws panic, when start price is 0.00", async () => { 
    let error;
    try {
      const admin = await getAccountAddress("admin");
      const auctionParameters = [...defaultAuctionParameters];
      auctionParameters[6] = ZERO_UFIX64;
      await sendTransaction({
        code: createAuctionTransaction,
        args: auctionParameters, 
        signers: [admin],
      }); 
    } catch(e) {
      error = e;
    } 
    expect(error).toMatch(/Start price should be more than 0.00/);  
  });

  test("createAuction throws panic, when start price is more than 999999.99", async () => { 
    let error;
    try {
      const admin = await getAccountAddress("admin");
      const auctionParameters = [...defaultAuctionParameters];
      const extraPrice = 1000000;
      auctionParameters[6] = [extraPrice.toFixed(2), t.UFix64];
      await sendTransaction({
        code: createAuctionTransaction,
        args: auctionParameters, 
        signers: [admin],
      }); 
    } catch(e) {
      error = e;
    } 
    expect(error).toMatch(/Start bid should be less than 1 000 000.00/);  
  });

  test("createAuction throws panic, when start bid time and auction start time are more than 0.0 both", async () => { 
    let error;
    try {
      const admin = await getAccountAddress("admin");   
      await sendTransaction({
        code: setupFUSDTransaction,
        args: [], 
        signers: [admin],
      }); 

      await sendTransaction({
        code: createAuctionTransaction,
        args: defaultAuctionParameters, 
        signers: [admin],
      }); 
    } catch(e) {
      error = e;
    } 
    expect(error).toMatch(/Start bid time and auction start time can't be more than 0.0 both/);
  });

  test("createAuction throws panic, when start bid time and auction start time are 0.0 both", async () => { 
    let error;
    try {
      const auctionParameters = [...defaultAuctionParameters];
      const admin = await getAccountAddress("admin");   
      await sendTransaction({
        code: setupFUSDTransaction,
        args: [], 
        signers: [admin],
      }); 
      
      // Start time 
      auctionParameters[4] = ZERO_UFIX64;

      // Start bid time 
      auctionParameters[5] = ZERO_UFIX64;

      await sendTransaction({
        code: createAuctionTransaction,
        args: auctionParameters, 
        signers: [admin],
      }); 

    } catch(e) {
      error = e;
    } 
    expect(error).toMatch(/Start bid time and auction start time can't equal 0.0 both/);
  });

  test("createAuction throws panic, when start bid time in the past", async () => { 
    let error;
    try {
      const auctionParameters = [...defaultAuctionParameters];
      const admin = await getAccountAddress("admin");   
      await sendTransaction({
        code: setupFUSDTransaction,
        args: [], 
        signers: [admin],
      }); 
      
      // Start time 
      auctionParameters[4] = ZERO_UFIX64;

      // Start bid time 
      auctionParameters[5] = ["1623417982.00", t.UFix64];  

      await sendTransaction({
        code: createAuctionTransaction,
        args: auctionParameters, 
        signers: [admin],
      }); 

    } catch(e) {
      error = e;
    } 
    expect(error).toMatch(/Auction start bid time can't be in the past/);
  });

  test("createAuction check events when start time is 0.0", async () => { 
    let error;
    const auctionParameters = [...defaultAuctionParameters];
    try {
      const admin = await getAccountAddress("admin");   
      await sendTransaction({
        code: setupFUSDTransaction,
        args: [], 
        signers: [admin],
      }); 

      // Start time 
      auctionParameters[4] = ZERO_UFIX64;

      const result = await sendTransaction({
        code: createAuctionTransaction,
        args: auctionParameters, 
        signers: [admin],
      }); 

      const { events } = result;

      const auction = await executeScript({
        code: checkAuctionStatusScript,
        args: [
          [admin, t.Address],
          [events[0].data.auctionID, t.UInt64],
        ] 
      });

      expect(events[0].type).toEqual(`A.${admin.substr(2)}.AuctionV2.Created`);

      expect(events[0].data).toMatchObject({   
        owner: admin,
      }); 
      
      const { startTime } = events[0].data;

      expect(parseInt(startTime, 10)).toEqual(0);

      expect(auction).toMatchObject({
          id: events[0].data.auctionID,         
          bids: 0,
          active: true,         
          metadata: null,
          collectibleId: null,
          leader: null,       
          completed: false,
          expired: false,
          cancelled: false
      });   

    } catch(e) {
      error = e;
    } 
    expect(error).toEqual(undefined);
  });

  test("createAuction check events when start bid time is 0.0", async () => { 
    let error;
    const auctionParameters = [...defaultAuctionParameters];
    try {
      const admin = await getAccountAddress("admin");   
      await sendTransaction({
        code: setupFUSDTransaction,
        args: [], 
        signers: [admin],
      }); 

      // Start bid time 
      auctionParameters[5] = ZERO_UFIX64;

      const result = await sendTransaction({
        code: createAuctionTransaction,
        args: auctionParameters, 
        signers: [admin],
      }); 

      const { events } = result;

      const auction = await executeScript({
        code: checkAuctionStatusScript,
        args: [
          [admin, t.Address],
          [events[0].data.auctionID, t.UInt64],
        ] 
      });

      expect(events[0].type).toEqual(`A.${admin.substr(2)}.AuctionV2.Created`);

      expect(events[0].data).toMatchObject({   
        owner: admin,
      }); 
      
      const { startBidTime } = events[0].data;

      expect(parseInt(startBidTime, 10)).toEqual(0);

      expect(auction).toMatchObject({
          id: events[0].data.auctionID,         
          bids: 0,
          active: true,         
          metadata: null,
          collectibleId: null,
          leader: null,       
          completed: false,
          expired: false,
          cancelled: false
      });   

    } catch(e) {
      error = e;
    } 
    expect(error).toEqual(undefined);
  });

})
