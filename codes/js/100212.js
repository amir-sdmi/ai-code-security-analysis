document.addEventListener("DOMContentLoaded", function () {
    filterSelection("all");

    function filterSelection(c) {
        let items = document.querySelectorAll(".photos-item");
        if (c === "all") {
            items.forEach((item) => item.classList.add("show"));
        } else {
            items.forEach((item) => {
                item.classList.remove("show");
                if (item.classList.contains(c)) {
                    item.classList.add("show");
                }
            });
        }
    }

    let btnContainer = document.getElementById("photos-buttons");
    let btns = btnContainer.getElementsByClassName("portfolio-btn");

    for (let i = 0; i < btns.length; i++) {
        btns[i].addEventListener("click", function () {
            let current = document.querySelector(".portfolio-btn.active");
            if (current) current.classList.remove("active");
            this.classList.add("active");
            filterSelection(this.getAttribute("onclick").split("'")[1]);
        });
    }
});
// Code created by W3Schools.com
// Edited with ChatGPT.com