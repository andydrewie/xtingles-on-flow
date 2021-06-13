import * as t from "@onflow/types";

export const ZERO_UFIX64 = ["0.00", t.UFix64];

const EMULATOR_ACCOUNT = "0xf8d6e0586b0a20c7";

export const defaultAuctionParameters = [
    ["10.00", t.UFix64],    
    ["1300.00", t.UFix64],          
    ["1300.00", t.UFix64],  
    ["1300.00", t.UFix64],     
    ["5623417982.00", t.UFix64],
    ["50.00", t.UFix64],
    [EMULATOR_ACCOUNT, t.Address]   
  ];
