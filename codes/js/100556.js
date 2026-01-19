//all the Javascript portion is written by ChatGPT, so I would write down the line of the codes to demonstrate what I understand by commenting them out. Explanation would only be on this document.
var HydrogenButton = document.getElementsByClassName("openButton")[0]; // setting up all the variable "HydrogenButton" for the entire page

var HydrogenDataAttributes = {
  element: "Hydrogen",
  image: "1.jpg",
  text: "Hydrogen (<b>element symbol: H<sub>2</sub></b>) is the first element by atomic number. Its atom consists one electron and one proton. However, it is crucial to know that hydrogen exists as a <b>diatomic molecule</b>  in nature – implying that it <b>ALWAYS</b> exist as in pairs as opposed to just a single atom."
}; // line 4-8: write out the variable "HydrogenDataAttributes" that contains the definition of 3 elements on the page: element, image, and text based on the html code.

function openHydrogenPopupWindow() {
  var image = HydrogenDataAttributes.image;
  var text = HydrogenDataAttributes.text;
  var element = HydrogenDataAttributes.element;
  var windowName = "PopupWindow" + new Date().getTime();
  var windowFeatures = "width=1000,height=800,scrollbars=yes";
  var imageSize = "width: 200px; height: auto;";
  // line 10-16: declare the function "openHydrogenPopupWindow" that controls how the popup window would look like after clicking the hydrogen.png button and defines the size of the image.

  var popupContent1 = "<div style='display: flex; flex-direction: column; align-items: center; justify-content: flex-start; height: 100%; text-align: center;'>"
                   + "<h1>" + element + "</h1>"
                   + "<img src='" + image + "' style='" + imageSize + "'>"
                   + "<p></p>"
                   + "<p></p>"
                   + "<h2><u>General Facts</u></h2>"
                   + "<p>" + text + "</p>"
                   + "<p>It was discovered by an English physicist named Henry Cavendish in 1766. The name of the element means <b>make of water</b>, deriving from two Greek words: hydro (meaning <b>water</b>) and genes (meaning <b>forming</b>) because hydrogen forms water, H<sub>2</sub>O, by burning with oxygen.</p>"
                   + "<p>Hydrogen is a colorless, tasteless, odorless yet <b>highly flammable gas</b> exisitng in nature. It is also a relatively light element, and if the smell of the odrant of hydrogen is detected, the concentration of it may have already been exceeded its flammability limits!</p>"
                   + "<p></p>"
                   + "<h2><u>Historical Event</u></h2>"
                   + "<p>That being said, it is very easy for hydrogen to create sparks. One historical example would be the Hindenburg Blimp Explosion – as shown on the image at the top of this window. It blew up on May 6, 1937 because of the leaking gas, which mixed hydrogen from the airship and oxygen from the air outside together. The fire was caused the electrostatic discharge – or <b>the sparks</b> – which ignited the hydrogen, hence the fire.</p>"
                   + "<p></p>"
                   + "<h2><u>Applications</u></h2>"
                   + "<p>Hydrogen can be dangerous, but it exists everywhere in our daily life! Some common substances involving hydrogen include <b>water</b>, hydrogen peroxide, and table sugar. Hydrogen is also present in the vast majority of the acids – such as the hydrochloric acid – as H<sup>+</sup> ions.</p>"
                   + "<p>Other applications of hydrogen include hydrogen fuel cells, the use of rocket fuel in many space research activities, organic compounds such as methanol – CH<sub>3</sub>OH, synthesis of ammonia (NH<sub>3</sub>), production of nitrogeous fertilizers, and reacting hydrogen with unsaturated vegetable oils to produce the cooking oil.</p>"
                   + "<p>.</p>"
                   + "</div>";
// line 19-23: declare the variable "popupContent1" that defines all three elements for the pop-up window page, the function also controls how the content would look like on the popup window.

  var popupWindow = window.open("", windowName, windowFeatures);
  if (popupWindow) {
    popupWindow.document.write(popupContent1);
  }
}
// line 26-32: declare the variable "popupWindow" that creates the new window based on line 19-23; and if the popup window was blocked due to the popup blocker, the alert function comes out to say "hey, please do allow the popup window for this website."

HydrogenButton.addEventListener("click", openHydrogenPopupWindow);