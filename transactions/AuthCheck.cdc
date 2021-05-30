import AuthChecker from 0xf9a15cf06773248c

transaction(name: String) {
    prepare(account: AuthAccount) {
        AuthChecker.checkLogin(name)
    }
}
