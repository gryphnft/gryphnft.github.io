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
    const contract = await blockapi.contract('vesting');


    // COUNTDOWN TIMER
    const countdown = document.querySelector(".countdown");
    const expiredMessage = document.getElementById("countdown-expired-message");
    const endSaleDate = new Date("March 25, 2022 15:37:25").getTime();
    // Update the count down every 1 second
    let x = setInterval(function () {
        // Get today's date and time
        let now = new Date().getTime();
        // Find the distance between now and the count down date
        let distance = endSaleDate - now;
        // Time calculations for days, hours, minutes and seconds
        let days = Math.floor(distance / (1000 * 60 * 60 * 24));
        let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((distance % (1000 * 60)) / 1000);
        // Display the result in the element with id="demo"
        document.getElementById("days").innerHTML = days;
        document.getElementById("hours").innerHTML = hours;
        document.getElementById("minutes").innerHTML = minutes;
        document.getElementById("seconds").innerHTML = seconds;
        // If the count down is finished, write some text
        if (distance < 0) {
            clearInterval(x);
            expiredMessage.style.display = "flex";
            expiredMessage.innerHTML = `<h2 class="small">Token Sale has ended</h2>`;
        } else {
            countdown.style.display = "flex";
        }
    }, 1000);


    // PROGRESS BAR & TOKEN COUNT
    const progressMeter = document.getElementById("progress-fill-box");
    const tokenAmountVested = document.getElementById("token-amount-vested")
    const totalTokenSupply = document.getElementById("total-token-supply")
    async function updateProgressBar(_totalSupply, _amountOfTokensPurchased) {
        let total = Number(_totalSupply).toLocaleString('en-US');
        let purchased = Number(_amountOfTokensPurchased).toLocaleString('en-US');
        let totalSupplyStr = `of ${total}M`;
        let tokensVestedStr = `${purchased} $GRYPH Vesting`;
        let value = _totalSupply / _amountOfTokensPurchased;
        progressMeter.style.width = `${value}%`;
        tokenAmountVested.innerText = tokensVestedStr;
        totalTokenSupply.innerText = totalSupplyStr;
    }
    // Gryph to ETH Converter
    const ethTotalContainer = document.querySelector(".total-container");
    const ethTotalValue = document.getElementById("eth-total-value");
    const toolTipContainer = document.getElementById("tooltip-container");
    const toolTipMultiplier = document.getElementById("tooltip-multiplier");
    const currentTokenPrice = await blockapi.read(contract, 'currentTokenPrice');
    const purchaseInput = document.getElementById("amount");
    async function calculateToEth(e) {
        let purchaseAmount = e.target.value;
        // Convert gryph price(wei) into ether
        let etherValueOfGryph = await blockapi.toEther(currentTokenPrice, 'string')
        let ethTotal = (etherValueOfGryph * purchaseAmount).toFixed(6);
        if (purchaseAmount) {
            ethTotalContainer.style.display = 'flex';
            ethTotalValue.textContent = `${ethTotal
                } ETH`;
        } else {
            ethTotalContainer.style.display = 'none';
        }
        let amount = await e.target.value;
        console.log(amount);
    }
    // EVENTS
    purchaseInput.addEventListener('keyup', calculateToEth);
    purchaseInput.addEventListener('onf', calculateToEth);


    // Connect to web3 & grab data from blockchain
    if (!state.account) {
        blockapi.connect(blockmetadata, async function (newstate) {
            await connected(newstate);
            const readTotalVested = await blockapi.read(contract, 'currentTokenLimit');
            const readCurrentVested = await blockapi.read(contract, 'currentTokenAllocated');
            await updateProgressBar(readTotalVested, readCurrentVested);
        }, disconnected)
        return false;
    }
})();