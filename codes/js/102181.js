/* CREATING OBJECT */

let dog = {
  name: "luna",
  numLegs: 4

};

/* ACCESING OBJ with "." */

let dog2 = {
  name: "Spot",
  numLegs: 4
};
console.log(dog2.name); /* Spot */
console.log(dog2.numLegs); /* 4 */

/* METHODS IN OBJECTS */

let dog3 = {
  name: "Spot",
  numLegs: 4,
  sayLegs: function() { return `This dog has ${dog3.numLegs} legs.`;} /* a key value can store a fucntion as vaulue  */

};

console.log(dog3.sayLegs()); /* This is how to access the fucntion with "." */

/* THIS. KEYWORD TO MAKE CODE REUSABLE */

let dog4 = {
  name: "Spot",
  numLegs: 4,
  sayLegs: function() {return `This dog has ${this.numLegs} legs.`;} /* THIS KW allows terminal to access even if the name of object has changed */
};

console.log (dog4.sayLegs()); 

/* MAKING CONSTURCTOR FUCNTION with THIS.  */


function Dog() { /* keep in mind mayus of fucniton name */
  this.name = "Luna"; /* keep in mind that even if it seems and object it is separted like fucntion statement with ";" */
  this.color = "Brown-Orange";
  this.numLegs = 4;
}

/* CREATING NEW INSTANCE with NEW OPERATOR */

function Dog() {
  this.name = "Rupert";
  this.color = "brown";
  this.numLegs = 4;
}
// Only change code below this line
let hound = new Dog;

console.log(hound); /* Now Hound will have all Dog Properties */


/* AUTOMATE THE CREATION OF NEW OBJECTS WITH CONSTRUCTOR (this. + new + arguments)  */

function Dog(name,color) { /*  with this set paarmeter user can enter updated arguments to create new objects and use this constructor as a template */
  this.name =  name; /* see parameters and assigned here to be updated when creating new object */ 
  this.color = color;
  this.numLegs = 4;

}
let terrier = new Dog("luna", "orange"); /*  This creates a new object stored in let terrier with same key values as Dog but with name and color updated */

console.log (terrier);

/* VERIFYING IF OBJECT IS FROM A SPECIFIC CONSTRUCTOR WITH "INSTANCEOF" */

function House(numBedrooms) {
  this.numBedrooms = numBedrooms;
}

let myHouse = new House(3); /* When new object is created with new operator is called "new" instance of Xobject */

myHouse instanceof House; /* this is used to check if that instance is using the named constructo, it will return true or false */

console.log (myHouse); /* willl print 3 */
console.log (myHouse instanceof House); /* this is the way to console.log the instanceof */

/* OWN PROPERTY */

function Bird(name) {
  this.name = name; /* name & numLegs are own properties as they will be print for every new instance under constructor named Bird */
  this.numLegs = 2;
}

let canary = new Bird("Tweety");
let ownProps = [];
/* we use a for in loop to check if property is found */
for (let prop in canary) { /*we define a let with name prop that will be the conditions of hasown...*/
  if(canary.hasOwnProperty(prop)) { /* it acceses canary recent created object to check and push this properties into the array ownProps */
    ownProps.push(prop);
  }
}

console.log(ownProps);

/* PROTOTYPE of PROPERTIES TO REDUCE DUPLICAE CODE */

function Dog(name) {
  this.name = name;
}
Dog.prototype.numLegs = 4; /* notice that the protoype is living outside the funciton to have global scope */

let beagle = new Dog("Snoopy"); /* new instance */

console.log(beagle) /*  it will not show all the info as is impolicit and only visible when accesing the concret property */
console.log (beagle.numLegs) /* it will print the property set for any instance we create */

/* ITARATE OVER ALL PROPERTIES WITH FOR IN LOOP TO DEVIDE OWNPROP AND PROTOTYPE  */

function Dog(name) {
  this.name = name;
}

Dog.prototype.numLegs = 4;

let beagle2 = new Dog("Snoopy");

let ownProps2 = [];
let prototypeProps2 = [];
/****************/
for (let prop in beagle) { /*  We run a loop through new instance "Beagle" to check prop */
  if(beagle.hasOwnProperty(prop)) { /* hasOwnproperty discriminates in between what is own so it will only account properties that are own / inside object */
    ownProps.push(prop);
  } else {
    prototypeProps.push(prop); 
  }
}

console.log(ownProps2);
console.log(prototypeProps2);

/* COSNTRUCTOR PROPERTY TO CHECK WHAT TYPE OF OBJECT */

function Dog(name) {
  this.name = name;
}
let streetDog = new Dog ("luna"); /*  I created this new instance to use the cosntructor property */

function joinDogFraternity(candidate) {
 if (candidate.constructor === Dog) {  /* keep in mind that constructor can be over wrtten to it is best practice to use instance of, check next to challenges */
   return true;
 } else {
   return false;
 }
}
console.log(joinDogFraternity(streetDog));

/* CHANEG PROTOTYPE TO A NEW OBJECT INT HE OPTIMIZE WAY */

function Dog(name) {
  this.name = name;
}

let luna = new Dog("luna");

Dog.prototype = { /*  this object contains the new protoypes properties that will in when creating a new instance */
    numLegs: 4,
eat: function () {
  console.log("yummi");
},
  describe: function () {
    console.log(`My name is ${this.name}`)
}
};
/* console.log the prototipes is not clear yest, consolt it with chatGPT for now */

/* AVOIDING OVERWRTTING ORIGN OBJ INSTANCES AND PROPTIPYES (from a new created obj) BY DEFINING " COSNTRUCTOR: xxxxx," */

function Dog(nome) {
  this.nome = nome;
}

Dog.prototype = {
  constructor:Dog, /* !!!!!!! when creating prototypes inside new objects this keep the name of the original obj this prototypes are assigned !!!!! */
  numLegs: 4,
  eat: function() {
    console.log("nom nom nom");
  },
  describe: function() {
    console.log("My name is " + this.nome);
  }
};

/* WEHRE OBJ PROTOIPES COME FROM with "ISPROTOTYPEOF" */

function Dog5(name) {
  this.name = name;
}

let beagle3 = new Dog5("Snoopy");

Dog5.prototype.isPrototypeOf(beagle3); /* this will return true as the KW is like a funciton that checks if it belogns to that obj */

/* SUPERTYPE and SUBTYPE of PRTOTIPE */

function Dog4(name) {
  this.name = name;
}

let beagle5 = new Dog4("Snoopy");

Dog4.prototype.isPrototypeOf(beagle5);  // yields true

Object.prototype.isPrototypeOf(Dog4.prototype);

/* DRY don't REPEAT YOURSELF CODING with describe Method  and integrating functions */
function Cat(name) {
  this.name = name;
}

Cat.prototype = {
  constructor: Cat,
};

function Bear(name) {
  this.name = name;
}

Bear.prototype = {
  constructor: Bear,

};

function Animal() { }

Animal.prototype = {
  constructor: Animal,
  eat: function() { 
    console.log("nom nom nom");
  }
};

/*  CREATING INHERITANCE WITH "OBJECT.CREATE()" instead OF CREATING RPOTOTYPE WITH "NEW" OPERATOR */

function Animal() { }

Animal.prototype = {
  constructor: Animal,
  eat: function() {
    console.log("nom nom nom");
  }
};

let duck2= Object.create(Animal.prototype);
let beagle7 = Object.create(Animal.prototype);

console.log (duck2);

/* CREATING INSTANCE OF PARENT */

function Animal() { }

Animal.prototype = {
  constructor: Animal,
  eat: function() {
    console.log("nom nom nom");
  }
};

function Dog() { }

Dog.prototype = Object.create (Animal.prototype);

/* RESET INHERIT CONSTRUCTOR MANUALLY  */
function Animal() { }
function Bird() { }
function Dog() { }

Bird.prototype = Object.create(Animal.prototype);
Dog.prototype = Object.create(Animal.prototype);

let duck7 = new Bird();
let beagle8 = new Dog();

Bird.prototype.constructor = Bird;
duck7.constructor

Dog.prototype.constructor = Dog;
beagle8.constructor

/* ADDING METHODS (fly, eat, bark for) AND ASSIGNING TO CONSTURCTORS */

function Animal() { }
Animal.prototype.eat = function() { console.log("nom nom nom"); };

function Dog() { }

Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

Dog.prototype.bark = function() {
  console.log("Woof!"); /* This method will give dog a unique a behaviour that will only be print trhouhg Dog objt */
};


let beagle10 = new Dog();

/* OVERWRITING ENHERIT METHODS TO ADD SEPECIFIC METHODS TO SPECIFIC OBJECST */

function Bird() { }

Bird.prototype.fly = function() { return "I am flying!"; };

function Penguin() { }
Penguin.prototype = Object.create(Bird.prototype);
Penguin.prototype.constructor = Penguin;

Penguin.prototype.fly = function() {
  return "Alas, this is a flightless bird.";
};

let penguin = new Penguin();
console.log(penguin.fly());

/* USING MIXIN TO ADD SAME BEHAVIOUR FROM NON RELATED OBJECT // Fly method for duck and for plane */

let bird = {
  name: "Donald",
  numLegs: 2
};

let boat = {
  name: "Warrior",
  type: "race-boat"
};

let glideMixin = function(obj) { /* here is defined the mixin that created the glide method */
  obj.glide = function() {
    console.log("gliding, loco");
  }
};

glideMixin(bird); /* This assignes the abilty to glide to the entered object */
glideMixin(boat);

/* MAKING CLOSURE VARAIBLE (NON OVERWRITABLE) TO FIX VAR VALUES */
function Bird() {
  let weight = 15; /* by declaring inside de function the value is only accesible within the contaxt of the Funciton so it can not be access globally an therefore be changed for another value */
  
  this.getWeight = function(){
    return weight;
  };

}

/* CREATING IIFE( IMMEDIATELY INVOKE FUCNITON EXP) // ANONYMUS FUNCTION TO RUN INSTANTLY */
 /* Classic concept */
 function makeNest() {
  console.log("A cozy nest is ready");
}

makeNest();
/* *********** */
(function () { /* it is not only enclosed in () but also anonymous it runs instantly without needing to call it  */
  console.log("A cozy nest is ready");
})
(); /* this is the way to execute the anonymous function  */

/* Use an IIFE to Create a Module */

let funModule = (function () {  /* we name the module ans start encapsulating the fucntion that will return and object with the inherit behaviours */
  return {
isCuteMixin: function(obj) { /* the mixin shoudl be passed from let to a key value object that has the fucntion as it key value */
  obj.isCute = function() {
    return true;
  };
}, /* since we trun it into and object both / OBJ behaviours  are linked with a ","  */
singMixin: function(obj) {
  obj.sing = function() {
    console.log("Singing to an awesome tune");
    };
    }
  }
}) ();