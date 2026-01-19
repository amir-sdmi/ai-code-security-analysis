
const searchInput = document.querySelector("input")
const cards = document.querySelector(".cards")
const fullReceipeBtn = document.querySelector(".publisher-receipe-container > button");
const ingredients = document.querySelector(".full-receipe")
const loadingLayer = document.querySelector(".loading-layer");
const bookmarksContainer = document.querySelector(".buttons-container");
const allBtnsContainer = document.querySelector(".all-btns-container");
const collapseBtn = document.querySelector("button.collapse");
const currentFoodh3 = document.querySelector("h3.current-search");
const bookmarksAlert = document.querySelector("div.alert.alert-danger")
const myModal = document.querySelector("div.my-modal")
const chevronContainer = document.querySelector("div.my-modal .chevron-container")
const xMark = document.querySelector("div.my-modal .fa-xmark")
let bookmarksArray = [];
const bookmarkedIndecies = (JSON.parse(sessionStorage.getItem("bookmarkedIndecies"))) || [] ;
let currentRecipes = []
let index = 0 ;


// list of all the food with emojis made with ChatGPT
const foodItemsWithEmojis = [
    "carrot 🥕", "broccoli 🥦", "asparagus 🥬", "cauliflower 🥦", "corn 🌽", 
    "cucumber 🥒", "green pepper 🫑", "lettuce 🥬", "mushrooms 🍄", "onion 🧅", 
    "potato 🥔", "pumpkin 🎃", "red pepper 🌶️", "tomato 🍅", "beetroot 🥕", 
    "brussel sprouts 🥦", "peas 🥬", "zucchini 🥒", "radish 🥕", "sweet potato 🍠", 
    "artichoke 🥬", "leek 🥬", "cabbage 🥬", "celery 🥬", "chili 🌶️", 
    "garlic 🧄", "basil 🌿", "coriander 🌿", "parsley 🌿", "dill 🌿", 
    "rosemary 🌿", "oregano 🌿", "cinnamon 🌿", "saffron 🌾", "green bean 🥬", 
    "bean 🫘", "chickpea 🥬", "lentil 🥬", "apple 🍎", "apricot 🍑", 
    "avocado 🥑", "banana 🍌", "blackberry 🍇", "blackcurrant 🍇", "blueberry 🫐", 
    "boysenberry 🍇", "cherry 🍒", "coconut 🥥", "fig 🍈", "grape 🍇", 
    "grapefruit 🍊", "kiwifruit 🥝", "lemon 🍋", "lime 🍋", "lychee 🍇", 
    "mandarin 🍊", "mango 🥭", "melon 🍈", "nectarine 🍑", "orange 🍊", 
    "papaya 🥭", "passion fruit 🍈", "peach 🍑", "pear 🍐", "pineapple 🍍", 
    "plum 🍑", "pomegranate 🍎", "quince 🍎", "raspberry 🍓", "strawberry 🍓", 
    "watermelon 🍉", "salad 🥗", "pizza 🍕", "pasta 🍝", "popcorn 🍿", 
    "lobster 🦞", "steak 🥩", "bbq 🍖", "pudding 🍮", "hamburger 🍔", 
    "pie 🥧", "cake 🍰", "sausage 🌭", "tacos 🌮", "kebab 🥙", 
    "poutine 🍟", "seafood 🍤", "chips 🍟", "fries 🍟", "masala 🍛", 
    "paella 🥘", "som tam 🍲", "chicken 🍗", "toast 🍞", "marzipan 🍬", 
    "tofu 🍲", "ketchup 🍅", "hummus 🥙", "chili 🌶️", "maple syrup 🥞", 
    "parma ham 🍖", "fajitas 🌮", "champ 🍲", "lasagna 🍝", "poke 🍣", 
    "chocolate 🍫", "croissant 🥐", "arepas 🍞", "bunny chow 🍲", "pierogi 🍲", 
    "donuts 🍩", "rendang 🍲", "sushi 🍣", "ice cream 🍨", "duck 🍗", 
    "curry 🍛", "beef 🥩", "goat 🐐", "lamb 🍖", "turkey 🦃", 
    "pork 🍖", "fish 🐟", "crab 🦀", "bacon 🥓", "ham 🍖", 
    "pepperoni 🍕", "salami 🍖", "ribs 🍖"
]

foodItemsWithEmojis.sort()

// loading layer timer for 1.2S
function loadingLayerTiming(){
    loadingLayer.classList.replace("d-none", "d-flex")
    loadingLayer.classList.add("d-flex")
    setTimeout(() => {
            loadingLayer.classList.replace("d-flex",'d-none')
    }, 1200);
};

// loadingLayerTiming();


// displaying all buttons in the foldable container
var allCartoona = ''
for(var i = 0 ; i < foodItemsWithEmojis.length ; i++){
    var createdBtn = document.createElement("button");
    createdBtn.classList.add("btn", "btn-outline-primary",'m-1',"flex-shrink-0");
    if(bookmarkedIndecies.includes(i)){
        console.log("done");
        createdBtn.classList.replace("btn-outline-primary","btn-primary")
    }
    createdBtn.innerHTML = foodItemsWithEmojis[i]
    allCartoona += createdBtn.outerHTML;
}
allBtnsContainer.innerHTML = allCartoona ;







function fetchFood(query){
    sessionStorage.setItem("now",`${query}`)
    return fetch(`https://forkify-api.herokuapp.com/api/search?q=${ query }`)
    .then(res=> res.json())

}

function fetchRecipe(rId){
    return fetch(`https://forkify-api.herokuapp.com/api/get?rId=${rId}`)
    .then(res=> res.json())

}




function displayRecipes(arr) {
    // loadingLayerTiming()
    searchInput.value = ""
    var recipesCartoona = '';
    for(var i = 0 ; i < arr.length ; i++)
                recipesCartoona += `
                    <div class="col-xl-4 col-lg-6 col-12">
                        <div class="cardo rounded-3 position-relative hov overflow-hidden" receipes="${arr[i]}">
                            <div class="image-container w-100 h-100 overflow-hidden">
                                <img src="${arr[i].image_url}" class="w-100 h-100" alt="">
                            </div>
                            <div class="text-container position-absolute bg-light bg-opacity-75 h-100 w-100 d-flex flex-column">
                                <h5 class="text-capitalize text-center mt-2 flex-grow-1 d-flex align-items-center justify-content-center">${arr[i].title}</h5>
                                <div class="publisher-receipe-container w-100 position-absolute bottom-0 start-0 mb-2 d-flex align-items-center justify-content-around">
                                    <div class="publisher text-center mb-2 d-flex flex-column align-items-center justify-content-center">
                                        <h5 class="h6 w-fit-content">-- Publisher --</h5>
                                        <a href="${arr[i].publisher_url}" target="_blank" class="h6 text-capitalize">${arr[i].publisher}</a>
                                    </div>
                                    <button class="btn btn-outline-danger fw-bold" idx="${i}">ingredients</button>
                                </div>
                            </div>
                            <div class="h-100 d-flex flex-column justify-content-center full-receipe position-absolute top-0 d-none" receipeId="${arr[i].recipe_id}">
                                <div class="ingredients-btn-container py-2 px-3 d-flex flex-column" receipe_id="${arr[i].recipe_id}">
                                    <div class="close-container flex-grow-1 d-flex justify-content-end align-items-end">
                                        <div class="right-section w-100 h-100 d-flex justify-content-between align-items-center">
                                            <a class="btn btn-outline-warning d-block px-5 fw-bold" href="${arr[i].source_url}" target="_blank">Full Recipe</a>
                                            <button class="btn btn-outline-info d-block  px-5 fw-bold" receipeid="${arr[i].recipe_id}">Close</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            cards.innerHTML = recipesCartoona;
}


function displayIngredients(ingredientsObject){
    var ingredientsArray = ingredientsObject.recipe.ingredients ;
    var list = document.createElement("ul")
    list.classList.add("list-group", "w-100")
    for(var i = 0 ; i<ingredientsArray.length ; i++){
        var li = document.createElement("li");
        li.classList.add("list-group-item","list-group-item-action","list-group-item-light","overflowy-auto") 
        li.innerHTML = ingredientsArray[i]
        list.append(li) ;
    }
    return list ;

}


// input search functionality
searchInput.addEventListener("change",function(e){
    var specifiedItem = foodItemsWithEmojis.filter(item => item.includes(searchInput.value.toLowerCase()))[0];
    displayCurrentSearch(specifiedItem)
    fetchFood(deleteLatestElement(specifiedItem))
    .then(res=> {
        currentRecipes = res.recipes
        console.log(res.recipes);
        displayRecipes(res.recipes)

    })


})


// display current search in text
function displayCurrentSearch(specifiedItem){
    currentFoodh3.innerHTML = specifiedItem ;
}

console.log("okkkk")



// Controlling Bookmarks 
allBtnsContainer.addEventListener("click",function(e){
    if(!e.target.classList.contains("all-btns-container")){
            if(bookmarksArray.indexOf(e.target.innerHTML) == -1 ){
                if(bookmarksArray.length < 5 ){
                    e.target.classList.replace("btn-outline-primary","btn-primary")
                    bookmarksArray.push(e.target.innerHTML)
                    bookmarkedIndecies.push(foodItemsWithEmojis.indexOf(e.target.innerHTML))
                    sessionStorage.setItem("bookmarkedIndecies",JSON.stringify(bookmarkedIndecies))
                    console.log(bookmarkedIndecies);
                    sessionStorage.setItem("bookmarks",JSON.stringify(bookmarksArray))
                    console.log(e.target.innerHTML);
                    bookmarksAlert.classList.add("d-none")
                    dispalyBookmarks();
                }
                else{
                    bookmarksAlert.classList.remove("d-none")
                    setTimeout(() => {
                        bookmarksAlert.classList.add("d-none")
                    }, 2000);
                }
            }
            else{
                bookmarksAlert.classList.add("d-none")
                e.target.classList.replace("btn-primary","btn-outline-primary")
                removeItemByValue(bookmarkedIndecies,(foodItemsWithEmojis.indexOf(e.target.innerHTML)))
                sessionStorage.setItem("bookmarkedIndecies",JSON.stringify(bookmarkedIndecies))
                bookmarksArray.splice(bookmarksArray.indexOf(e.target.innerHTML),1)
                sessionStorage.setItem("bookmarks",JSON.stringify(bookmarksArray))
                dispalyBookmarks()
            }
        }
        
    })


function dispalyBookmarks(){
    bookmarksContainer.innerHTML = "";
        bookmarksArray.forEach((element) => {
            var createdElement = document.createElement("btn");
            createdElement.classList.add("btn","btn-outline-info","m-2");
            createdElement.innerHTML = element;
            bookmarksContainer.append(createdElement);
        })


}

bookmarksContainer.addEventListener("click",function(e){
    if(!e.target.classList.contains("buttons-container")){
        displayCurrentSearch(e.target.innerHTML)
        fetchFood(deleteLatestElement(e.target.innerHTML))
        .then(res=> {
            displayRecipes(res.recipes)
            currentRecipes = res.recipes
            console.log(currentRecipes);
        })
    }
})



// changing btn to and from outline when clicked
collapseBtn.addEventListener("click", function(){
    if(this.getAttribute("clicked") != 1){
        this.classList.replace("btn-outline-success" ,"btn-success");
        this.setAttribute("clicked","1")
    }
    else if(this.getAttribute("clicked") == 1){
        this.classList.replace("btn-success","btn-outline-success")
        this.setAttribute("clicked","0")
    }
})

function displayRecipes24(idx , arr){

}

// Displaying ingredients fetching it once and displaying it all the time 
cards.addEventListener("click", function (e){
    if(e.target.classList.contains("btn-outline-danger")){
        let index = Number(e.target.getAttribute("idx"))
        modalData(index , currentRecipes)
        document.body.classList.add("overflow-hidden")
        if(e.target.getAttribute("done") == "1"){
            ingredientsLayer.classList.remove("d-none");
        }
        // else{
        //     e.target.setAttribute("done","1")
        //     fetchRecipe(ingredientsLayer.getAttribute("receipeid"))
        //     .then((res)=> {
        //         ingredientsLayer.querySelector(".ingredients-btn-container").prepend(displayIngredients(res))
        //         ingredientsLayer.classList.remove("d-none");
        // })
        // }

    }
    
    if(e.target.getAttributeNames().includes("receipeid")){
        e.target.parentElement.parentElement.parentElement.parentElement.classList.add("d-none")
    }
})

function modalData(idx, arr){
    let currentObject = arr[idx]
    console.log(currentObject)
    myModal.querySelector(".img-container img").setAttribute("src",currentObject.image_url)
    chevronContainer.setAttribute("prev",`${ idx-1 < 0 ? arr.length-1 : idx-1 }`);
    chevronContainer.setAttribute("current",`${idx}`);
    chevronContainer.setAttribute("next",`${ idx + 1 > arr.length-1 ? 0 : idx+1 }`);
    fetchRecipe(currentObject.recipe_id)
    .then((res)=>{
        myModal.querySelector("ul").innerHTML = displayIngredients(res).innerHTML
        myModal.classList.remove("d-none")
        myModal.querySelector("h3").innerHTML = currentObject.title
    })
}





myModal.addEventListener("click", e =>{
    console.log();
    if(e.target == myModal){
        myModal.classList.add("d-none")
        document.body.classList.remove("overflow-hidden")
    }
})

document.addEventListener("keydown",(e)=>{
    if(e.key == "Escape"){
        myModal.classList.add("d-none")
        document.body.classList.remove("overflow-hidden")
    }
    if(e.key == "ArrowRight"){
        chevronContainer.querySelector(".fa-chevron-right").click()
    }
    if(e.key == "ArrowLeft"){
        chevronContainer.querySelector(".fa-chevron-left").click()

    }
})
xMark.addEventListener("click", e=> {
    myModal.classList.add("d-none")
    document.body.classList.remove("overflow-hidden")
})

chevronContainer.addEventListener("click", (e)=>{
    if(e.target.classList.contains("fa-chevron-right")){
        console.log("next");
        console.log(currentRecipes)
        modalData(Number(chevronContainer.getAttribute("next")),currentRecipes)
        console.log(Number(chevronContainer.getAttribute("next")))
        
    }
    if(e.target.classList.contains("fa-chevron-left")){
        console.log("left");
        modalData(Number(chevronContainer.getAttribute("prev")),currentRecipes)
    }
})




var firstItemInArray = foodItemsWithEmojis.filter(item => item.includes(sessionStorage.getItem("now") ||searchInput.value.toLowerCase()  || "pizza"))[0];
var cleanedValueForFetch = removeItem(firstItemInArray.split(" ")).join(" ");

// first fetch when opening the Website

fetchFood(cleanedValueForFetch)
.then(function(resultArray){
    currentRecipes = resultArray.recipes;
    console.log(currentRecipes);
    displayRecipes(resultArray.recipes)
    displayCurrentSearch(firstItemInArray)
    bookmarksArray = JSON.parse(sessionStorage.getItem("bookmarks")) || []
    dispalyBookmarks()
})



function removeItem(array) {
    array.pop()
    return array;
}

function deleteLatestElement(given){
    return removeItem(given.split(" ")).join(" ");
}

function removeItemByValue(array, value) {
    const index = array.indexOf(value);
    if (index !== -1) {
        array.splice(index, 1);
    }
    return array;
}

