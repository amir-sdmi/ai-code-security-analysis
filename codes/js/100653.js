let lastScrollY = window.scrollY; 
const header = document.querySelector('.headercontainer'); 

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY; 

    if (currentScrollY > lastScrollY && currentScrollY > 50) {
        
        header.classList.add('hidden');
    } else if (currentScrollY < lastScrollY) {
        
        header.classList.remove('hidden');
    }

    
    lastScrollY = currentScrollY;
});


const container = document.querySelector('.scroll-list-container ');
const image = document.querySelector('.selfie');


container.addEventListener('mousemove', (event) => {
    
    const containerRect = container.getBoundingClientRect();
    const mouseX = event.clientX - containerRect.left;
    const mouseY = event.clientY - containerRect.top;

   
    const moveX = (mouseX / container.offsetWidth - 0.5) * 20;  
    const moveY = (mouseY / container.offsetHeight - 0.5) * 20; 

   
    image.style.transform = `translate(-50%, -50%) translate(${moveX}px, ${moveY}px)`;
});



const backToTopButton = document.querySelector('.backtotop');
backToTopButton.onclick = function() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
};

/*with chatgpt helping*/




