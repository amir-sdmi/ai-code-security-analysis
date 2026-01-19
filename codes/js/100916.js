// Meals were generated with chatgpt

const baseURL = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;

const MEALS =  [
    {
        "id": 1,
        "name": "Quinoa Salad",
        "price": 10.99,
        "description": "A refreshing salad with quinoa, cherry tomatoes, cucumber, and a lemon vinaigrette.",
        "img":`${baseURL}/images/quinoa-salad2.jpg`
    },
    {
        "id": 2,
        "name": "Grilled Salmon",
        "price": 15.50,
        "description": "Rich in omega-3s, this grilled salmon is served with steamed broccoli and brown rice.",
        "img": `${baseURL}/images/grilled-salmon.jpg`
    },
    {
        "id": 3,
        "name": "Chickpea Bowl",
        "price": 9.99,
        "description": "A hearty bowl of chickpeas, avocado, mixed greens, and tahini dressing.",
        "img": `${baseURL}/images/chickpea.jpg`
    },
    {
        "id": 4,
        "name": "Zucchini Noodles",
        "price": 12.50,
        "description": "Spiralized zucchini tossed with marinara sauce and topped with fresh basil.",
        "img": `${baseURL}/images/zuccini-noodles.jpg`
    },
    {
        "id": 5,
        "name": "Greek Yogurt Parfait",
        "price": 7.50,
        "description": "Creamy Greek yogurt layered with fresh fruits and granola.",
        "img": `${baseURL}/images/yogurt.jpg`
    },
    {
        "id": 6,
        "name": "Sweet Potato Fries",
        "price": 6.99,
        "description": "Baked sweet potato fries seasoned with herbs and spices.",
        "img": `${baseURL}/images/fries.jpg`
    },
    {
        "id": 7,
        "name": "Lentil Soup",
        "price": 8.50,
        "description": "A nutritious soup made with lentils, carrots, and spices, served warm.",
        "img": `${baseURL}/images/soup.jpg`
    },
    {
        "id": 8,
        "name": "Avocado Toast",
        "price": 9.00,
        "description": "Whole grain toast topped with smashed avocado, cherry tomatoes, and a sprinkle of feta.",
        "img": `${baseURL}/images/avocado-toast.jpg`
    },
    {
        "id": 9,
        "name": "Berry Smoothie Bowl",
        "price": 8.99,
        "description": "A smoothie bowl made with blended berries, topped with granola and fresh fruit.",
        "img": `${baseURL}/images/smoothie.jpg`
    }
]


export default MEALS;