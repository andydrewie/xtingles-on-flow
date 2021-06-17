import * as t from "@onflow/types";

export const ZERO_UFIX64 = ["0.00", t.UFix64];

export const defaultAuctionParameters = [
    // Min bid increment in percent
    ["10.00", t.UFix64],    
    // Time until finish, when auction could be extended
    ["1300.00", t.UFix64],    
    // Time lenght to extend auction      
    ["1300.00", t.UFix64],  
    ["1300.00", t.UFix64],    
    // Start time 
    ["5623417982.00", t.UFix64],
      // Initial price
    ["50.00", t.UFix64],
    // Platform vault address
    ["0x01cf0e2f2f715450", t.Address]   
];
