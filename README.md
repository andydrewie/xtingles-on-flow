1. install flow cli https://docs.onflow.org/flow-cli/install
2. launch flow emulator in the separate console in the root of this project
3. deploy contracts for emulator-account: flow project deploy --update (possibly in case of error you have to regenerate your keys by (flow keys generate) and replace emulator-account keys in flow.json by new generated private key)
4. execute command in cli: mint NFT
5. you can execute previous command several times and replace arguments of this command for your desirable values
6. check NFTs on account

check NFTs on account: flow scripts execute ./scripts/CheckASMR.cdc --arg Address:"0xf8d6e0586b0a20c7"

mint NFT: flow transactions send --code ./transactions/MintASMR.cdc --args-json '[{"type": "String","value": "https://www.youtube.com/watch?v=Bsk72CLUc9Y&ab_channel=0xAlchemist"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "String","value": "xxx"}, {"type": "Address","value": "0xf8d6e0586b0a20c7"}, {"type": "String","value": "xxx"}, {"type": "UInt64","value": "1"},{"type": "UInt64","value": "1"}]' --signer emulator-account