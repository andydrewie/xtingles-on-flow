flow project deploy --update
flow accounts create --key a6ef4cce7ee66d34909966a403388ca72b5134f644bc6de0911abd2d1ce524ab8955bfbb22b6182f83ee8c30db621e2cb10417216cce35b902af0e4670ebe5f4 --signer emulator-account
flow accounts create --key 4267a5ef429dbc569172013021563b73466121394448f3360d146bfb16f9008f1b39e6c6fcb8cff7e96e512e64e6888f1749cd14e63c28da26684a1df1a745a4 --signer emulator-account
flow transactions send --code ./transactions/SetupFUSD.cdc --signer emulator-account
flow transactions send --code ./transactions/SetupFUSD.cdc --signer second-account
flow transactions send --code ./transactions/SetupFUSD.cdc --signer third-account
flow transactions send --code ./transactions/MintFUSD.cdc --args-json '[{"type": "UFix64","value": "5000.00"}, {"type": "Address","value": "0xf8d6e0586b0a20c7"}]' --signer emulator-account
flow transactions send --code ./transactions/MintFUSD.cdc --args-json '[{"type": "UFix64","value": "1000.00"}, {"type": "Address","value": "0x01cf0e2f2f715450"}]' --signer emulator-account
flow transactions send --code ./transactions/MintFUSD.cdc --args-json '[{"type": "UFix64","value": "500.00"}, {"type": "Address","value": "0x179b6b1cb6755e31"}]' --signer emulator-account
