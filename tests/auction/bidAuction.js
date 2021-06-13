import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

const EMULATOR_ACCOUNT = '0xf8d6e0586b0a20c7';
const SECOND_ACCOUNT = '0x01cf0e2f2f715450';
const THIRD_ACCOUNT = '0x179b6b1cb6755e31';
const { exec } = require('child_process');

import { sendTransaction, executeScript, init } from "flow-js-testing";
import { ZERO_UFIX64, defaultAuctionParameters } from "../constants";

export const testSuiteBidAuction = () => describe("Bid auction", () => {
  let createAuctionTransaction,
      checkAuctionStatusScript,
      createdAuction,
      placeBidTransaction,
      createdAuctionWithNFT,
      createAuctionTransactionWithNFT; 

  beforeAll(async () => {
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

    createdAuction = await sendTransaction({
      code: createAuctionTransaction,
      args: defaultAuctionParameters, 
      signers: [EMULATOR_ACCOUNT],
    }); 

    createdAuctionWithNFT = await sendTransaction({
      code: createAuctionTransactionWithNFT,
      args: [
        ...defaultAuctionParameters,
        ["xxx", t.String],
        ["xxx", t.String],
        ["xxx", t.String],
        ["xxx", t.String],
      ], 
      signers: [EMULATOR_ACCOUNT],
    });  
  });
 
  test("Auction does not exists", async () => { 
    let error;
    try {
      await sendTransaction({
        code: placeBidTransaction,
        args: [      
          [999, t.UInt64],
          ["50.00", t.UFix64],
          [EMULATOR_ACCOUNT, t.Address],   
        ], 
        signers: [EMULATOR_ACCOUNT],
      }); 
    } catch(e) {
      error = e;
    } 
    expect(error).toMatch(/Auction does not exist in this drop/);  
  });
  
  test("NFT in auction does not exist", async () => { 
    let error;
    try {
      const { events } = createdAuction;
      await sendTransaction({
        code: placeBidTransaction,
        args: [      
          [events[0].data.auctionID, t.UInt64],
          ["50.00", t.UFix64],
          [EMULATOR_ACCOUNT, t.Address],   
        ], 
        signers: [EMULATOR_ACCOUNT],
      }); 
    } catch(e) {
      error = e;
    } 
    expect(error).toMatch(/NFT in auction does not exist/);  
  });

  test("The auction has not started yet", async () => { 
    let error;
    try {
      const { events } = createdAuctionWithNFT;
      await sendTransaction({
        code: placeBidTransaction,
        args: [      
          [events[0].data.auctionID, t.UInt64],
          ["50.00", t.UFix64],
          [EMULATOR_ACCOUNT, t.Address],   
        ], 
        signers: [EMULATOR_ACCOUNT],
      }); 
    } catch(e) {
      error = e;
    } 
    expect(error).toMatch(/The auction has not started yet/);  
  });


})
