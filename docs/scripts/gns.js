(async() => {
  const state = {}
  const connected = async function(newstate) {
    Object.assign(state, newstate, {
      //account: '0xe4d48122f4e3cc276480dc28db9e023fd66e39e8'
    })
    blockapi.notify('success', 'Wallet connected')

    document.getElementById('connected').classList.remove('hidden');
    document.getElementById('disconnected').classList.add('hidden');

    document.getElementById('wallet-address').innerHTML = [
      newstate.account.substr(0, 6),
      newstate.account.substr(newstate.account.length - 4)
    ].join('...')
  }

  const disconnected = function(e) {
    if (e?.message) {
      blockapi.notify('error', e.message)
    } else {
      blockapi.notify('success', 'Wallet disconnected')
    }

    document.getElementById('disconnected').classList.remove('hidden');
    document.getElementById('connected').classList.add('hidden');
  }

  window.doon('body')
  window.addEventListener('disconnect-click', disconnected)
  window.addEventListener('connect-click', async(e) => {
    blockapi.connect(blockmetadata, connected, disconnected)
  })
})()