import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

const EMULATOR_ACCOUNT = '0xf8d6e0586b0a20c7';
const SECOND_ACCOUNT = '0x01cf0e2f2f715450';
const THIRD_ACCOUNT = '0x179b6b1cb6755e31';


import { sendTransaction, init} from "flow-js-testing";

beforeAll(() => {
  init(path.resolve(__dirname, "../"));
});

describe("Create auction", () => {
  const createAuctionTransaction = fs.readFileSync(
    path.join(
      __dirname,
      `../transactions/emulator/CreateAuction.cdc`
    ),
    "utf8"    
  );

  test("Start time in past", async () => { 
    let error;
    try {
      await sendTransaction({
        code: createAuctionTransaction,
        args: [   
          ["1.00", t.UFix64],    
          ["1300.00", t.UFix64],          
          ["1300.00", t.UFix64],  
          ["1300.00", t.UFix64],     
          ["1623417982.00", t.UFix64],
          ["1300.00", t.UFix64],
          [EMULATOR_ACCOUNT, t.Address],
          ["1623440139", t.String],
          ["1623440139", t.String],
          ["1623440139", t.String],
          ["1623440139", t.String],      
        ], 
        signers: [EMULATOR_ACCOUNT],
      });       
    } catch(e) {
      error = e;
    } 
    expect(error).toMatch(/(Auction start time can't be in the past)/);  
  }); 
})
