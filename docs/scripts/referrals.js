(async() => {
  const state = { connected: false }
  const sale = blockapi.contract('gns_sale')
  const container = {
    connected: document.getElementById('connected'),
    disconnected: document.getElementById('disconnected'),
    rewards: document.getElementById('rewards')
  }
  const connected = async function(newstate) {
    Object.assign(state, newstate, { connected: true })
    blockapi.notify('success', 'Wallet connected')
    container.connected.style.display = 'block';
    container.disconnected.style.display = 'none';
    //get the rewards balance
    state.rewards = await blockapi.read(sale, 'rewards', state.account)
    state.minimum = await blockapi.read(sale, 'minimumRedeem')
    container.rewards.innerHTML = `Ξ ${blockapi.toEther(state.rewards, 'string')}`
  }

  const disconnected = function(e) {
    if (e?.message) {
      blockapi.notify('error', e.message)
    } else {
      blockapi.notify('success', 'Wallet disconnected')
      container.connected.style.display = 'none';
      container.disconnected.style.display = 'block';
    }
  }

  window.addEventListener('connect-click', () => {
    if (!state.account) {
      return blockapi.connect(blockmetadata, connected, disconnected)
    }
  })

  window.addEventListener('redeem-click', async() => {
    if (!state.account) {
      return blockapi.connect(blockmetadata, connected, disconnected)
    }

    const rewards = state.rewards ? blockapi.toEther(state.rewards, 'int') : 0
    const minimum = state.minimum ? blockapi.toEther(state.minimum, 'int') : 0
    if (!rewards || rewards < minimum) {
      return blockapi.notify(
        'error', 
        `Need at least Ξ ${blockapi.toEther(state.minimum, 'string')} ether to redeem.`
      )
    }

    let rpc;
    try {
      rpc = blockapi.send(
        sale, 
        state.account, 
        'redeem(address)', 
        0, //no value
        //args
        state.account
      )
    } catch(e) {
      blockapi.notify('error', e.message)
      return false
    }

    rpc.on('transactionHash', function(hash) {
      //reset rewards
      state.rewards = 0
      container.rewards.innerHTML = `Ξ 0`
      blockapi.notify(
        'success', 
        `Transaction started on <a href="${blockmetadata.chain_scan}/tx/${hash}" target="_blank">
          etherscan.com
        </a>`,
        1000000
      )
    })

    rpc.on('confirmation', function(confirmationNumber, receipt) {
      if (confirmationNumber > 10) return
      blockapi.notify(
        'success', 
        `${confirmationNumber}/10 confirmed <a href="${blockmetadata.chain_scan}/tx/${receipt.transactionHash}" target="_blank">
          etherscan.com
        </a>`, 
        1000000
      )
    })

    rpc.on('receipt', function(receipt) {
      blockapi.notify(
        'success', 
        `Confirming on <a href="${blockmetadata.chain_scan}/tx/${receipt.transactionHash}" target="_blank">
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

  })

  window.doon('body')
})()