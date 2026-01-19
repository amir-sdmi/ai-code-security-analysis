//   import haikuObject from "./assets/haikus.js";
// When I try to import this, I get the error 'cannot use import statement outside a module'.

const app = Vue.createApp({
  data() {
    return {
      test: "Haiku",
      confucius: "./assets/images/confuciusnightbar.png",
      confuciusBorder: ["red", "blue", "pink", "yellow"],
      confuciusBorderIndex: 0,
      mainHaiku: "",
      searchInput: "",
      haikus: [
        {
          id: 1,
          name: "The Old Pond",
          content:
            "An old silent pond, A frog jumps into the pond, Splash! Silence again.",
        },
        {
          id: 2,
          name: "The New Pond",
          content:
            "An new silent pond, A frog jumps into the pond, Splash! Silence again.",
        },
      ],
    };
  },
  methods: {
    dealWithInput(event) {
      this.searchInput = event.target.value;
      console.log(this.searchInput);
    },
    dealWithRandomClick(payload) {
      this.mainHaiku = payload.randomHaiku;
    },
    dealWithSearchClick(payload) {
      this.mainHaiku = payload.haikuBody;
    },
    controlImageInterval() {
      var time = this;
      setInterval(() => {
        //this cool logic suggested by chatGPT, gives the remainder of an integer division...
        //e.g. if the index is 0, it'll be (0+1) /4 gives remainder 1. Next time it'll be 1+1 / 4 gives remainder 2... but 3+1 / 4 gives remainder 0
        this.confuciusBorderIndex =
          (this.confuciusBorderIndex + 1) % this.confuciusBorder.length;
      }, 3000);
    },
    addHaiku(newHaiku) {
      newHaiku.id = haikus.length + 1;
      this.haikus.push(newHaiku);
    },
  },
  computed: {
    imageStyle() {
      return {
        border: `3px solid ${this.confuciusBorder[this.confuciusBorderIndex]}`,
        padding: "15px",
      };
    },
  },
  mounted() {
    this.controlImageInterval();
  },
});
