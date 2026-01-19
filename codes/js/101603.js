import { 
    CardHeader, 
    CardFooter, 
    CardBody, 
    Typography, 
    Card, 
    Input,
    Select, 
    Option, 
    Radio,
    Button 
} from "@material-tailwind/react";


function RestaurantCard({ classStyles, restaurant })  {
    const distanceMiles = restaurant.distance * 0.00062137;
    console.log(restaurant);
    return (
        <>
            <div className={`flex w-full h-full justify-center items-center antialiased text-gray-900 ${classStyles}`}>
                <div className="group w-full h-full transition ease-in-out duration-300 hover:scale-105 hover:-translate-y-1">
                    {restaurant.image_url && (
                        <div className="w-full h-96 overflow-hidden rounded-lg shadow-lg flex-grow-0 flex-shrink-0">
                            <img 
                                className="h-full w-full object-cover object-center transition-shadow duration-300 ease-in-out"
                                src={restaurant.image_url}
                                alt={`${restaurant.name}`}
                            />
                        </div>
                    )} 
                    <div className="relative px-4 -mt-16">
                        <div className="bg-white p-6 rounded-lg shadow-lg transition-shadow duration-300 ease-in-out group-hover:shadow-xl">
                            <div className="flex items-baseline">
                                <span className="bg-[#eb986f] text-white text-xs px-2 inline-block rounded-full uppercase font-semibold tracking-wide">
                                    {restaurant.price}
                                </span>
                                <div className="ml-2 text-gray-600 uppercase text-xs font-semibold tracking-wider">
                                    {distanceMiles.toFixed(2)} mi away
                                </div>  
                            </div>
                            <h4 className="flex justify-center mt-1 text-xl font-semibold uppercase leading-tight truncate">{restaurant.name}</h4>
                            <div className="flex justify-center">
                                <p className="flex flex-wrap text-base font-light">
                                    {restaurant.categories.map((category, i) => (
                                        <span 
                                            key={i} 
                                            className="inline"
                                        >
                                            {category.title}{i !== restaurant.categories.length - 1 && ' •\u00A0'}
                                        </span>
                                    ))}
                                </p>
                            </div>
                            <div className="flex justify-center mt-4">
                                <div className="inline-flex items-center">
                                    {generateStars(restaurant.rating)}
                                    <span className="text-[#eb986f] ml-1 text-md font-bold">{restaurant.rating}/5</span>
                                    <span className="text-sm ml-1 text-gray-600">({restaurant.review_count} reviews)</span>
                                </div>
                            </div>  
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default RestaurantCard;


// generated with ChatGPT 
const generateStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
        stars.push(
            <svg
                key={`full-${i}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6 text-[#eb986f] cursor-pointer"
            >
                <path
                    fillRule="evenodd"
                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                    clipRule="evenodd"
                />
            </svg>
        );
    }

    // Add half star
    if (halfStar) {
        stars.push(
            <svg
                key="half"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-6 h-6 cursor-pointer"
            >
                {/* Orange filled left half */}
                <path
                    fill="#eb986f"
                    d="M12 2c.755 0 1.445.429 1.788 1.11l2.255 5.434 6.023.482c.871.07 1.228 1.157.573 1.732l-4.605 3.942 1.403 5.885c.207.868-.736 1.55-1.496 1.08L12 18.3 6.459 21.665c-.76.47-1.703-.212-1.496-1.08l1.403-5.885-4.605-3.942c-.655-.575-.298-1.662.573-1.732l6.023-.482L10.212 3.11C10.555 2.429 11.245 2 12 2z"
                    clipRule="evenodd"
                    mask="url(#mask-left)"
                />
                {/* Gray outlined right half */}
                <path
                    fill="none"
                    stroke="#9e9e9e"
                    strokeWidth="1"
                    d="M12 2c.755 0 1.445.429 1.788 1.11l2.255 5.434 6.023.482c.871.07 1.228 1.157.573 1.732l-4.605 3.942 1.403 5.885c.207.868-.736 1.55-1.496 1.08L12 18.3 6.459 21.665c-.76.47-1.703-.212-1.496-1.08l1.403-5.885-4.605-3.942c-.655-.575-.298-1.662.573-1.732l6.023-.482L10.212 3.11C10.555 2.429 11.245 2 12 2z"
                    mask="url(#mask-right)"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
                <defs>
                    <mask id="mask-left">
                        <rect x="0" y="0" width="12" height="24" fill="white" />
                    </mask>
                    <mask id="mask-right">
                        <rect x="12" y="0" width="12" height="24" fill="white" />
                    </mask>
                </defs>
            </svg>
        );
    }

    // Add empty stars
    for (let i = 0; i < emptyStars; i++) {
        stars.push(
            <svg
                key={`empty-${i}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="1"
                stroke="currentColor"
                className="w-6 h-6 cursor-pointer text-blue-gray-500"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
            </svg>
        );
    }

    return stars;
};