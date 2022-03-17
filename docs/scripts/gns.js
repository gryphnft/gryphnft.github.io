(async() => {
  const state = { connected: false }
  const connected = async function(newstate) {
    Object.assign(state, newstate, { connected: true })
    blockapi.notify('success', 'Wallet connected')
  }

  const disconnected = function(e) {
    if (e?.message) {
      blockapi.notify('error', e.message)
    } else {
      blockapi.notify('success', 'Wallet disconnected')
    }
  }

  const contract = blockapi.contract('namespaces')
  const form = document.getElementById('registration')
  const input = document.getElementById('namespace')
  const prices = [
    blockapi.toWei(0.192).toString(), //4 letters
    blockapi.toWei(0.096).toString(), //5 letters
    blockapi.toWei(0.048).toString(), //6 letters 
    blockapi.toWei(0.024).toString(), //7 letters
    blockapi.toWei(0.012).toString(), //8 letters
    blockapi.toWei(0.006).toString(), //9 letters
    blockapi.toWei(0.003).toString()  //10 letters or more
  ]

  async function query() {
    //local error handling
    const name = input.value.toLowerCase()
    const valid = /^[a-z0-9\_\-]{4,20}$/.test(name)

    if (!valid) {
      blockapi.notify('error', 'Name is invalid')
      return false
    }

    if (!state.account) {
      blockapi.connect(blockmetadata, async function(newstate) {
        await connected(newstate)
        await query()
      }, disconnected)
      return false
    }

    const tokenId = state.web3.utils.toBN(state.web3.utils.keccak256(name)).toString()
    try {
      if (await blockapi.read(contract, 'ownerOf', tokenId)) {
        blockapi.notify('error', 'Name is already reserved')
        return false
      }
    } catch(e) {
      blockapi.notify('success', `${value} is available!`)
    }

    return true
  }

  async function buy(e) {
    e.preventDefault()

    //local error handling
    const name = input.value.toLowerCase()
    const valid = /^[a-z0-9\_\-]{4,20}$/.test(name)

    if (!valid) {
      blockapi.notify('error', 'Name is invalid')
      return false
    }

    if (!state.account) {
      blockapi.connect(blockmetadata, async function(newstate) {
        await connected(newstate)
        await query()
      }, disconnected)
      return false
    }

    const tokenId = state.web3.utils.toBN(state.web3.utils.keccak256(name)).toString()
    try {
      if (await blockapi.read(contract, 'ownerOf', tokenId)) {
        blockapi.notify('error', 'Name is already reserved')
        return false
      }
    } catch(e) {
      blockapi.notify('success', `${value} is available!`)
    }

    //get price
    const index = name.length - 4;
    if (index >= prices.length) {
      index = prices.length - 1;
    }

    let rpc;
    try {
      rpc = blockapi.send(
        contract, 
        state.account, 
        'buy(address,string)', 
        prices[index], //value
        //args
        state.account, 
        name
      )
    } catch(e) {
      blockapi.notify('error', e.message)
      return false
    }

    rpc.on('transactionHash', function(hash) {
      blockapi.notify(
        'success', 
        `Transaction started for "${name}" on <a href="${blockmetadata.chain_scan}/tx/${hash}" target="_blank">
          etherscan.com
        </a>`,
        1000000
      )
    })

    rpc.on('confirmation', function(confirmationNumber, receipt) {
      if (confirmationNumber > 10) return
      let message = `${confirmationNumber}/10 confirmed "${name}" on <a href="${blockmetadata.chain_scan}/tx/${receipt.transactionHash}" target="_blank">
        etherscan.com
      </a>`
      if (confirmationNumber > 6) {
        const marketplace = blockmetadata.chain_marketplace
        const contractAddress = blockmetadata.contracts.namespaces.address
        message += ` and you should also be able view on <a href="${marketplace}/${contractAddress}/${tokenId}" target="_blank">
          OpenSea
        </a>`
      }
      blockapi.notify('success', message, 1000000)
    })

    rpc.on('receipt', function(receipt) {
      blockapi.notify(
        'success', 
        `Please confirm "${name}" on <a href="${blockmetadata.chain_scan}/tx/${receipt.transactionHash}" target="_blank">
          etherscan.com
        </a>`,
        1000000
      )
    })

    try {
      await rpc
    } catch(e) {
      blockapi.notify('error', e.message)
    }

    return false
  }

  form.addEventListener('submit', buy)

  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  const value = params.name
  if (value.length) {
    input.value = value
    await query()
  }

  window.doon('body')
})()