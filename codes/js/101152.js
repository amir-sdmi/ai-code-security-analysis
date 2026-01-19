// To run, python -m http.server 8000 in terminal, then http://localhost:8000 in searchbar
//Generated with ChatGPT 4.0

// Function to populate the table with meal plan data
function populateTable(mealPlan) {
    console.log('Populating table with meal plan data:', mealPlan);

    // Get the days of the week excluding "Shopping List" and "Cost"
    const days = Object.keys(mealPlan).filter(day => day !== "Shopping List" && day !== "Cost");

    days.forEach(day => {
        console.log('Processing day:', day);

        if (!mealPlan[day]) {
            console.error(`No data found for ${day}`);
            return;
        }

        const dayData = mealPlan[day];
        const dayMeals = dayData.Meals || [];
        const recipes = dayData.Recipes || [];
        const calorieCounts = dayData.Calories || [];
        const macronutrients = dayData['Macronutrient Breakdown'] || {};

        console.log(`Day: ${day}`);
        console.log('Day meals length:', dayMeals.length);
        console.log('Recipes length:', recipes.length);
        console.log('Calorie counts length:', calorieCounts.length);

        const mealTypes = ['Breakfast', 'Snack 1', 'Lunch', 'Snack 2', 'Dinner'];
        const tableMealTypes = ['Breakfast', 'Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner'];

        for (let i = 0; i < mealTypes.length; i++) {
            const mealType = mealTypes[i];
            const tableMealType = tableMealTypes[i];
            const meal = dayMeals[i] || 'N/A';
            const recipe = recipes[i] || 'N/A';
            const calories = calorieCounts[i] || 'N/A';

            const macronutrient = macronutrients[mealType] || { Protein: 'N/A', Carbs: 'N/A', Fats: 'N/A' };

            const cellId = `${day.toLowerCase()}-${tableMealType.toLowerCase().replace(' ', '-')}`;

            const cell = document.getElementById(cellId);
            if (cell) {
                cell.innerHTML = `
                    ${meal}<br>
                    Recipes: ${recipe}<br>
                    Calories: ${calories}<br>
                    Protein: ${macronutrient.Protein}g<br>
                    Carbs: ${macronutrient.Carbs}g<br>
                    Fats: ${macronutrient.Fats}g
                `;
            } else {
                console.error(`Element not found: ${cellId}`);
            }
        }
    });
}

// Event listener to populate table and shopping list after the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    fetch('Meal_plan.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log('Fetched data:', data);

            populateTable(data);
            populateShoppingList(data);
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
});

// Function to populate the shopping list with data
function populateShoppingList(data) {
    console.log('Populating shopping list with data:', data);

    if (data["Shopping List"]) {
        const shoppingList = data["Shopping List"].join('<br>');
        const cost = data["Cost"];

        document.getElementById('shopping-list').innerHTML = shoppingList;
        document.getElementById('cost').innerHTML = `$${cost}`;
    } else {
        console.error('Shopping list data is missing');
    }
}
