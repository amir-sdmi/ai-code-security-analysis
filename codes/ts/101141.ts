import { Recipe } from "@/models/Recipe";

// Sample recipes generated with Copilot
export const recipes: Recipe[] = [
  {
    id: 1,
    title: "Spaghetti Carbonara",
    description: "A classic Italian pasta dish made with eggs, cheese, pancetta, and pepper.",
    thumbnailURL:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Espaguetis_carbonara.jpg/320px-Espaguetis_carbonara.jpg",
    ingredients: [
      "200g spaghetti",
      "100g pancetta",
      "2 large eggs",
      "50g pecorino cheese",
      "50g parmesan cheese",
      "Black pepper",
      "Salt",
    ],
    instructions: [
      "Cook the spaghetti in salted boiling water until al dente.",
      "In a pan, cook the pancetta until crispy.",
      "Beat the eggs and mix with grated cheese.",
      "Drain the pasta and mix with pancetta and egg mixture.",
      "Serve with extra cheese and black pepper.",
    ],
  },
  {
    id: 2,
    title: "Chicken Curry",
    description: "A flavorful dish made with chicken, spices, and coconut milk.",
    thumbnailURL: undefined,
    ingredients: [
      "500g chicken breast",
      "1 onion",
      "2 garlic cloves",
      "1 inch ginger",
      "400ml coconut milk",
      "2 tbsp curry powder",
      "Salt and pepper",
      "Fresh coriander",
    ],
    instructions: [
      "Sauté chopped onion, garlic, and ginger in a pan.",
      "Add chicken and cook until browned.",
      "Stir in curry powder and cook for 1 minute.",
      "Add coconut milk and simmer until chicken is cooked through.",
      "Serve with rice and garnish with coriander.",
    ],
  },
  {
    id: 3,
    title: "Caesar Salad",
    description: "A fresh salad with romaine lettuce, croutons, and Caesar dressing.",
    thumbnailURL:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Caesar_salad.jpg/360px-Caesar_salad.jpg",
    ingredients: [
      "1 head romaine lettuce",
      "100g croutons",
      "50g parmesan cheese",
      "2 tbsp Caesar dressing",
      "Black pepper",
    ],
    instructions: [
      "Chop the romaine lettuce and place in a bowl.",
      "Add croutons and grated parmesan cheese.",
      "Drizzle with Caesar dressing and toss to combine.",
      "Serve immediately.",
    ],
  },
  {
    id: 4,
    title: "Chocolate Cake",
    description: "A rich and moist chocolate cake topped with chocolate frosting.",
    thumbnailURL: "https://upload.wikimedia.org/wikipedia/commons/d/df/Chocolate_cake.jpg",
    ingredients: [
      "200g flour",
      "200g sugar",
      "100g cocoa powder",
      "2 eggs",
      "200ml milk",
      "100g butter",
      "1 tsp baking powder",
      "1 tsp vanilla extract",
    ],
    instructions: [
      "Preheat the oven to 180°C (350°F).",
      "Mix flour, sugar, cocoa powder, and baking powder in a bowl.",
      "Add eggs, milk, melted butter, and vanilla extract. Mix until smooth.",
      "Pour into a greased cake tin and bake for 30-35 minutes.",
      "Let it cool and frost with chocolate icing.",
    ],
  },
];
