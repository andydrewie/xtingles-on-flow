  import AuthChecker from 0xf5b0eb433389ac3f

  transaction(nonce: String) {
    prepare(account: AuthAccount) {
      AuthChecker.checkLogin(nonce)
    }
  }