(() => {
  var TxtType = function (el, toRotate, period) {
    this.toRotate = toRotate;
    this.el = el;
    this.loopNum = 0;
    this.period = parseInt(period, 10) || 2000;
    this.txt = '';
    this.tick();
    this.isDeleting = false;
  };

  TxtType.prototype.tick = function () {
    var i = this.loopNum % this.toRotate.length;
    var fullTxt = this.toRotate[i];
    if (this.isDeleting) {
      this.txt = fullTxt.substring(0, this.txt.length - 1);
    } else {
      this.txt = fullTxt.substring(0, this.txt.length + 1);
    }
    this.el.innerHTML = this.txt;
    var that = this;
    var delta = 200 - Math.random() * 100;
    if (this.isDeleting) { delta /= 2; }
    if (!this.isDeleting && this.txt === fullTxt) {
      delta = this.period;
      this.isDeleting = true;
    } else if (this.isDeleting && this.txt === '') {
      this.isDeleting = false;
      this.loopNum++;
      delta = 500;
      //emit custom event
      const customEvent = new CustomEvent('typewriter-next')
      customEvent.index = this.loopNum % this.toRotate.length
      customEvent.text = this.toRotate[this.loopNum % this.toRotate.length]
      window.dispatchEvent(customEvent)
    }
    setTimeout(function () {
      that.tick();
    }, delta);
  };

  function typewrite() {
    if (toRotate === 'undefined') {
      changeText()
    }
    else
      var elements = document.getElementsByClassName('typewrite');
    for (var i = 0; i < elements.length; i++) {
      var toRotate = elements[i].getAttribute('data-values');
      var period = elements[i].getAttribute('data-period');
      if (toRotate) {
        new TxtType(elements[i], toRotate.split(","), period);
      }
    }
  };
  window.addEventListener('load', typewrite);
})()