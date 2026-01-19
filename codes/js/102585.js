jQuery.noConflict();
jQuery(document).ready(function( $ ){
    // initialize variables
    var currentItemId;
    var currentImageId;
    var items = [];
    var allItemIds = [];
    var allItemNameswithImages = [];
    var numberOfImages = [];
    var allItemBios = [];
    var allItemOrder = [];
    var allItemImageIds = [];
    var allImagesOfItems = [];
    var wrongOrderIds = [];
    var personLoggedIn = false;
    var itemIconArray = []; // the array built to house all the items and info in the icon stage, to be sorted to allItemOrder
    // these will be copies of the original array for item order as the original is used 4 times to reorder other arrays
    // and .sort() changes the original array.  I'm not sure I'll need them, but just in case.
    var sourceOneAllItemOrder = [];
    var sourceTwoAllItemOrder = [];
    var sourceThreeAllItemOrder = [];
    var sourceFourAllItemOrder = [];
    var sourceFiveAllItemOrder = [];
    var sourceAllItemIds = [];
    var sourceAllItemNameswithImages = [];
    var sourceAllItemBios = [];
    var sourceAllItemImageIds = [];
    var sourceNumberOfImages = [];
    // variables for editing data
    var thisImageId; //data-id of image
    var dataNoOfImages = 0;
    var clickOnImg = false;
    var horTitle = "notyet";
    var horDesc = "notyet";

    // code to bring up User's biography modal
    $(document).on("click", "#personsBioPoint", function(event) {
        event.preventDefault();
        $("#personsBioShow").modal("show");
    });

    // Need to add the inital load code that shows the user the item's currently in the db.
    fetchAndDisplayItems();
    //Code to get all the items in the db listed 
    // then go through each item, and create in the currentItems div a name and 1st image of that item.
    // Make that pic clickable to bring up other biography and other pictures down below.
    // This should be visible to all users.
    
    function waitOnPower() {
        // change background to blue items
        // $("body").css({
        //     'background-image' : 'url("/assets/pictures/fadeRanch.jpg")',
        //     'background-size' : 'cover'
        //     //'background-position' : 'center top'
        // });
        // var power = $("<img>");
        // power.attr("src","assets/pictures/greenstart.jpg" );
        // power.attr("id","revealItems");
        // $("#powerOnGoes").append(power);
        revealItems();
    }
    //
    // Here is the code to combine getAllData and revealItems into more efficient code. By gemini
    async function fetchAndDisplayItems() {
        try {
          const logoutButton = document.getElementById("logoutButton");
          const createItemButton = document.querySelector("button#createItem");
          const currentItems = document.getElementById("currentItems");
          const itemWaiting = document.getElementById("itemWaiting");
      
          if (personLoggedIn) {
            logoutButton.style.display = "inline-block";
            createItemButton.style.display = "inline-block";
            currentItems.style.display = "block";
          } else {
            logoutButton.style.display = "none";
            createItemButton.style.display = "none";
            //currentItems.style.display = "none";
          }
      
          document.getElementById("revealItems")?.remove();
          itemWaiting.style.display = "inline-block";
          currentItems.innerHTML = "";
          //document.getElementById("itemHeader").style.display = "none";
          document.getElementById("editItemName").style.display = "none";
          document.getElementById("specificItem").innerHTML = "";
          document.getElementById("additionalImages").innerHTML = "";
          document.getElementById("additionalImages").style.backgroundColor = "transparent";
          document.getElementById("largeAddtlImages").innerHTML = "";
          document.getElementById("mainImageButtonSpace").innerHTML = "";

          const noImageYetElement = document.getElementById("noImageYet");
          if (noImageYetElement) {
                noImageYetElement.style.display = "none";
          }
          
      
          console.log("personLoggedIn: " + personLoggedIn);
      
          const response = await fetch("/getAllItems");
          const items = await response.json();
          console.log("items array, from fetchAndDisplayItems function", items);
          console.log("items.length: ", items.length);
          
          // removing this because the new Gemini code should correct for no items.
        //   if (items.length === 0) {
        //     console.log("waitOnPower is being called");
        //     waitOnPower();
        //     itemWaiting.style.display = "none"; // Hide waiting message even if no items
        //     return;
        //   }
      
          const processedItems = await Promise.all(
            items.map(async (item) => {
              if (item.image && item.image[0]) {
                const imageResponse = await fetch(`/getImages/${item.image[0]}`);
                const dataGetImages = await imageResponse.json();
                return { ...item, imagesData: dataGetImages };
              } else {
                currentItems.innerHTML += `<div class='itemTitles'><h4>${item.name}</h4><br><h5 class='noImage' data-itemid="${item._id}" data-toggle='modal' data-target='#newItemImageModal'>No Image</h5></div>`;
                return null;
              }
            })
          );
      
          const filteredItems = processedItems.filter((item) => item !== null);
          filteredItems.sort((a, b) => b.order - a.order);
      
          document.body.style.backgroundImage = 'url("/assets/pictures/fadeRanch.jpg")';
          document.body.style.backgroundSize = 'cover';
      
          filteredItems.forEach((item) => {
            const itemDiv = document.createElement("div");
            itemDiv.className = "itemTitles";
            itemDiv.setAttribute("onclick", "location.href='#specificItem'");
            itemDiv.setAttribute("target", "_self");
            itemDiv.dataset.itemid = item._id;
            itemDiv.dataset.name = item.name;
            itemDiv.dataset.bio = item.bio;
            itemDiv.dataset.order = item.order;
            itemDiv.dataset.noofimages = item.image.length;
      
            const itemName = document.createElement("h4");
            itemName.className = "lightText";
            itemName.textContent = item.name;
      
            itemDiv.appendChild(itemName);
            itemDiv.appendChild(document.createElement("br"));
            itemDiv.innerHTML += item.imagesData[0];
            currentItems.appendChild(itemDiv);
          });
      
        } catch (error) {
          console.error("Error fetching and displaying items:", error);
        } finally {
          itemWaiting.style.display = "none";
        }
    }
    
      // above is from Gemini
        //below is my previous getAllData()
    // function getAllData() {
    //     //empty out the current divs
    //     $("#logoutButton").hide();
    //     $("button#createItem").hide();
    //     $("#revealItems").remove(); //this is supposed to delete the element, not just hide it?
    //     $("#itemWaiting").show();
    //     $("#currentItems").empty();
    //     $("#currentItems").hide();
    //     $("#itemHeader").hide();
    //     $("#editItemName").hide();
    //     $("#specificItem").empty();
    //     $("#additionalImages").empty();
    //     $("#additionalImages").css("background-color", "transparent");
    //     $("#largeAddtlImages").empty();
    //     $("#mainImageButtonSpace").empty();  // remove the button - it should only appear when User creates a new item
    //     $("#noImageYet").hide();
    //     console.log("personLoggedIn: " + personLoggedIn);
    //     if (personLoggedIn === true) {
    //         $("#logoutButton").show();
    //         $("button#createItem").show();
    //         $("#currentItems").show();
    //     }
    //     // empty out items previously retrieved from the db, and overall arrays since page isn't reloaded to keep 
    //     // whether User is logged in or not
    //     items = [];
    //     allItemIds = [];
    //     allItemNameswithImages = [];
    //     numberOfImages = [];
    //     allItemBios = [];
    //     allItemOrder = [];
    //     allItemImageIds = [];
    //     allImagesOfItems = [];
    //     wrongOrderIds = [];

    //     // set a time to wait to add the power on button
    //     // setTimeout(waitOnPower, 8000);
        
    //     //get the list of items from the db
    //     $.getJSON("/getAllItems", function(items) {
    //         console.log("items array, from getAllData function", items);
    //         console.log("items.length: ", items.length);
    //         if (items.length === 0) {  //I put this here for when there aren't any items in db yet
    //             console.log("waitOnPower is being called");
    //             waitOnPower();
    //         }
    //         for (i=0; i<items.length; i++) {
    //             allItemIds.push (items[i]._id);
    //             allItemNameswithImages.push(items[i].name);
    //             allItemBios.push(items[i].bio);
    //             allItemOrder.push(items[i].order);
    //             console.log("after just getting all items, allItemOrder: ", allItemOrder);
    //             //this is a list of all the items without a main image
    //             if (typeof items[i].image[0] === "undefined") { //need to remove the names without an image
    //                 // The following should be written to the DOM ONLY when User is in edit mode
    //                 $("#currentItems").append("<div class='itemTitles'><h4>" + items[i].name + 
    //                 "</h4><br><h5 class='noImage' data-itemid=" + items[i]._id + " data-toggle='modal' data-target='#newItemImageModal'>No Image</h5></div>");
    //                 //remove THIS item from allItemNameswithImages array
    //                 allItemIds.pop();  //need to be sorted like allItemOrder
    //                 allItemNameswithImages.pop(); //need to be sorted like allItemOrder
    //                 allItemBios.pop(); //need to be sorted like allItemOrder
    //                 allItemOrder.pop();
    //                 //console.log("after .pop(), allItemNameswithImages: ", allItemNameswithImages);
    //                 //need to reorder these 4 arrays to match
    //                 //the correct order of items, and also the allItemImageIds array for the revealItem function below
    //             } else {
    //                 console.log("items[" + i + "].image[0]: " + items[i].image[0]);
    //                 allItemImageIds.push(items[i].image[0]); // array of image ids from 1st item db, need to be sorted like allItemOrder
    //                 //console.log("items[" + i + "].image.length: ", items[i].image.length);
    //                 //make an array of the number of images for each item
    //                 numberOfImages.push(items[i].image.length); //need to be sorted like allItemOrder
    //                 $.ajax({
    //                 method: "GET",
    //                 url: "/getImages/" + items[i].image[0]
    //                 })
    //                 .then(function(dataGetImages) { // dataGetImages is formatted Images from api-routes.js
    //                     //console.log("after getAllItems, then /getImages, the new dataGetImages: ", dataGetImages);
    //                     allImagesOfItems.push(dataGetImages);
    //                     const myArray = dataGetImages[0].split("data-id=", 6);
    //                     const myDataId = myArray[1].split(" ", 1);
    //                     //console.log("myDataId: ", myDataId);
    //                     // this was to "flatten" the array to become just an array of strings instead of array of array
    //                     wrongOrderIds.push.apply(wrongOrderIds, myDataId); //array of image ids from 2nd item db (differing order)
    //                     //console.log("wrongOrderIds: ", wrongOrderIds);
    //                     console.log("wrongOrderIds.length: ", wrongOrderIds.length);
    //                     console.log("allItemNameswithImages.length: ", allItemNameswithImages.length);
    //                     if (wrongOrderIds.length === allItemNameswithImages.length) {
    //                         console.log("wrongOrder.length = allItemNameswithImages.length");
    //                         //setTimeout(waitOnPower, 500);  //this adds a number of seconds to wait on the power button, not needed
    //                         revealItems();
    //                     }
    //                 });
    //             }
    //         }
            
    //     });
    // }

    //function for User to log in to see editable sections
    $(document).on("click", "#personname", function(event) {
        event.preventDefault();
        console.log("User has clicked log in!");
        $("#loginArtist").modal("show");
    });

    // after User enters his password and clicks submit
    $(document).on("click", "#submitPassword", function(event) {
        event.preventDefault();
        var password = $("#enterPass").val().trim();
        console.log("password: " + password);
        if (password === "sybil") {
            console.log("password is correct!");
            personLoggedIn = true;
            console.log("personLoggedIn: " + personLoggedIn);
            $("#enterPass").val("");
            $("#loginArtist").modal("hide");
            // now enter functions that are called to show User what they can edit.
            $("#logoutButton").show();
            $("button#createItem").show();
        } else {
            console.log("wrong password!");
            alert("wrong password!");
            $("#enterPass").val("");
        }
    });

    // when User clicks the Logout Button
    $(document).on("click", "#logoutButton", function(event) {
        event.preventDefault();
        window.location.replace("/");
    });
    //
    // below is the revealItems function that I'd used to sort and then show data.
    // gemini put these processes up in the fetchAndDisplayData function, so commenting it out here.
    // function to show the items from the database, sorted to match names with images
    //$(document).on("click", "#revealItems", function(event) {
    // function revealItems() {
    //     //event.preventDefault();
    //     $("#itemWaiting").hide();
    //     $("#currentItems").show();
    //     $("#itemHeader").show();
    //     $("#revealItems").remove();
    //     $("#editItemName").hide();
    //     $("#specificItem").empty();
    //     $("#additionalImages").empty();
    //     $("#additionalImages").css("background-color", "transparent");
    //     $("#largeAddtlImages").empty();
    //     itemIconArray = [];
    //     if (personLoggedIn === false) {
    //         $("#currentItems").empty(); // this empties out the items without images written to DOM from getAllData()
    //     }
    //     // change backgroud of body
    //     $("body").css({
    //         'background-image' : 'url("/assets/pictures/fadeRanch.jpg")',
    //         'background-size' : 'cover'
    //       });
    //     //first sort to get the order of items to match User's preferred order        
    //     // adding a sort numerically for allItemOrder, then sort the other 4 arrays the SAME WAY
    //     // this means the wrongOrderId and allImagesOfItems arrays will be sorted to this new order
    //     // down below in the function called by clicking #revealItems.
    //     // remember, sort will get rid of original, so splice to keep copies of originals
    //     sourceOneAllItemOrder = allItemOrder.slice(0);
    //     sourceAllItemIds = allItemIds.slice(0);
    //     sourceAllItemNameswithImages = allItemNameswithImages.slice(0);
    //     sourceAllItemBios = allItemBios.slice(0);
    //     sourceAllItemImageIds = allItemImageIds.slice(0);
    //     sourceNumberOfImages = numberOfImages.slice(0);

    //     //sort allItemOrder and record indices
    //     var indices = [...allItemOrder.keys()].sort((a, b) => allItemOrder[b] - allItemOrder[a]);
    //     // sort allItemImagesIds to match
    //     [allItemOrder, allItemImageIds] = [allItemOrder, allItemImageIds].map(a => indices.map(i => a[i]));

    //     //need the original allItemOrder for each sorting
    //     var sourceTwoAllItemOrder = sourceOneAllItemOrder.slice(0);
    //     var indices = [...sourceOneAllItemOrder.keys()].sort((a, b) => sourceOneAllItemOrder[b] - sourceOneAllItemOrder[a]);
    //     [sourceOneAllItemOrder, allItemIds] = [sourceOneAllItemOrder, allItemIds].map(a => indices.map(i => a[i]));

    //     var sourceThreeAllItemOrder = sourceTwoAllItemOrder.slice(0);
    //     var indices = [...sourceTwoAllItemOrder.keys()].sort((a, b) => sourceTwoAllItemOrder[b] - sourceTwoAllItemOrder[a]);
    //     [sourceTwoAllItemOrder, allItemNameswithImages] = [sourceTwoAllItemOrder, allItemNameswithImages].map(a => indices.map(i => a[i]));

    //     var sourceFourAllItemOrder = sourceThreeAllItemOrder.slice(0);
    //     var indices = [...sourceThreeAllItemOrder.keys()].sort((a, b) => sourceThreeAllItemOrder[b] - sourceThreeAllItemOrder[a]);
    //     [sourceThreeAllItemOrder, allItemBios] = [sourceThreeAllItemOrder, allItemBios].map(a => indices.map(i => a[i]));

    //     var sourceFiveAllItemOrder = sourceFourAllItemOrder.slice(0);
    //     var indices = [...sourceFourAllItemOrder.keys()].sort((a, b) => sourceFourAllItemOrder[b] - sourceFourAllItemOrder[a]);
    //     [sourceFourAllItemOrder, numberOfImages] = [sourceFourAllItemOrder, numberOfImages].map(a => indices.map(i => a[i]));

    //      //originals
    //     console.log("Originals sourceFiveAllItemOrder: ", sourceFiveAllItemOrder);
    //     console.log("Originals sourceAllItemImageIds: ", sourceAllItemImageIds);
    //     console.log("Originals sourceAllItemIds: ", sourceAllItemIds);
    //     console.log("Originals sourceAllItemNameswithImages: ", sourceAllItemNameswithImages);
    //     console.log("Originals sourceAllItemBios: ", sourceAllItemBios);
    //     console.log("Originals sourceNumberOfImages: ", sourceNumberOfImages);
    //     //sorted
    //     console.log("sorted allItemOrder: ", ...allItemOrder);
    //     console.log("sorted allItemImageIds: ", ...allItemImageIds);
    //     console.log("sorted allItemIds: ", ...allItemIds);
    //     console.log("sorted allItemNameswithImages: ", ...allItemNameswithImages);
    //     console.log("sorted allItemBios: ", ...allItemBios);
    //     console.log("sorted numberOfImages: ", ...numberOfImages);


    //     //final sort to get names to match first item image
    //     let mySrcArr;
    //     let myNewNested;
    //     let myNested = [allItemImageIds, wrongOrderIds, allImagesOfItems];

    //     myNewNested = myNested.map((myArr, myI) => {
    //         if (myI === 0) {
    //             return myArr;
    //         } else if (myI === 1) { // the reference, this just needs to be done once!
    //                 mySrcArr = myArr.slice(0); // take a copy of the second array
    //                 myArr.sort((prev, next) => {
    //                     return allItemImageIds.indexOf(prev) - allItemImageIds.indexOf(next);
    //                 });
    //         }
    //             if (myI === 1) {
    //                 return myArr;
    //             }
    //             return myArr.map((myItem, myI) => myArr[
    //                 mySrcArr.indexOf(myNested[1][myI]) // return in the order of the reference
    //             ]);
    //     });
        
    //     console.log("myNewNested: ", myNewNested);
    //     //console.log("myNewNested[2].length = " + myNewNested[2].length); //the third array (index 2) is the dataGetIMages 
    //             // to here
    //             // so, myNewNested 3rd array is the images of the items in the same order of the names of items
    //     // for (let i=0; i<myNewNested[2].length; i++) {
    //     //     $(`#currentItems`).append (`<div class="itemTitles" data-itemid="` + allItemIds[i] + 
    //     //     `" data-name="` + allItemNameswithImages[i] + `" data-bio="` + allItemBios[i] + 
    //     //     `" data-order="` + allItemOrder[i] + `" data-noofimages="` +  numberOfImages[i] + `"><h4>` + 
    //     //     allItemNameswithImages[i] + `</h4><br>` + myNewNested[2][i] + `</div>`);
    //     // }
    //     //<a href="#about" target="_self">About</a>
    //     console.log("myNewNested[2].length: " + myNewNested[2].length);
    //     for (let i=0; i<myNewNested[2].length; i++) {
    //         let itemIcon = $("<div>");
    //         itemIcon.attr("onclick", "location.href='#specificItem'");
    //         itemIcon.attr("target", "_self");
    //         itemIcon.addClass("itemTitles");
    //         itemIcon.data("itemid", allItemIds[i]);
    //         itemIcon.data("name", allItemNameswithImages[i]);
    //         itemIcon.data("bio", allItemBios[i]);
    //         itemIcon.data("order", allItemOrder[i]);
    //         itemIcon.data("noofimages", numberOfImages[i]);
    //         let itemName = $("<h4>");
    //         itemName.addClass("lightText");
    //         itemName.text(allItemNameswithImages[i]);
    //         itemIcon.append(itemName);
    //         itemIcon.append("<br>");
    //         // let hyperlink = $("<a>");
    //         // hyperlink.attr("href", "#specificItem");
    //         // hyperlink.attr("target", "_self");
    //         // hyperlink.append(myNewNested[2][i])
    //         itemIcon.append(myNewNested[2][i]);
    //         itemIconArray.push(itemIcon);
    //     }

    //     console.log("itemIconArray.length: " + itemIconArray.length);
    //     console.log("itemIconArray[0]: ", itemIconArray[0]);
        
    //     for (let i=0; i<itemIconArray.length; i++) {
    //         $(`#currentItems`).append(itemIconArray[i]);
    //     }
    // //});
    // }
    //clicking on the picture of one of the items displayed brings up a large pic and info about that item
    // adding the display of additional pictures
    
    $(document).on("click", "#itemImg", function(event) {
        event.preventDefault();
        console.log("I clicked on a specific item");
        $("#specificItem").empty();
        $("#editItemName").empty();
        $("#editItemName").show();
        $("#additionalImages").empty();
        $("#additionalImages").css("background-color", "transparent");
        $("#largeAddtlImages").empty();

        // retrieve the id of the item whose image was clicked. Used in edits of name and bio.
        var thisItemId = $(this).parent().data("itemid");
        console.log("thisItemId: ", thisItemId);

        // retrieve the id of the clicked image from the db. Used in any of the edits of title and desc.
        thisImageId = $(this).attr("data-id");
        console.log("thisImageId: ", thisImageId);

        //retrieve the name of the item and write to DOM
        var name = $(this).parent().data("name");
        console.log("name: ", name);
        $("#editItemName").text(name);
        if (personLoggedIn === true) {
            $("#editItemName").css({
                'border-style': 'solid',
                'border-width': '4px',
                'border-color': 'red'
              });
        }
        $("#editItemName").attr("data-id", thisItemId);
        
        // put the biography here
        var justH4 = $("<h4>");
        var specificItemBio = $("<span>");
        specificItemBio.attr("data-id", thisItemId);
        specificItemBio.attr("id", "editItemBio");
        specificItemBio.addClass("lightText");
        var bio = $(this).parent().data("bio");
        console.log("bio: ", bio);
        specificItemBio.text(bio);
        if (personLoggedIn === true) {
            specificItemBio.css({
                'border-style': 'solid',
                'border-width': '4px',
                'border-color': 'red'
              });
        } else {
            if (bio === "Biography" || bio === "None") {
                specificItemBio.text("");
                specificItemBio.removeClass("lightText");
            }
        }
        justH4.append(specificItemBio);
        $("#specificItem").append(justH4);

        // put the order number here
        var justH4 = $("<h4>");
        var specificItemOrder = $("<span>");
        specificItemOrder.attr("data-id", thisItemId);
        specificItemOrder.attr("id", "editItemOrder");
        specificItemOrder.addClass("lightText");
        var order = $(this).parent().data("order");
        console.log("order: ", order);
        specificItemOrder.text(order);
        console.log("building large image: typeof specificItemOrder " + typeof specificItemOrder);
        if (personLoggedIn === true) {
            specificItemOrder.css({
                'border-style': 'solid',
                'border-width': '4px',
                'border-color': 'red'
              });
              justH4.append(specificItemOrder);
              $("#specificItem").append(justH4);
        } else {
            if (order === NaN) { //not sure why I did this instead of just not writing it to DOM if User isn't logged in
                specificItemOrder.text("");
            }
        }
        
        // loads the main image, as wide as the screen
        
        //setting the currentItemId to thisItemId for retrieving additional pics later
        currentItemId = thisItemId;
        console.log("id of thisItemId: " + thisItemId);
        console.log("id of currentItemId: ", currentItemId);
        var imgSrc = $(this).attr("src");
        var bigImage = $("<img>");
        bigImage.attr("id", "firstImage");
        bigImage.addClass("bigItemImage");
        bigImage.attr("data-itemid", currentItemId);
        bigImage.attr("src", imgSrc);
        $("#specificItem").append(bigImage);

        // put the title of this picture underneath
        //var justH3 = $("<h3>");
        var specificItemPicTitle = $("<span>");
        specificItemPicTitle.addClass("lightText");
        specificItemPicTitle.attr("id", "imageTitleEdit");
        specificItemPicTitle.attr("data-id", thisImageId);
        var title = $(this).attr("title");
        console.log("title: ", title);
        specificItemPicTitle.text(title);
        if (personLoggedIn === true) {
            specificItemPicTitle.css({
                'border-style': 'solid',
                'border-width': '4px',
                'border-color': 'red'
              });
        } else {
            if (title === "Title" || title === "None")  {
                specificItemPicTitle.text("");
                specificItemPicTitle.removeClass("lightText");
            }
        }
        //justH3.append(specificItemPicTitle);
        $("#specificItem").append(specificItemPicTitle);

        // put the desc of this picture underneath that
        //var justH3 = $("<h3>");
        var specificItemPicDesc = $("<span>");
        specificItemPicDesc.addClass("descText");
        specificItemPicDesc.attr("id", "imageDescEdit");
        specificItemPicDesc.attr("data-id", thisImageId);
        var desc = $(this).data("desc");
        console.log("desc: ", desc);
        specificItemPicDesc.text(desc);
        if (personLoggedIn === true) {
            specificItemPicDesc.css({
                'border-style': 'solid',
                'border-width': '4px',
                'border-color': 'red'
              });
        } else {
            if (desc === "Description" || desc === "None") {
                specificItemPicDesc.text("");
                specificItemPicDesc.removeClass("descText");
            }
        }
        //justH3.append(specificItemPicDesc);
        $("#specificItem").append(specificItemPicDesc);

        // currently adding the number of images
        dataNoOfImages = $(this).parent().data("noofimages");
        console.log("dataNoOfImages: " + dataNoOfImages);
        if (dataNoOfImages > 1) {
            $("#specificItem").append("<br><button type='button' id='showAdditionalImages'" + 
            ">Additional Pictures</button>");
        }
    });

    //click on the enlarged pic of an individual item to add additional images
    // available only to user in an "edit" mode
    $(document).on("click", "#firstImage", function(event) {
        event.preventDefault();
        if (personLoggedIn === true) {
            // bring up the modal to enter info for a new image for the item
            $("#newItemImageModal").modal("show");
            currentItemId = $(this).data("itemid"); //here is where I can get the item id from the large picture
            console.log("currentItemId of big Image just clicked: " + currentItemId);
        }
    });

    // when Additional Images button (#showAdditionalImages) is clicked
    // go to db and retrieve addtional images from the correct item (slash bar picture group) and display 
    // the additional images in a horizontally scrolling div of large images.
    $(document).on("click", "#showAdditionalImages", function(event) {
        event.preventDefault();
        // hide the addtl images button
        $("#showAdditionalImages").hide();
        console.log("currentItemId: ", currentItemId);
        // get the images, but don't print out the first one again
        $.getJSON("/getAItem/" + currentItemId, function(currob) {
            console.log("currob[0].image: ", currob[0].image);
            currob[0].image.forEach(innerImageForEach);

            function innerImageForEach(innerItem, innerIndex) { //innerItem here is id of images
                if (innerIndex !== 0){ //excluding the first image id because we don't need to show the main image again
                    console.log("THIS INNER image, innerIndex and innerItem: " + innerIndex + " and " + innerItem);
                    $.ajax({
                    method: "GET",
                    url: "/getImages/" + innerItem
                    })
                    .then(function(dataGetImages) { // dataGetImages should be formattedImages from api-routes.js
                        console.log("dataGetImages: ", dataGetImages);
                        //console.log("dataGetImages[0].title: ", dataGetImages[0].title); //try to get specific info
                        $("#additionalImages").append(dataGetImages);
                        $("#additionalImages").css("background-color", "#333");
                        // change the id from itemImg to addtlImg. It was itemImg from db retrieval in the api-routes file.
                        $("div#additionalImages img").attr("class", "addtlBigItemImage");
                        $("div#additionalImages img").attr("id", "addtlImg");
                        // can I just add the attribute for the currentItemId here?
                        console.log("inside innerImageForEach large addtl images creation, currentItemId: " + currentItemId);
                        $("div#additionalImages img").attr("data-itemid", currentItemId);
                        console.log("dataNoOfImages: ", dataNoOfImages);
                        console.log("innerIndex: ", innerIndex);
                        //when innerIndex is the same as dataNoOfImages, then call the mouseover function?
                        // if ((dataNoOfImages - 1) === innerIndex) {
                        //     labelImages();
                        // }
                        
                        // commented out since the horizontal scroll div put in
                        // $("div#additionalImages img").attr("onclick", "location.href='#largeAddtlImages'");
                        // $("div#additionalImages img").attr("target", "_self");
                        // each picture needs the title and desc below it but still in the div #additionalImages
                    });
                }
            }
        });
    });

    //  click on one of the additional images, and display it's title and description
    $(document).on("click", "img#addtlImg", function(event) {
        event.preventDefault();
        console.log("I clicked on an additional image");
        console.log("clickonImg: ", clickOnImg);
        if (clickOnImg === true) {
            //delete the spans
            // BUT this is deleting previously selected images spans too!!!!
            // this still needs to be tied to just (this)
            $(this).siblings("h3#h3Title").remove();
            $(this).siblings("span#imageDescEdit").remove();
            $(this).siblings("button#deleteImage").remove();
            console.log("Image has already been clicked on");
            $(this).attr("class", "addtlBigItemImage");
            clickOnImg = false;
        } else {
            // loads the additional image that was just clicked, as wide as the screen
            var thisDataId = $(this).data("id");
            var thisItemId = $(this).data("itemid");  // or, is it .attr("data-itemid")?
            console.log("image data-id of the clicked pic (dataid of the image): ", thisDataId);
            console.log("item data-id of the clicked pic (dataid of the item): ", thisItemId);
            $(this).attr("class", "bigItemImage");

            // put the desc of this picture underneath that
            
            //var justH3 = $("<h3>");
            var specificItemPicDesc = $("<span>");
            specificItemPicDesc.addClass("descText");
            specificItemPicDesc.attr("id", "imageDescEdit");
            specificItemPicDesc.attr("data-id", thisDataId);
            console.log("desc before: ", desc);
            var desc = $(this).data("desc");
            console.log("desc after: ", desc);
            specificItemPicDesc.text(desc);
            if (personLoggedIn === true) {
                specificItemPicDesc.css({
                    'border-style': 'solid',
                    'border-width': '4px',
                    'border-color': 'red',
                    'margin-top': '10px'
                });
            } else {
                    if (desc === "Description" || desc === "None") {
                        specificItemPicDesc.text("");
                        specificItemPicDesc.removeClass("descText");
                    }
                }
            //justH3.append(specificItemPicDesc);   
            specificItemPicDesc.insertAfter(this);

            // put the title of this picture underneath
            
            var justH3 = $("<h3>");
            justH3.attr("id", "h3Title");
            var specificItemPicTitle = $("<span>");
            specificItemPicTitle.addClass("lightText");
            specificItemPicTitle.attr("id", "imageTitleEdit");
            specificItemPicTitle.attr("data-id", thisDataId);
            console.log("title before: ", title);
            var title = $(this).attr("title");
            console.log("title after: ", title);
            specificItemPicTitle.text(title);
            if (personLoggedIn === true) {
                specificItemPicTitle.css({
                    'border-style': 'solid',
                    'border-width': '4px',
                    'border-color': 'red'
                });
            } else {
                if (title === "Title" || title === "None") {
                    specificItemPicTitle.text("");
                    specificItemPicTitle.removeClass("lightText");
                }
            }
            justH3.append(specificItemPicTitle);
            justH3.insertAfter(this);
            // a working but not perfect ex $(this).siblings("h3#labelTitle").append(specificItemPicTitle);
            // example of format from stachoverflow $('.divOne').siblings('.divTwo').children('h3')

            if (personLoggedIn === true) {
                // $(this).append(`<br><button type="button" class="btn btn-danger"` +
                // ` id="deleteImage" data-itemid="` + thisItemId + `" data-id="`+ thisDataId +`">Delete This Image</button>`);
                $(`<button type="button" class="btn btn-danger"` +
                 ` id="deleteImage" data-itemid="` + thisItemId + `" data-id="`+ thisDataId +`">Delete This Image</button>`).insertAfter(this);
            }
            clickOnImg = true;
        }
    });
    //
    // If User clicks the Delete this Image button on an additional Large Image, this function happens
    // the image is deleted, and it's associated Title and Description are removed,
    // along with the id number in the item db
    // Provided by Gemini, adds the return the promise noted below
    $(document).on("click", "#deleteImage", function(event) {
        event.preventDefault();
        console.log("A user clicked the delete image button!");
        var thisImageId = $(this).data("id");
        currentImageId = thisImageId;
        var thisItemId = $(this).data("itemid");
        currentItemId = thisItemId;
        console.log("in deleteImage function, currentImageId: ", currentImageId);
        console.log("in deleteImage function, currentItemId: ", currentItemId);
    
        $.ajax({
            method: "DELETE",
            url: "/image/delete/" + currentImageId
        })
        .then(function(dbImage) {
            console.log("dbImage after delete: ", dbImage);
            return $.ajax({ // Return the promise for chaining, my note: I think this is the only change
                method: "POST",
                url: "/item/removeRef/" + currentItemId,
                data: { imageId: currentImageId }
            });
        })
        .then(function(dbItem) {
            console.log("dbItem after POST /item/removeRef/id: ", dbItem);
            fetchAndDisplayItems();
        })
        .catch(function(err) {
            console.error("Error deleting image or reference:", err);
            // Display an error message to the user
        });
    });
    //My original code:
    // $(document).on("click", "#deleteImage", function(event) {
    //     event.preventDefault();
    //     console.log("A user clicked the delete image button!");
    //     var thisImageId = $(this).data("id");
    //     currentImageId = thisImageId;
    //     var thisItemId = $(this).data("itemid");
    //     currentItemId = thisItemId;
    //     console.log("in deleteImage function, currentImageId: ", currentImageId);
    //     console.log("in deleteImage function, currentItemId: ", currentItemId);
    //     // DELETE this specific image from the Image collection
    //     $.ajax({
    //         method: "DELETE",
    //         url: "/image/delete/" + currentImageId
    //     })
    //     .then (function(dbImage) {
    //         console.log("dbImage after delete: ", dbImage); // shows a successful delete of 1 document
    //         // and then delete (or "pull") the reference to that just deleted document from the item document
    //         $.ajax({
    //             method: "POST",
    //             url: "/item/removeRef/" + currentItemId, //needs to be current item id
    //             data: {imageId: currentImageId}
    //         })
    //         .then (function(dbItem){
    //           console.log("dbItem after POST /item/removeRef/id: ", dbItem);
    //             getAllData();
    //         });
    //     });
    // });

    // Function to delete an entire item
    // Clicking the item id, bio, and all images references. Images out of the Image db will be removed first
    // the /getAItem/ route will get the array of images to be removed.
    $(document).on("click", "#deleteItem", function(event) {
        event.preventDefault();
        console.log("User clicked the Delete Item Button!");
        let text = "Are you sure?!\nEither OK or Cancel.";
        if (confirm(text) == true) {
            $("#editNameForm").modal("hide");
            deleteItem();
        } else {
            // just hide the modal
            $("#editNameForm").modal("hide");
        }
    });

    //the delete entire item function, first get the array of additional images to delete in image db
    // then delete the item id in the item db.  currentItemId is known from clicking on the name of
    // the item that brings up the #editItemName modal, and the Delete Item button
    function deleteItem() {
        $.getJSON("/getAItem/" + currentItemId, function(currob) {
            console.log("currentItemId: ", currentItemId);
            console.log("currob[0]: ", currob[0]);
            console.log("currob[0].image: ", currob[0].image);
            console.log("currob[0].image.length: ", currob[0].image.length);
       
            // loop through the array of images to delete the id's from the Image collection
            for (i = 0; i < currob[0].image.length; i++) {
                console.log("in loop: currob[0].image[" + i + "]: ", currob[0].image[i]);
                $.ajax({
                    method: "DELETE",
                    url: "/image/delete/" + currob[0].image[i]
                })
                .then (function(dbImage) {
                    console.log("dbImage after delete: ", dbImage); // shows a successful delete of 1 document
                });
            } 
            // now remove the entire item from the item db collection
            console.log(" correct id of item to be removed? currob[0]._id: ", currob[0]._id);
            $.ajax({
                method: "DELETE",
                url: "/item/delete/" + currentItemId
            })
                .then (function(dbItem) {
                    console.log("after delete the item, dbItem: ", dbItem);
                });
                fetchAndDisplayItems();
        });
    }


    // this function happens when User clicks the submit a new item button, info is stored in the appropriate item db
    $(document).on("click", "#submitNewItem", function(event) {
        event.preventDefault();
        console.log("is the number of items available? itemIconArray.length: ", itemIconArray.length);
        console.log("name: ", $("#itemNameInput").val().trim());
        console.log("bio: ", $("#itemBioInput").val().trim());
        var name = $("#itemNameInput").val().trim();
        var bio = $("#itemBioInput").val().trim();
        var order = $("#itemOrderInput").val().trim();
        if (bio === "") {
            bio = "Biography";
        }
        if (order === "") {
            order = String((itemIconArray.length + 1) * 10);
            console.log("assigned order from code not user order: ", order);
        }
        $.ajax({
            method: "GET",
            url: "/createItem/",
            data: {
                name: name,
                bio: bio,
                order: order
            }
        })
        .then(function(dataItem) {
            console.log("Creation of new item (dataItem) in item.js: ", dataItem);
            // save id of current (last created) item
            console.log("currentItemId: " + dataItem._id);
            currentItemId = dataItem._id;
            // empty out the input fields
            $("#itemNameInput").val("");
            $("#itemBioInput").val("");
            $("#itemOrderInput").val("");
            // Hide the current modal
            $("#newItemModal").modal("hide");
            //Now add a button to add the main image for the new item
            $("#mainImageButtonSpace").append("<button type='button' id='createImageItem'" + 
                ">Add Main Image for Item</button><button type='button' id='noImageYet'>No Image Yet</button>");
        });
    });

    // function to re-retrieve fetchAndDisplayItems if no image is initially given to a new item, the No Image button is clicked by User
    $(document).on("click", "#noImageYet", function(event) {
        event.preventDefault();
        $("#mainImageButtonSpace").empty();  // remove the button - it should only appear when User creates a new item
        //window.location.replace("/");
        fetchAndDisplayItems();
    });

     // this function is after User clicks the noimage label under a previously created item
     // but with no image added.. A modal appears for him to
    // enter the title, description and browse for an image,
    // but first the individual item must be found and populated to accept an array of images
    $(document).on("click", ".noImage", function(event) {
        event.preventDefault();
        currentItemId = $(this).data("itemid");
        console.log("inside noImage class click, currentItemId: ", currentItemId);
        // make an ajax call for the item to be populated
            $.ajax({
                method: "GET",
                url: "/popItem/" + currentItemId
                })
                .then(function(dataAddImage) {
                // this sets up the fields populated to receive item name and image data
                console.log("in item.js, dataAddImage, after Item is populated: ", dataAddImage);
                });
        });

    // this function is after User clicks the add main image button. A modal appears for him to
    //  browse for an image,
    // but first the individual item must be found and populated to accept an array of images
    $(document).on("click", "#createImageItem", function(event) {
        event.preventDefault();
        if (personLoggedIn === true) {
            $("#newItemImageModal").modal("show");
            $("#mainImageButtonSpace").empty();  // remove the button - it should only appear when User creates a new item
            //currentItemId is already set from User entering a new item
            console.log("inside createImageItem click, currentItemId: ", currentItemId);
            // make an ajax call for the item to be populated
                $.ajax({
                    method: "GET",
                    url: "/popItem/" + currentItemId
                    })
                    .then(function(dataAddImage) {
                    // this sets up the fields populated to receive item name and image data
                    console.log("in item.js, /popItem/:currentItemId, dataAddImage: ", dataAddImage);
                    });
        }
    });
    //
    // this function enters the item image into the correct item in the db after data entered into the modal
    //assisted by Gemini
    $(document).on("click", "#submitNewItemImage", function(event) {
        event.preventDefault();

        function logFormDataEntries(formData) {
            for (const pair of formData.entries()) {
              console.log("key: ", pair[0] + ", value: ", pair[1]); // key, value
            }
        }
    
        const formData = new FormData();
    
        $.each($("#itemImageInput"), function(i, obj) {
            $.each(obj.files, function(j, file) {
                formData.append('itemImageInput[]', file); // Corrected line
            });
        });
        
        logFormDataEntries(formData);
    
        $.ajax({
            type: "POST",
            url: "/createImageItem/" + currentItemId,
            data: formData,
            processData: false,
            contentType: false,
            success: function(itemdb) { // Use 'success' instead of 'then' for older jQuery versions
                console.log("Image upload success:", itemdb);
                $("#itemImageInput").val(""); // Clear the file input
                $("#mainImageButtonSpace").empty();
                $("#newItemImageModal").modal("hide");
                $("#imageDiv").empty();
                fetchAndDisplayItems(); // Or however you refresh the display
            },
            error: function(error) { // Add error handling
              console.error("Image upload error:", error);
              // Display error message to the user, etc.
            }
        });
    });
    //
    // this function enters the item image into the correct item in the db after data entered into the modal
    // $(document).on("click", "#submitNewItemImage", function(event) {
    //     event.preventDefault();
    //     console.log("inside 'submitNewItemImage' click, currentItemId: ", currentItemId);
    //     // var imageForm = $("#itemImageInputForm")[0];
    //     // var imageData = new FormData(imageForm);
    //     var formData = new FormData();
    //     $.each($("#itemImageInput"), function (i, obj) {                
    //         $.each(obj.files, function (j, file) {                    
    //             formData.append('itemImageInput[' + i + ']', file);
    //         });
    //     });
    //     console.log("formData: ", formData);

    //     $.ajax({
    //       type: "POST",
    //       enctype: "multipart/form-data",
    //       url: "/createImageItem/" + currentItemId,
    //       data: formData,
    //       processData: false,
    //       contentType: false
    //     })
    //     .then(function(itemdb) {
    //         console.log("after .then for submitting an image, itemdb: ", itemdb);
    //         // itemdb here is the item document with the new image data
    //         // then hide this modal
    //        // $("#title").val("");
    //        // $("#desc").val("");
    //         $("#itemImageInput").val("");
    //         $("#mainImageButtonSpace").empty();  // remove the button - it should only appear when User creates a new item
    //         $("#newItemImageModal").modal("hide");
    //         //reload the current item div showing the changes
    //         $("#imageDiv").empty();
    //         //refresh the DOM after adding a new item with new image
    //         //window.location.replace("/");
    //         getAllData();
    //       });
    // });

    // This function shows the form for User to edit the Name of a Item and 
    // includes a button to delete the entire item - 
    //after it's been displayed as a large pic.
    $(document).on("click", "#editItemName", function(event) {
        event.preventDefault();
        if (personLoggedIn === true) {
            var thisItemName = $(this).text();
            console.log("thisItemName: ", thisItemName);
            thisItemId = $(this).attr("data-id");
            currentItemId = thisItemId;  // currentItemId is in all scope
            console.log("thisItemId: ", thisItemId);
            // show the modal to edit the current item name
            $("#editNameForm").modal("show");
            $("#editName").val(thisItemName);
        }
    });

    // This function shows the form for User to edit the Bio of a Item - after it's been displayed 
    // as a large pic.
    $(document).on("click", "#editItemBio", function(event) {
        event.preventDefault();
        if (personLoggedIn === true) {
            var thisItemBio = $(this).text();
            console.log("thisItemBio: ", thisItemBio);
            thisItemId = $(this).attr("data-id");
            console.log("thisItemId: ", thisItemId);
            // show the modal to edit the current item Bio
            $("#editBioForm").modal("show");
            $("#editBio").val(thisItemBio);
        }
    });

    // This function shows the form for User to edit the Order of a Item - after it's been displayed 
    // as a large pic.
    $(document).on("click", "#editItemOrder", function(event) {
        event.preventDefault();
        if (personLoggedIn === true) {
            var thisItemOrder = $(this).text()
            console.log("first thisItemOrder after (this): ", thisItemOrder);
            console.log("typeof before parseInt(thisItemOrder): " + typeof thisItemOrder);
            thisItemOrder = parseInt(thisItemOrder);
            console.log("typeof after parseInt(thisItemOrder): " + typeof thisItemOrder);
            console.log("after parseInt, thisItemOrder: ", thisItemOrder);
            var testy = "100";
            console.log("first testy: ", testy);
            console.log("typeof before parseInt(testy): " + typeof testy);
            testy = parseInt(testy);
            console.log("typeof after parseInt(testy): " + typeof testy);
            console.log("after parseInt, testy: ", testy);
            thisItemId = $(this).attr("data-id");
            console.log("thisItemId: ", thisItemId);
            // show the modal to edit the current item Bio
            $("#editOrderForm").modal("show");
            $("#editOrder").val(thisItemOrder);
        }
    });

    // This function shows the form for User to edit the Title
    // of an image, either the main one or additional pics
    $(document).on("click", "#imageTitleEdit", function(event) {
        event.preventDefault();
        if (personLoggedIn === true) {
            var thisTitle = $(this).text();
            console.log("thisTitle: " + thisTitle);
            thisImageId = $(this).attr("data-id");
            console.log("the id of the image for this title: ", thisImageId);
            // show the modal to edit the current title
            $("#editTitleForm").modal("show");
            $("#editTitle").val(thisTitle);
        }
    });

    // This function shows the form for User to edit the Description
    // of an image, either the main one or additional pics
    $(document).on("click", "#imageDescEdit", function(event) {
        event.preventDefault();
        if (personLoggedIn === true) {
            var thisDesc = $(this).text();
            console.log("thisDesc: " + thisDesc);
            thisImageId = $(this).attr("data-id");
            console.log("the id of the image for this description: ", thisImageId);
            // show the div to edit the current title
            $("#editDescForm").modal("show");
            $("#editDesc").val(thisDesc);
        }
    });

    //After user clicks Submit, this function changes the Item's Name in the db
    $(document).on("click", "#submitEditedItemName", function(event) {
        event.preventDefault();
        $.ajax({
        method: "POST",
        url: "/editItemName/" + thisItemId,
        data: {
            name: $("#editName").val().trim()
        }
        })
        .then(function(editedItemdb) {
            console.log("Itemdb after Name edit (editedItemdb) in item.js: ", editedItemdb);
            // empty out the input fields
            $("#editName").val("");
            // then hide the div to edit and this modal
            $("#editNameForm").modal("hide");
            //window.location.replace("/");
            fetchAndDisplayItems();
        });
    });

    //After user clicks Submit, this function changes the Item's Bio in the db
    $(document).on("click", "#submitEditedItemBio", function(event) {
        event.preventDefault();
        $.ajax({
        method: "POST",
        url: "/editItemBio/" + thisItemId,
        data: {
            bio: $("#editBio").val().trim()
        }
        })
        .then(function(editedItemdb) {
            console.log("Itemdb after Bio edit (editedItemdb) in item.js: ", editedItemdb);
            // empty out the input fields
            $("#editBio").val("");
            // then hide the div to edit and this modal
            $("#editBioForm").modal("hide");
            //window.location.replace("/");
            fetchAndDisplayItems();
        });
    });

    //After user clicks Submit, this function changes the Item's Order in the db
    $(document).on("click", "#submitEditedItemOrder", function(event) {
        event.preventDefault();
        $.ajax({
        method: "POST",
        url: "/editItemOrder/" + thisItemId,
        data: {
            order: $("#editOrder").val().trim()
        }
        })
        .then(function(editedItemdb) {
            console.log("Itemdb after Order edit (editedItemdb) in item.js: ", editedItemdb);
            // empty out the input fields
            $("#editOrder").val("");
            // then hide the div to edit and this modal
            $("#editOrderForm").modal("hide");
            //window.location.replace("/");
            fetchAndDisplayItems();
        });
    });

    //After user clicks Submit, this function changes the title 
    // of the image in the db
    $(document).on("click", "#submitEditedImageTitle", function(event) {
        event.preventDefault();
        $.ajax({
        method: "POST",
        url: "/editImageTitle/" + thisImageId,
        data: {
            title: $("#editTitle").val().trim()
        }
        })
        .then(function(editedImagedb) {
            //console.log("Imagedb after title edit (editedImagedb) in user.js: ", editedImagedb);
            // empty out the input fields
            $("#editTitle").val("");
            // then hide the div to edit and this modal
            $("#editTitleForm").modal("hide");
            //window.location.replace("/");
            fetchAndDisplayItems();
        });
    });

    //After user clicks Submit, this function changes the description
    // of the image in the db
    $(document).on("click", "#submitEditedImageDesc", function(event) {
        event.preventDefault();
        $.ajax({
        method: "POST",
        url: "/editImageDesc/" + thisImageId,
        data: {
            desc: $("#editDesc").val().trim()
        }
        })
        .then(function(editedImagedb) {
            //console.log("Imagedb after desc edit (editedImagedb) in user.js: ", editedImagedb);
            // empty out the input fields
            $("#editDesc").val("");
            // then hide the div to edit and this modal
            $("#editDescForm").modal("hide");
            //window.location.replace("/");
            fetchAndDisplayItems();
        });
    });

});
