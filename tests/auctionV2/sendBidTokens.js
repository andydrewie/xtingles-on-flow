import path from "path";
import * as fs from "fs";
import * as t from "@onflow/types";

import { sendTransaction, mintFlow, getAccountAddress, init, emulator, deployContractByName  } from "flow-js-testing";

export const testSuiteSendBidTokens = () => describe("Auction send bid tokens (return bid)", () => {
  let placeBidTransaction,
      createAuctionTransactionWithNFT,
      setupFUSDTransaction,
      tickTransaction,
      mintFUSDTransaction,
      cancelAuctionTransaction,
      unlinkFUSDVault,
      commission;
  ; 

  beforeAll(async () => {
    jest.setTimeout(120000);
    init(path.resolve(__dirname, "../"));

    createAuctionTransactionWithNFT = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/auctionV2/CreateAuctionWithNFT.cdc`
      ),
      "utf8"    
    );

    placeBidTransaction = fs.readFileSync(
      path.join(
        __dirname,
        `../../transactions/emulator/auctionV2/Bid.cdc`
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
        `../../transactions/emulator/auctionV2/CancelAuction.cdc`
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
                   
    unlinkFUSDVault = fs.readFileSync(
      path.join(
          __dirname,
          `../../transactions/emulator/UnlinkFUSDVault.cdc`
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

    commission = `{
      Address(${second}) : Edition.CommissionStructure(
          firstSalePercent: 1.00,
          secondSalePercent: 5.00,
          description: "xxx"
      ),
      Address(${third}) : Edition.CommissionStructure(
          firstSalePercent: 99.00,
          secondSalePercent: 6.00,
          description: "xxx"
      )          
    }`;

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

    // Setup FUSD Vault for the admin account
    await sendTransaction({
      code: setupFUSDTransaction,
      args: [], 
      signers: [admin],
    }); 

    // Mint FUSD for Vault and sent to the admin account
    await sendTransaction({
      code: mintFUSDTransaction,
      args: [
        ["500.00",t.UFix64], [admin, t.Address]
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
            ["500.00",t.UFix64], [second, t.Address]
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
            ["500.00",t.UFix64], [third, t.Address]
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
 
    test("return FUSD tokens to the previous bidder in case he was outbid", async () => { 
      try {
          const admin = await getAccountAddress("admin");  
          const second = await getAccountAddress("second");  
          const third = await getAccountAddress("third");    
          
                 
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
            // Start bid time
            ["0.00", t.UFix64],
            // Initial price
            ["50.00", t.UFix64],
            // Platform vault address
            ["0x01cf0e2f2f715450", t.Address]   
          ];

          const createdAuctionWithNFT = await sendTransaction({
              code: createAuctionTransactionWithNFT.replace('RoyaltyVariable', commission),
              args: [
                  ...auctionParameters,
                  // Link to NFT
                  ["xxx", t.String],
                  // name
                  ["xxx", t.String],
                  // author
                  ["xxx", t.String],
                  // description
                  ["xxx", t.String],
                  // Number of copy in one edition
                  [1, t.UInt64],
              ], 
              signers: [admin],
          }); 

          const { events } = createdAuctionWithNFT;

          // Id of created auction
          const auctionId = events[0].data.auctionID;

          await new Promise((r) => setTimeout(r, 3000));

          // Sample transaction to change last block time
          await sendTransaction({
              code: tickTransaction,
              args: [], 
              signers: [admin],
          }); 

          // Bid from the second account
          const resultBid1 = await sendTransaction({
              code: placeBidTransaction,
              args: [ 
                  // Auction id     
                  [auctionId, t.UInt64],
                  // Bid amount
                  ["50.00", t.UFix64],
                  // Platform address
                  [admin, t.Address],   
              ], 
              signers: [second],
          }); 

          // Bid from the third account
          const resultBid2 = await sendTransaction({
              code: placeBidTransaction,
              args: [   
                  // Auction id        
                  [auctionId, t.UInt64],
                  // Bid amount
                  ["60.00", t.UFix64],
                  // Platform address
                  [admin, t.Address],   
              ], 
              signers: [third],
          }); 

          const { events: firstBidEvents } = resultBid1;
          const { events: secondBidEvents } = resultBid2;
          
          // There are events in row
          // The first bid
          // 1. TokensWithdrawn from the second account
          expect(firstBidEvents[0].type).toEqual(`A.${admin.substr(2)}.FUSD.TokensWithdrawn`);
          expect(firstBidEvents[0].data.from).toEqual(second);
          expect(parseInt(firstBidEvents[0].data.amount, 10)).toEqual(50);

          // 2. TokensDeposited to the admin account
          expect(firstBidEvents[1].type).toEqual(`A.${admin.substr(2)}.FUSD.TokensDeposited`);
          expect(firstBidEvents[1].data.to).toEqual(admin);
          expect(parseInt(firstBidEvents[1].data.amount, 10)).toEqual(50);


          // The second bid
          // 1. TokensWithdrawn from the third account. The current bid
          expect(secondBidEvents[0].type).toEqual(`A.${admin.substr(2)}.FUSD.TokensWithdrawn`);
          expect(secondBidEvents[0].data.from).toEqual(third);
          expect(parseInt(secondBidEvents[0].data.amount, 10)).toEqual(60);

          // 2. TokensWithdrawn from the admin account. Return the previous bid
          expect(secondBidEvents[1].type).toEqual(`A.${admin.substr(2)}.FUSD.TokensWithdrawn`);
          expect(secondBidEvents[1].data.from).toEqual(admin);
          expect(parseInt(secondBidEvents[1].data.amount, 10)).toEqual(50);

          // 3. TokensDeposited to the second account. Return the previous bid
          expect(secondBidEvents[2].type).toEqual(`A.${admin.substr(2)}.FUSD.TokensDeposited`);
          expect(secondBidEvents[2].data.to).toEqual(second);
          expect(parseInt(secondBidEvents[2].data.amount, 10)).toEqual(50);

          // 4. Bid return to the previous bidder
          expect(secondBidEvents[3].type).toEqual(`A.${admin.substr(2)}.AuctionV2.SendBidTokens`);
          expect(secondBidEvents[3].data.to).toEqual(second);
          expect(parseInt(secondBidEvents[3].data.amount, 10)).toEqual(50);

          // 5. TokensDeposited  to the admin account. The current bid
          expect(secondBidEvents[4].type).toEqual(`A.${admin.substr(2)}.FUSD.TokensDeposited`);
          expect(secondBidEvents[4].data.to).toEqual(admin);
          expect(parseInt(secondBidEvents[4].data.amount, 10)).toEqual(60);

      } catch(e) {
        expect(e).toEqual('');      
      } 
    });

    test("return FUSD tokens to the platform in case the bidder was outbid and his vault unreachable", async () => { 
      try {
          const admin = await getAccountAddress("admin");  
          const second = await getAccountAddress("second");  
          const third = await getAccountAddress("third");              
                 
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
            // Start bid time
            ["0.00", t.UFix64],
            // Initial price
            ["50.00", t.UFix64],
            // Platform vault address
            ["0x01cf0e2f2f715450", t.Address]   
          ];

          const createdAuctionWithNFT = await sendTransaction({
              code: createAuctionTransactionWithNFT.replace('RoyaltyVariable', commission),
              args: [
                  ...auctionParameters,
                  // Link to NFT
                  ["xxx", t.String],
                  // name
                  ["xxx", t.String],
                  // author
                  ["xxx", t.String],
                  // description
                  ["xxx", t.String],
                  // Number of copy in one edition
                  [1, t.UInt64],
              ], 
              signers: [admin],
          }); 

          const { events } = createdAuctionWithNFT;

          // Id of created auction
          const auctionId = events[0].data.auctionID;

          await new Promise((r) => setTimeout(r, 3000));

          // Sample transaction to change last block time
          await sendTransaction({
              code: tickTransaction,
              args: [], 
              signers: [admin],
          }); 

          // Bid from the second account
          const resultBid1 = await sendTransaction({
              code: placeBidTransaction,
              args: [ 
                  // Auction id     
                  [auctionId, t.UInt64],
                  // Bid amount
                  ["50.00", t.UFix64],
                  // Platform address
                  [admin, t.Address],   
              ], 
              signers: [second],
          }); 

          // Unlink the second account FUSD vault to check send money to platform
          await sendTransaction({
            code: unlinkFUSDVault,
            args: [], 
            signers: [second],
          }); 
 
          // Bid from the third account
          const resultBid2 = await sendTransaction({
              code: placeBidTransaction,
              args: [   
                  // Auction id        
                  [auctionId, t.UInt64],
                  // Bid amount
                  ["60.00", t.UFix64],
                  // Platform address
                  [admin, t.Address],   
              ], 
              signers: [third],
          }); 

          const { events: firstBidEvents } = resultBid1;
          const { events: secondBidEvents } = resultBid2;
             
          // There are events in row
          // The first bid
          // 1. TokensWithdrawn from the second account
          expect(firstBidEvents[0].type).toEqual(`A.${admin.substr(2)}.FUSD.TokensWithdrawn`);
          expect(firstBidEvents[0].data.from).toEqual(second);
          expect(parseInt(firstBidEvents[0].data.amount, 10)).toEqual(50);

          // 2. TokensDeposited to the admin account
          expect(firstBidEvents[1].type).toEqual(`A.${admin.substr(2)}.FUSD.TokensDeposited`);
          expect(firstBidEvents[1].data.to).toEqual(admin);
          expect(parseInt(firstBidEvents[1].data.amount, 10)).toEqual(50);


          // The second bid
          // 1. TokensWithdrawn from the third account. The current bid
          expect(secondBidEvents[0].type).toEqual(`A.${admin.substr(2)}.FUSD.TokensWithdrawn`);
          expect(secondBidEvents[0].data.from).toEqual(third);
          expect(parseInt(secondBidEvents[0].data.amount, 10)).toEqual(60);

          // 2. TokensWithdrawn from the admin account. Return the previous bid
          expect(secondBidEvents[1].type).toEqual(`A.${admin.substr(2)}.FUSD.TokensWithdrawn`);
          expect(secondBidEvents[1].data.from).toEqual(admin);
          expect(parseInt(secondBidEvents[1].data.amount, 10)).toEqual(50);

          // 3. TokensDeposited to the second account. 
          // Not return the previous bid to the bidder, because path to vault was unlinked
          // Tokens were deposited to the platform to handle this situation in the future
          expect(secondBidEvents[2].type).toEqual(`A.${admin.substr(2)}.FUSD.TokensDeposited`);
          expect(secondBidEvents[2].data.to).toEqual(admin);
          expect(parseInt(secondBidEvents[2].data.amount, 10)).toEqual(50);

          // 4. Bid return to the previous bidder
          expect(secondBidEvents[3].type).toEqual(`A.${admin.substr(2)}.AuctionV2.FailSendBidTokens`);
          expect(secondBidEvents[3].data.to).toEqual(admin);
          expect(parseInt(secondBidEvents[3].data.amount, 10)).toEqual(50);

          // 4. TokensDeposited  to the admin account. The current bid
          expect(secondBidEvents[4].type).toEqual(`A.${admin.substr(2)}.FUSD.TokensDeposited`);
          expect(secondBidEvents[4].data.to).toEqual(admin);
          expect(parseInt(secondBidEvents[4].data.amount, 10)).toEqual(60);

      } catch(e) {
        expect(e).toEqual('');      
      } 
    });

    test("return FUSD tokens to the previous bidder in case cancel auction", async () => { 
      try {
          const admin = await getAccountAddress("admin");  
          const second = await getAccountAddress("second");  
          const bidAmount = 50;          
                 
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
            // Start bid time
            ["0.00", t.UFix64],
            // Initial price
            [bidAmount.toFixed(2), t.UFix64],
            // Platform vault address
            ["0x01cf0e2f2f715450", t.Address]   
          ];

          const createdAuctionWithNFT = await sendTransaction({
              code: createAuctionTransactionWithNFT.replace('RoyaltyVariable', commission),
              args: [
                  ...auctionParameters,
                  // Link to NFT
                  ["xxx", t.String],
                  // name
                  ["xxx", t.String],
                  // author
                  ["xxx", t.String],
                  // description
                  ["xxx", t.String],
                  // Number of copy in one edition
                  [1, t.UInt64],
              ], 
              signers: [admin],
          }); 

          const { events } = createdAuctionWithNFT;

          // Id of created auction
          const auctionId = events[0].data.auctionID;

          await new Promise((r) => setTimeout(r, 3000));

          // Sample transaction to change last block time
          await sendTransaction({
              code: tickTransaction,
              args: [], 
              signers: [admin],
          }); 

          // Bid from the second account
          const resultBid = await sendTransaction({
              code: placeBidTransaction,
              args: [ 
                  // Auction id     
                  [auctionId, t.UInt64],
                  // Bid amount
                  ["50.00", t.UFix64],
                  // Platform address
                  [admin, t.Address],   
              ], 
              signers: [second],
          }); 

          const resultCancel = await sendTransaction({
            code: cancelAuctionTransaction,
            args: [
              [events[0].data.auctionID, t.UInt64]
            ], 
            signers: [admin],
          });           

          const { events: bidEvents } = resultBid;
          const { events: cancelEvents } = resultCancel;

          // There are events in row

          // The  bid
          // 1. TokensWithdrawn from the second account
          expect(bidEvents[0].type).toEqual(`A.${admin.substr(2)}.FUSD.TokensWithdrawn`);
          expect(bidEvents[0].data.from).toEqual(second);
          expect(parseInt(bidEvents[0].data.amount, 10)).toEqual(bidAmount);

          // 2. TokensDeposited to the admin account
          expect(bidEvents[1].type).toEqual(`A.${admin.substr(2)}.FUSD.TokensDeposited`);
          expect(bidEvents[1].data.to).toEqual(admin);
          expect(parseInt(bidEvents[1].data.amount, 10)).toEqual(bidAmount);

          // The cancel
          // 1. TokensWithdrawn from the admin account. Return the previous bid
          expect(cancelEvents[0].type).toEqual(`A.${admin.substr(2)}.FUSD.TokensWithdrawn`);
          expect(cancelEvents[0].data.from).toEqual(admin);
          expect(parseInt(cancelEvents[0].data.amount, 10)).toEqual(bidAmount);

          // 2. TokensDeposited to the second account. Return the previous bid
          expect(cancelEvents[1].type).toEqual(`A.${admin.substr(2)}.FUSD.TokensDeposited`);
          expect(cancelEvents[1].data.to).toEqual(second);
          expect(parseInt(cancelEvents[1].data.amount, 10)).toEqual(bidAmount);
           
      } catch(e) {
        expect(e).toEqual('');      
      } 
  });
})
