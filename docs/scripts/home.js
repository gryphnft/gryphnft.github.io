(() => {
  const carousel = Array.from(document.querySelectorAll('#carousel img'))
  window.addEventListener('typewriter-next', (e) => {
    console.log(e.index, e.text)
    carousel.forEach((image, index) => {
      if (e.index == index) {
        image.classList.add('active')
      } else {
        image.classList.remove('active')
      }
    })
  })
})()