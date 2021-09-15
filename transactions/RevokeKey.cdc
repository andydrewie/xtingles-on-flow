transaction() {
    prepare(signer: AuthAccount) {
        // Get a key from an auth account.
        let keyA = signer.keys.revoke(keyIndex: 0)
    }
}