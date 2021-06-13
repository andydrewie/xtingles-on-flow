import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

const EMULATOR_ACCOUNT = '0xf8d6e0586b0a20c7';
const SECOND_ACCOUNT = '0x01cf0e2f2f715450';
const THIRD_ACCOUNT = '0x179b6b1cb6755e31';
const { exec } = require('child_process');

import { sendTransaction, executeScript, init } from "flow-js-testing";
import { ZERO_UFIX64, defaultAuctionParameters } from "../constants";

export const testSuiteCreateAuction = () => describe("Create auction", () => {
  let createAuctionTransaction, checkAuctionStatusScript; 

  beforeAll(() => {
    init(path.resolve(__dirname, "../"));   

    createAuctionTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/CreateAuction.cdc`
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
  });
 
  test("Bid increment is 0.00", async () => { 
    let error;
    try {
      const auctionParameters = [...defaultAuctionParameters];
      auctionParameters[0] = ZERO_UFIX64;
      await sendTransaction({
        code: createAuctionTransaction,
        args: auctionParameters, 
        signers: [EMULATOR_ACCOUNT],
      }); 
    } catch(e) {
      error = e;
    } 
    expect(error).toMatch(/Minimum bid increment should be more than 0.00/);  
  });

  test("Auction length is 0.00", async () => { 
    let error;
    try {
      const auctionParameters = [...defaultAuctionParameters];
      auctionParameters[1] = ZERO_UFIX64;
      await sendTransaction({
        code: createAuctionTransaction,
        args: auctionParameters, 
        signers: [EMULATOR_ACCOUNT],
      }); 
    } catch(e) {
      error = e;
    } 
    expect(error).toMatch(/Auction lenght should be more than 0.00/);  
  });

  test("Extended length is 0.00", async () => { 
    let error;
    try {
      const auctionParameters = [...defaultAuctionParameters];
      auctionParameters[2] = ZERO_UFIX64;
      await sendTransaction({
        code: createAuctionTransaction,
        args: auctionParameters, 
        signers: [EMULATOR_ACCOUNT],
      }); 
    } catch(e) {
      error = e;
    } 
    expect(error).toMatch(/Extended length should be more than 0.00/);  
  });

  test("Remain length to extend is 0.00", async () => { 
    let error;
    try {
      const auctionParameters = [...defaultAuctionParameters];
      auctionParameters[3] = ZERO_UFIX64;
      await sendTransaction({
        code: createAuctionTransaction,
        args: auctionParameters, 
        signers: [EMULATOR_ACCOUNT],
      }); 
    } catch(e) {
      error = e;
    } 
    expect(error).toMatch(/Remain length to extend should be more than 0.00/);  
  });

  test("Start time in the past", async () => { 
    let error;
    try {
      const auctionParameters = [...defaultAuctionParameters];
      auctionParameters[4] = ["1623417982.00", t.UFix64];  
      await sendTransaction({
        code: createAuctionTransaction,
        args: auctionParameters, 
        signers: [EMULATOR_ACCOUNT],
      }); 
    } catch(e) {
      error = e;
    } 
    expect(error).toMatch(/(Auction start time can't be in the past)/);  
  });

  test("Start price is 0.00", async () => { 
    let error;
    try {
      const auctionParameters = [...defaultAuctionParameters];
      auctionParameters[5] = ZERO_UFIX64;
      await sendTransaction({
        code: createAuctionTransaction,
        args: auctionParameters, 
        signers: [EMULATOR_ACCOUNT],
      }); 
    } catch(e) {
      error = e;
    } 
    expect(error).toMatch(/Start price should be more than 0.00/);  
  });

  test("Successfull creation auction", async () => { 
    try {

      const result = await sendTransaction({
        code: createAuctionTransaction,
        args: defaultAuctionParameters, 
        signers: [EMULATOR_ACCOUNT],
      }); 

      const { events } = result;

      const auction = await executeScript({
        code:  checkAuctionStatusScript,
        args: [
          [EMULATOR_ACCOUNT, t.Address],
          [events[0].data.auctionID, t.UInt64],
        ] 
      });

      expect(events[0].type).toEqual('A.f8d6e0586b0a20c7.Auction.Created');

      expect(events[0].data).toMatchObject({   
        owner: '0xf8d6e0586b0a20c7',
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

 /* const tickTransaction = fs.readFileSync(
    path.join(
      __dirname,
      `../../transactions/emulator/Tick.cdc`
    ),
    "utf8"    
  );

  const checkTimeScript = fs.readFileSync(
    path.join(
      __dirname,
      `../../scripts/emulator/CheckTime.cdc`
    ),
    "utf8"    
  );   
  
  test("Start time in past", async () => {   
    await sendTransaction({
      code: tickTransaction,
      args: [], 
      signers: [EMULATOR_ACCOUNT],
    });       
    console.log(process.env.FAKETIME);
    const checkTime = await executeScript({
      code: checkTimeScript,
      args: [] 
    });
    expect(checkTime).toMatch('2016-03-23T09:56:00.000Z');  
  }); 
  test("Start time in future", async () => { 
    const timestamp = '2035-03-23 19:57:33';
  //  exec(`/bin/date --set="${timestamp}"`);
    await sendTransaction({
      code: tickTransaction,
      args: [], 
      signers: [EMULATOR_ACCOUNT],
    }); 
    console.log(process.env.FAKETIME);
    const checkTime = await executeScript({
      code: checkTimeScript,
      args: [] 
    });
    expect(checkTime).toMatch('2016-03-23T09:56:00.000Z');  
  }); */
})
