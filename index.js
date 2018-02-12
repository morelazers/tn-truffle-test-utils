let funcs = {

  /**
   *  Deploys a contract with given constructor parameters; if the final param is an object it is
   *  treated as the intended transaction object
   *  @param {Object} contract Contract to deploy
   *  @optional @param {List} ...args Additional arguments, passed as general comma separated args
   */
  deploy: async (contract, ...args) => {
    let txObj = args[args.length - 1]
    if (typeof txObj !== 'object') {
      txObj = { from: web3.eth.accounts[0] }
      args.push(txObj)
    }
    let newContract = await contract.new(...args)
    return newContract
  },

  /**
   *  Sends a request to the RPC provider to mine a single block synchronously
   */
  mineOneBlock: async () => {
    await web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_mine',
      id: new Date().getTime()
    })
  },

  /**
   *  Assert that a particular Ethereum transaction throws
   *  @param {Promise} promise Transaction operation which should throw
   *  @param {String} err Error message which should be printed upon test failure
   *  @return {Promise} Promise which will resolve once the transaction has been completed
   */
  assertThrows: (promise, err) => {
    return promise.then(() => {
      assert.isNotOk(true, err)
    }).catch((e) => {
      assert.include(e.message, 'VM Exception')
    })
  },

  /**
   *  Get the timestamp of the latest block. Useful for 'before' and 'after' times in tests, without
   *  requiring a restart of TestRPC.
   *  @return {Number} Latest block timestamp in seconds
   */
  getCurrentBlocktime: async () => {
    let latestBlock = await web3.eth.getBlock('latest')
    return latestBlock.timestamp
  },

  /**
   *  Increases the time in the EVM. Cannot be undone at the moment which is a bit of a pain.
   *  @param {Number} seconds Number of seconds to increase the time by
   */
  increaseTime: async (seconds) => {
    await web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_increaseTime',
      params: [seconds],
      id: Number(Math.random() * 1000).toFixed(0)
    })
    await funcs.mineOneBlock()
  },

  /**
   *  Resolves when a given event happens, or rejects after an optional timeout
   *  @param {Object} event Contract event to watch for
   *  @param {Number} optTimeout Optional time to wait in milliseconds (useful for long blocktimes)
   *  @return {Promise} Promise which resolves when the event is seen
   */
  waitForEvent: async (event, optTimeout) => {
    return new Promise((resolve, reject) => {
      let timeout = setTimeout(() => {
        clearTimeout(timeout)
        return reject(new Error('Timeout waiting for event'))
      }, optTimeout || 5000)
      event.watch((e, res) => {
        clearTimeout(timeout)
        if (e) return reject(e)
        resolve(res)
      })
    })
  }

}

module.exports = funcs
