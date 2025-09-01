(async () => {
    // WEB3
    const state = { connected: false }
    const connected = async function (newstate) {
        Object.assign(state, newstate, { connected: true })
        blockapi.notify('success', 'Wallet connected')
        console.log("user connected address", state.account);
    }
    const disconnected = function (e) {
        if (e?.message) {
            blockapi.notify('error', e.message)
        } else {
            blockapi.notify('success', 'Wallet disconnected')
        }
    }
    const contract = await blockapi.contract('vesting');
    const contractAddress = contract._address;
    console.log("contract address", contractAddress);

    // GLOBAL VARIABLES
    const loadingBox = document.getElementById
        ('loading-box')
    const tokenForm = document.getElementById('token-sale-form')

    // COUNTDOWN TIMER
    const countdown = document.querySelector(".countdown");
    const expiredMessage = document.getElementById("countdown-expired-message");
    const endSaleDate = new Date("March 26, 2022 15:37:25").getTime();
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
            tokenForm.style.display = 'none'
            loadingBox.style.display = 'block'
            loadingBox.innerHTML = `
        <h3 class="text-center">Token sale has ended</h3>
        `
            // expiredMessage.style.display = "flex";
            // expiredMessage.innerHTML = `<h2 class="small">Token Sale has ended</h2>`;
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
    // CALCULATE GRYPH TO ETH
    const orderButton = document.getElementById('order-button');
    const ethTotalContainer = document.querySelector(".total-container");
    const ethTotalValue = document.getElementById("eth-total-value");
    const currentTokenPrice = await blockapi.read(contract, 'currentTokenPrice');
    const toolTipContainer = document.getElementById("tooltip-container");
    const toolTipMultiplier = document.getElementById("tooltip-multiplier");
    const purchaseInput = document.getElementById("amount");
    let purchaseAmount; // number of GRYPH Tokens
    let ehtAmount; // total price in ETH
    let oneGryphToEther; // price of 1 gryph in ETH
    async function calculateToEth(e) {
        purchaseAmount = e.target.value;
        // Convert gryph price(wei) into ether
        oneGryphToEther = await blockapi.toEther(currentTokenPrice, 'string')
        ehtAmount = (oneGryphToEther * purchaseAmount).toFixed(6);
        if (purchaseAmount) {
            ethTotalContainer.style.display = 'flex';
            ethTotalValue.textContent = `${ehtAmount
                } ETH`;
        } else {
            ethTotalContainer.style.display = 'none';
        }
    }
    async function numbersOnly(evt) {
        if (evt.which != 8 && evt.which != 0 && evt.which < 48 || evt.which > 57) {
            evt.preventDefault();
        }
    }


    // BUY TOKENS
    async function buy() {
        if (!purchaseInput.value) {
            blockapi.notify('error', 'Please enter a purchase amount')
            return false
        }
        // Ensure Connection to
        if (!state.account) {
            blockapi.connect(blockmetadata, async function (newstate) {
                await connected(newstate)
            }, disconnected)
            return false
        }

        let rpc;
        payableAmount = currentTokenPrice * purchaseAmount;
        try {
            rpc = blockapi.send(
                contract,
                state.account,
                'buy(address,uint256)',
                payableAmount, // value
                state.account,
                purchaseAmount // amount of gryph tokens
            )
        } catch (e) {
            blockapi.notify('error', e.message)
            return false;
        }


        rpc.on('transactionHash', function (hash) {
            // Hide TokenForm and display Processing message 
            let loadingMessage = `Do not close this window...`
            tokenForm.style.display = 'none'
            loadingBox.style.display = 'block'
            loadingBox.innerHTML = `
            <h3 class="text-center">${loadingMessage}</h3>
            <span class="small text-center">Window will automaitcally refresh when transaction is confirmed...</span>`

            blockapi.notify(
                'success',
                `Transaction started for purchase of "${purchaseAmount} $GRYPH": <a href="${blockmetadata.chain_scan}/tx/${hash}" target="_blank">
          etherscan.com
        </a>`,
                1000000
            )
        })
        rpc.on('receipt', function (receipt) {
            blockapi.notify(
                'success',
                `Success! You purchased "${purchaseAmount} $GRYPH for ${ehtAmount} ETH" View details: <a href="${blockmetadata.chain_scan}/tx/${receipt.transactionHash}" target="_blank">
          etherscan.com</a>. Browser will refresh soon...`
                , 1000000)
        })

        try {
            await rpc
            setTimeout(function () {
                location.reload()
            }, 10000);
        } catch (e) {
            blockapi.notify('error', e.message)
        }
        return false
    }
    // EVENTS
    purchaseInput.addEventListener('input', function (e) {
        if (parseInt(e.target.value) == 0 ||
            (e.target.value?.length == undefined || e.target.value.length == 0)) {
            orderButton.disabled = true
        } else {
            orderButton.disabled = false
        }
    })
    purchaseInput.addEventListener('keypress', numbersOnly)
    purchaseInput.addEventListener('keyup', calculateToEth)
    orderButton.addEventListener('click', buy, false)

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