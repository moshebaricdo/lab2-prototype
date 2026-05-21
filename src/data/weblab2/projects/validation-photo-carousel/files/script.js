// When the button is clicked, hide the first photo and show the second one
document.querySelector("#next").addEventListener("click", () => {
    document.querySelector("#caption").textContent = "Morning trail through the pines";
    document.querySelector("#photo1").style.display = "none";
    document.querySelector("#nextPhoto").style.display = "block";
  });
  