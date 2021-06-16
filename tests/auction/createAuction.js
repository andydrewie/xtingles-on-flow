import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, executeScript, mintFlow, getAccountAddress, init, emulator, deployContractByName  } from "flow-js-testing";
import { ZERO_UFIX64, defaultAuctionParameters } from "../constants";

export const testSuiteCreateAuction = () => describe("Create auction", () => {
  let createAuctionTransaction, checkAuctionStatusScript, setupFUSDTransaction; 

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
 
  test("throw panic, when bid increment is 0.00", async () => { 
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

 test("Auction length is 0.00", async () => { 
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

  test("Extended length is 0.00", async () => { 
    let error;
    try {
      const admin = await getAccountAddress("admin");
      const auctionParameters = [...defaultAuctionParameters];
      auctionParameters[2] = ZERO_UFIX64;
      await sendTransaction({
        code: createAuctionTransaction,
        args: auctionParameters, 
        signers: [admin],
      }); 
    } catch(e) {
      error = e;
    } 
    expect(error).toMatch(/Extended length should be more than 0.00/);  
  });

  test("Remain length to extend is 0.00", async () => { 
    let error;
    try {
      const admin = await getAccountAddress("admin");
      const auctionParameters = [...defaultAuctionParameters];
      auctionParameters[3] = ZERO_UFIX64;
      await sendTransaction({
        code: createAuctionTransaction,
        args: auctionParameters, 
        signers: [admin],
      }); 
    } catch(e) {
      error = e;
    } 
    expect(error).toMatch(/Remain length to extend should be more than 0.00/);  
  });

  test("Start time in the past", async () => { 
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

  test("Start price is 0.00", async () => { 
    let error;
    try {
      const admin = await getAccountAddress("admin");
      const auctionParameters = [...defaultAuctionParameters];
      auctionParameters[5] = ZERO_UFIX64;
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

  test("Successfull creation auction", async () => { 
    try {
      const admin = await getAccountAddress("admin");   
      await sendTransaction({
        code: setupFUSDTransaction,
        args: [], 
        signers: [admin],
      }); 

      const result = await sendTransaction({
        code: createAuctionTransaction,
        args: defaultAuctionParameters, 
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

      expect(events[0].type).toEqual(`A.${admin.substr(2)}.Auction.Created`);

      expect(events[0].data).toMatchObject({   
        owner: admin,
        startPrice: '50.00000000',
        startTime: '5623417982.00000000'
      });     

      expect(auction).toMatchObject({
          id: events[0].data.auctionID,
          price: '0.00000000',
          bidIncrement: '10.00000000',
          bids: 0,
          active: true,
          endTime: '5623419282.00000000',
          startTime: '5623417982.00000000',
          metadata: null,
          collectibleId: null,
          leader: null,
          minNextBid: '50.00000000',
          completed: false,
          expired: false,
          cancelled: false,
          currentLenght: '1300.00000000'
      });   

    } catch(e) {
      console.error(e);
    } 
  });

})
