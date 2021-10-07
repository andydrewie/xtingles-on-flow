for val in {1..60}
do
  echo $val
  flow transactions send ./transactions/blocto/MintCollectible.cdc --args-json '[{"type": "Address","value": "0x5f14b7e68e0bc3c3"}, {"type": "UInt64","value": "'$val'"}]' --signer testnet-xtingles-1 --network=mainnet --gas-limit=9999
done
echo All done
