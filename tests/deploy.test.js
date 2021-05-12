import path from "path";
import * as fs from "fs";
const basePath = path.resolve(__dirname, "../contracts");
import { UInt64, UFix64 } from "@onflow/types";
import * as t from "@onflow/types";

const EMULAGOR_ACCOUNT = '0xf8d6e0586b0a20c7';

const FungibleTokenPath = './FungibleToken.cdc';
const FungibleTokenAddress = '0xee82856bf20e2aa6';

const FlowTokenPath = './FlowToken.cdc';
const FlowTokenAddress = '0x0ae53cb6e3f42a79';

const ASMRPath = './ASMR.cdc';
const NonFungibleTokenPath = './NonFungibleToken.cdc';

import { getAccountAddress } from "flow-js-testing/dist/utils/account";
import { getContractAddress } from "flow-js-testing/dist/utils/contract";
import { deployContractByName } from "flow-js-testing/dist";
import { deployContract } from "flow-js-testing/dist";
import {executeScript, sendTransaction  } from "flow-js-testing/dist/utils/interaction";


import { init } from "flow-js-testing/dist/utils/init";
import {
  getFlowBalance,
} from "flow-js-testing/dist/utils/flow-token";

/*beforeAll(async () => {
    init(basePath);
    const main = async () => {
        init(path.resolve(__dirname, "../"));
    
        const to = EMULAGOR_ACCOUNT;

        const contracts = [
         {
            name: "NonFungibleToken"
          },
          {
            name: "ASMR"
          },
          {
            name: "MarketPlace"
          }
        ];

        for await (const contract of contracts) {         
          const { name } = contract;
          console.log(name);
          const deployedAccount = await getContractAddress(name);
          console.log(deployedAccount)
        
          if (deployedAccount) {
            console.log(`Contract ${contract.name} was deployed previously`);
          } else {
            const contractCode = fs
              .readFileSync(
                path.join(
                  __dirname,
                  `../contracts/${name}.cdc`
                ),
                "utf8"
              )
              .replace(
                FungibleTokenPath,
                FungibleTokenAddress
              )
              .replace(
                FlowTokenPath,
                FlowTokenAddress
              )
              .replace(
                ASMRPath,
                EMULAGOR_ACCOUNT
              )
              .replace(          
                NonFungibleTokenPath,
                EMULAGOR_ACCOUNT
              );

            try {  
              console.log(contractCode);
              const deploymentResult = await deployContractByName({
                to,
                name,
                contractCode,
              });
              console.log({ deploymentResult });
            } catch (e) {
               console.log(e);
            }
          }       
        };
          
    };

    main();
    


});*/

/*describe("Accounts", () => {
  init(path.resolve(__dirname, "../"));
   

  test("get account FLOW balance of emulator account", async () => {
    const EstimatedBalance = 99999999999;
    const actualBalance = await getFlowBalance(EMULAGOR_ACCOUNT);
    expect(parseFloat(actualBalance)).toBeGreaterThanOrEqual(EstimatedBalance);
  });

  test("get account FLOW balance of another account", async () => {
    const EstimatedBalance = 0.1;
    const account = await getAccountAddress("second-account");
    const actualBalance = await getFlowBalance(account);
    expect(parseFloat(actualBalance)).toEqual(EstimatedBalance);
  });


  test("Deploy PixelHeads contract", async () => {
    const name = "ASMR";
    const to = await getAccountAddress("Alice");
    console.log(to)

    let result;
    try {
      result = await deployContractByName({
        name,
        to: "0x179b6b1cb6755e31"
      });
    } catch (e) {
      console.log(e);
    }

      expect(result).toBe("");
  });
});*/

init(path.resolve(__dirname, "../"));

const contractCode = fs
  .readFileSync(
    path.join(
      __dirname,
      `../transactions/MintASMR.cdc`
    ),
    "utf8"
  );

console.log(contractCode.toString());



describe("Contracts", () => {
  test("check NonFungibleToken contract", async () => {   
    const address = await getContractAddress("NonFungibleToken");
    expect(address).toEqual(EMULAGOR_ACCOUNT);
  }); 

  test("check ASMR contract", async () => {   
    const address = await getContractAddress("ASMR");
    expect(address).toEqual(EMULAGOR_ACCOUNT);
  }); 

  test("check marketplace contract", async () => {
    const address = await getContractAddress("MarketPlaCE");
    expect(address).toEqual(EMULAGOR_ACCOUNT);
  });  

  test("check marketplace contract", async () => {

      let txResult;

      const code = `
        import ASMR from 0xf8d6e0586b0a20c7

        transaction(url: String,
                picturePreview: String,
                animation: String,
                name: String, 
                artist: String,
                artistAddress: Address, 
                description: String,        
                edition: UInt64,
                maxEdition: UInt64) {
            let receiverRef: &{ASMR.CollectionPublic}
            let minterRef: &ASMR.NFTMinter
            let metadata: ASMR.Metadata
        
            prepare(
                acct: AuthAccount     
            ) {
                self.receiverRef = acct.getCapability<&{ASMR.CollectionPublic}>(/public/ASMRCollection)
                    .borrow()
                    ?? panic("Could not borrow receiver reference")        
                
                self.minterRef = acct.borrow<&ASMR.NFTMinter>(from: /storage/ASMRMinter)
                    ?? panic("could not borrow minter reference")
        
                self.metadata = ASMR.Metadata(
                    url: url,
                    picturePreview: picturePreview,
                    animation: animation,
                    name: name, 
                    artist: artist,
                    artistAddress: 0xf8d6e0586b0a20c7, 
                    description: description,        
                    edition: edition,
                    maxEdition: maxEdition
                )
            }
        
            execute {
              
                let newNFT <- self.minterRef.mintNFT(metadata: self.metadata)
            
                self.receiverRef.deposit(token: <-newNFT)
        
                log("NFT Minted and deposited to Account 2's Collection")
            }
        }
    `;

      const Bob = await getAccountAddress("Bob");

      console.log(typeof contractCode);
      console.log(contractCode.toString());

      try {
        txResult = await sendTransaction({
          text,
          args: [
            ["xxx", t.String],    
            ["xxx", t.String], 
            ["xxx", t.String], 
            ["xxx", t.String], 
            ["xxx", t.String], 
            ["0xf8d6e0586b0a20c7", t.Address], 
            ["xxx", t.String], 
            [1, t.UInt64], 
            [10, t.UInt64], 
          ], 
          signers: ["0xf8d6e0586b0a20c7"],
        });
      } catch (e) {
        console.log(e);
      }

      expect(txResult.errorMessage).toBe("");
    }); 
});



