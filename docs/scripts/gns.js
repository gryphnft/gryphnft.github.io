(async() => {
  const libWeb3 = blockapi.web3()
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

  const sale = blockapi.contract('gns_sale')
  const registry = blockapi.contract('gns_registry')
  const form = document.getElementById('registration')
  const input = {
    namespace: document.getElementById('namespace'),
    referrer: document.getElementById('referrer')
  }
  const prices = [
    blockapi.toWei(0.1).toString(), //3 letters
    blockapi.toWei(0.05).toString(), //4 letters
    blockapi.toWei(0.01).toString(), //5 letters 
    blockapi.toWei(0.005).toString(), //6 letters
  ]

  async function query() {
    //local error handling
    const name = input.namespace.value.toLowerCase()
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

    const tokenId = libWeb3.utils.toBN(libWeb3.utils.keccak256(name)).toString()
    try {
      if (await blockapi.read(registry, 'ownerOf', tokenId)) {
        blockapi.notify('error', 'Name is already reserved')
        return false
      }
    } catch(e) {
      blockapi.notify('success', `${name} is available!`)
    }

    return true
  }

  async function buy(e) {
    e.preventDefault()

    //local error handling
    const name = input.namespace.value.toLowerCase()
    const referrer = input.referrer.value.trim().length 
      ? input.referrer.value.trim()
      : '0x0000000000000000000000000000000000000000'

    if (!/^[a-z0-9\_\-]{4,20}$/.test(name)) {
      blockapi.notify('error', 'Name is invalid')
      return false
    } else if (/^0x[a-f0-9\_\-]{43,44}$/.test(referrer.toLowerCase())) {
      blockapi.notify('error', 'Referrer is invalid')
      return false
    }

    if (!state.account) {
      blockapi.connect(blockmetadata, async function(newstate) {
        await connected(newstate)
        await buy(e)
      }, disconnected)
      return false
    }

    const tokenId = libWeb3.utils.toBN(libWeb3.utils.keccak256(name)).toString()
    try {
      if (await blockapi.read(registry, 'ownerOf', tokenId)) {
        blockapi.notify('error', 'Name is already reserved')
        return false
      }
    } catch(e) {
      blockapi.notify('success', `${name} is available!`)
    }

    //get price
    const index = (name.length - 3) >= prices.length 
      ? prices.length - 1 
      : name.length - 3;

    let rpc;
    try {
      rpc = blockapi.send(
        sale, 
        state.account, 
        'buy(address,string,address)', 
        prices[index], //value
        //args
        state.account, 
        name,
        referrer
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
        </a>. Please stay on this page and wait for 10 confirmations...`,
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
        const contractAddress = blockmetadata.contracts.gns_registry.address
        message += ` and you should also be able view on <a href="${marketplace}/${contractAddress}/${tokenId}" target="_blank">
          OpenSea
        </a>`
      }
      message += '. Please stay on this page and wait for 10 confirmations...'
      blockapi.notify('success', message, 1000000)
    })

    rpc.on('receipt', function(receipt) {
      blockapi.notify(
        'success', 
        `Confirming "${name}" on <a href="${blockmetadata.chain_scan}/tx/${receipt.transactionHash}" target="_blank">
          etherscan.com
        </a>. Please stay on this page and wait for 10 confirmations...`,
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
  window.addEventListener('toggle-referrer-click', () => {
    document.querySelector('#referral .visibility').style.display = 'block'
  })

  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });

  const value = params.name || ''
  if (value.length) {
    input.namespace.value = value
    await query()
  }
  
  if (params.code) {
    input.referrer.value = params.code
  }

  window.doon('body')
})()