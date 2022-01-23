import NonFungibleToken, Pack from 0x01cf0e2f2f715450

transaction() {
    prepare(account: AuthAccount) {

        // get the references to the buyer's Vault and NFT Collection receiver
        var collectionCap = account.getCapability<&{Pack.CollectionPublic}>(Pack.CollectionPublicPath)

        // if collection is not created yet we make it.
        if !collectionCap.check() {
            // store an empty NFT Collection in account storage
            account.save<@NonFungibleToken.Collection>(<- Pack.createEmptyCollection(), to: Pack.CollectionStoragePath)

            // publish a capability to the Collection in storage
            account.link<&{Pack.CollectionPublic}>(Pack.CollectionPublicPath, target: Pack.CollectionStoragePath)
        } 
    }

    execute {}
}