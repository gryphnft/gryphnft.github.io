(async () => {
    // WEB3
    const state = { connected: false }
    const connected = async function (newstate) {
        Object.assign(state, newstate, { connected: true })
        blockapi.notify('success', 'Wallet connected')
        console.log(state.account);
    }
    const disconnected = function (e) {
        if (e?.message) {
            blockapi.notify('error', e.message)
        } else {
            blockapi.notify('success', 'Wallet disconnected')
        }
    }
    // const contract = blockapi.contract('vesting');
    // initCountdownTimer()

    // PROGRESS BAR & TOKEN COUNT
    const progressMeter = document.getElementById("progress-fill-box");
    const tokenAmountVested = document.getElementById("token-amount-vested")
    const totalTokenSupply = document.getElementById("total-token-supply")
    async function updateProgressBar(_totalSupply, _amountOfTokensPurchased) {
        let totalSupplyStr = `of ${_totalSupply}M`;
        let tokensVestedStr = `${_amountOfTokensPurchased} $GRYPH Vesting`;
        let value = _totalSupply / _amountOfTokensPurchased;
        progressMeter.style.width = `${value}%`;
        tokenAmountVested.innerText = tokensVestedStr;
        totalTokenSupply.innerText = totalSupplyStr;

    }
    // Gryph to ETH Converter
    const ethTotalContainer = document.querySelector(".total-container");
    const ethTotalValue = document.getElementById("eth-total-value");
    const toolTipContainer = document.getElementById("tooltip-container");
    const tokenConversionMultiplier = 0.000005; //used to 
    // EVENTS
    const purchaseInput = document.getElementById("amount");
    async function calculateToEth(e) {
        let total = e.target.value;
        let ethTotal = (total * tokenConversionMultiplier).toFixed(6);
        if (total) {
            ethTotalContainer.style.display = 'flex';
            ethTotalValue.textContent = `${ethTotal
                } ETH`;

        } else {
            ethTotalContainer.style.display = 'none';
        }
        let amount = await e.target.value;
        console.log(amount);
    }
    purchaseInput.addEventListener('keyup', calculateToEth);
    purchaseInput.addEventListener('onf', calculateToEth);


    // Connect to web3 & grab data from blockchain
    if (!state.account) {
        blockapi.connect(blockmetadata, async function (newstate) {
            await connected(newstate)
            // TODO: pull token data into progress bar
            await updateProgressBar(100, 50)
        }, disconnected)
        return false;
    }
})();