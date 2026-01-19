
//icon click for social handel
const yt= document.querySelector(".fa-youtube");
yt.onclick = () =>{
    if(document.querySelector('.ytpop').style.display ==="none"){
    document.querySelector('.ytpop').style.display ="block";}
    else{
        document.querySelector('.ytpop').style.display ="none";
    };
};

const lk = document.querySelector(".fa-linkedin");
lk.onclick =()=>{
    if(document.querySelector('.ldpop').style.display ==="none"){
        document.querySelector('.ldpop').style.display ="block";}
        else{
            document.querySelector('.ldpop').style.display ="none";
        };
};

// using function within html
function showpop3() {
    if(document.querySelector('.inpop').style.display ==="none"){
        document.querySelector('.inpop').style.display ="block";}
        else{
            document.querySelector('.inpop').style.display ="none";
        };
}

//tried closing pop by clicking anywhere over screen
// document.getElementById('.ytpop').addEventListener("click", function(event) {
//     if (event.target === event.currentTarget) {
//         document.getElementById('.ytpop').style.display = "none";
//     }
// });


// menue bar naviagtion
const aboutLink = document.querySelector('.menue p:nth-child(1)');
const projectsLink = document.querySelector('.menue p:nth-child(2)');
const skillsLink = document.querySelector('.menue p:nth-child(3)');
const contactLink = document.querySelector('.menue p:nth-child(4)');

aboutLink.addEventListener('click', () => {
  document.querySelector('.about').scrollIntoView({ behavior: 'smooth' });
});

projectsLink.addEventListener('click', () => {
  document.querySelector('.projects').scrollIntoView({ behavior: 'smooth' });
});

skillsLink.addEventListener('click', () => {
  document.querySelector('.skills').scrollIntoView({ behavior: 'smooth' });
});

contactLink.addEventListener('click', () => {
  document.querySelector('.inf').scrollIntoView({ behavior: 'smooth' });
});

//project code


//real state code
const width = 500;
const height = 300;
const leftPosition = (window.screen.width - 80)/2;
const topPosition = (window.screen.height - 500) / 2;

document.querySelector(".realcode").onclick=()=>{
   window.open('real_state/', 'PopupWindow', `width=${width},height=${height},left=${leftPosition},top=${topPosition}`);
}

//movie code
const mwidth = 500;
const mheight = 300;
const mleftPosition = (window.screen.width - 1200)/2;
const mtopPosition = (window.screen.height - 200) / 2;
 document.querySelector(".moviecode").onclick=()=>{
  window.open("movie_app/",'popwindow', `width=${mwidth},height=${mheight},left=${mleftPosition},top=${mtopPosition}`)
 }

 //movie live
 const mlwidth = 500;
const mlheight = 300;
const mlleftPosition = (window.screen.width - 1700)/2;
const mlltopPosition = (window.screen.height - 200) / 2;
 document.querySelector(".movielive").onclick=()=>{
  window.open("movie_live/",'popwindow', `width=${mlwidth},height=${mlheight},left=${mlleftPosition},top=${mlltopPosition}`)
 }


//after form submit remain on same page

// const but = document.querySelector(".btn")
// but.addEventListener ('click',()=>{
//   if (window.history.state && window.history.state.from === "/register") {
//     // User is already on "/register", no need to navigate
//     return;
//   }

//   const url = "/register";
//   history.pushState({ from: window.location.pathname }, null, url);
// });
 // $(document).on('submit','#post-form',function(e){
  //   e.preventDefault();
  //   $.ajax({
      // type:'POST',
      // url:'/register',
      // data:{
      //   firstname:$('.firstname').val(),
      //   lastname:$('.lastname').val(),
      //   email:$('.email').val(),
      //   value:$('.value').val(),
      //   csrfmiddlewaretoken:$('input[name = csrfmiddlewaretoken]').val(),
      // },
      // success: function(data){
      //   // alert(data)
      // }
        //   });
  //   // document.getElementById('message').value = '';
  // });


//  Initialize Swiper

// my try
const left = document.querySelector('.fa-chevron-left');
const right = document.querySelector('.fa-chevron-right');
const set1 = document.querySelector('.set1');
const set2 = document.querySelector('.set2');
const set3 = document.querySelector('.set3');

function showSet() {

  if (set2.style.display === "none" && set3.style.display === "none"){
    set2.style.display = "flex";
    set1.style.display = "none";
    
  }else if (set3.style.display === "none" && set1.style.display === "none") {
    set3.style.display = "flex";
    set2.style.display = "none";

  }else{
    set1.style.display = "flex";
    set2.style.display = "none";
    set3.style.display = "none";
  };


};

left.onclick=()=>{
  showSet()

}
right.onclick=()=>{
  showSet()

}

//using chatgpt 
// const left = document.querySelector('.fa-chevron-left');
// const right = document.querySelector('.fa-chevron-right');
// const sets = document.querySelectorAll('.set1, .set2, .set3');

// let currentSetIndex = 0;

// function showSet(index) {
//   sets.forEach((set, i) => {
//     set.style.display = i === index ? 'flex' : 'none';
//   });
// }

// // Initially, show the first set
// showSet(0);

// left.onclick = () => {
//   currentSetIndex = (currentSetIndex - 1 + sets.length) % sets.length;
//   showSet(currentSetIndex);
// };

// right.onclick = () => {
//   currentSetIndex = (currentSetIndex + 1) % sets.length;
//   showSet(currentSetIndex);
// };



//  const swiper = new Swiper('.swiper', {
//   loop: true,
//   // If we need pagination
//   pagination: {
//     el: '.swiper-pagination',
//   },
//   // Navigation arrows
//   navigation: {
//     nextEl: '.swiper-button-next',
//     prevEl: '.swiper-button-prev',
//   },
// });



document.querySelector(".shop").addEventListener('click', () => {
  window.location.href = "/comics/";
  document.querySelector(".shop").style.color = "yellowgreen";
  document.querySelector(".shop").style.backgroundColor = "white";
  document.querySelector(".shop").style.transform = 'scale(1)';
  setTimeout(() => {
    // button.style.right = '0px';
    document.querySelector(".shop").style.transform = 'scale(1.2)';
  });
  // document.querySelector(".shop").style.right = '0px';

});



// document.querySelector("")