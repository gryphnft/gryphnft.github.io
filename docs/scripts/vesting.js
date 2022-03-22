const progressMeter = document.querySelector(".progress-fill");

// convert time
const toSeconds = (_time) => {

}

function updateProgress(value) {
    progressMeter.style.width = `${value}%`;
}