import React, {createContext, useContext, useState, useEffect} from "react";
import {toast} from "react-hot-toast"

const Context = createContext()

export const StateContext = ({children}) => {
    const [showCart, setShowCart] = useState(false)
    const [cartItems, setcartItems] = useState([])
    const [totalPrice, settotalPrice] = useState(0)
    const [totalQuantities, settotalQuantities] = useState(0)
    const [qty, setQty] = useState(1)

    let foundProduct;
    let index;

    const onAdd = (product, quantity) => {
        const checkProductInCart = cartItems.find((item) => item._id === product._id)

        settotalPrice((prevTotalPrice) => prevTotalPrice + product.price * quantity)
        settotalQuantities((prevTotalQuantities) => prevTotalQuantities + quantity)

        if(checkProductInCart){
            const updatedCartItems = cartItems.map((cartProduct) => {
                if(cartProduct._id === product._id) return {
                    ...cartProduct,
                    quantity: cartProduct.quantity + quantity
                }
            })

            setcartItems(updatedCartItems);
        } else {
            product.quantity = quantity;
            setcartItems([...cartItems, { ...product }]);
        }
        toast.success(`${qty} ${product.name} added to the cart.`)
    }

    const toggleCartItemQuanitity = (id, value) => {
        // foundProduct = cartItems.find((item) => item._id === id);
        // index = cartItems.findIndex((product) => product._id === id);

        // const spliced_array = cartItems.filter((item) => item._id !== id);

        // if(value === "inc"){
        //     let newCartItems = [{...foundProduct, quantity: foundProduct.quantity + 1}, ...spliced_array];
        //     setcartItems(newCartItems);
        //     settotalPrice((prevTotalPrice) => prevTotalPrice + foundProduct.price);
        //     settotalQuantities((prevTotalQuantities) => prevTotalQuantities + 1);

        // }
        // else if(value === "dec"){
        //     if(foundProduct.quantity > 1){
        //         let newCartItems = [{...foundProduct, quantity: foundProduct.quantity - 1}, ...spliced_array];
        //         setcartItems(newCartItems);
        //         settotalPrice((prevTotalPrice) => prevTotalPrice - foundProduct.price);
        //         settotalQuantities((prevTotalQuantities) => prevTotalQuantities - 1);
        //     }
        // }
        

        //Bug Fix using ChatGPT

        const foundProductIndex = cartItems.findIndex((item) => item._id === id);
        const foundProduct = cartItems[foundProductIndex];

        if (foundProduct) {
            const updatedProduct = { ...foundProduct, quantity: foundProduct.quantity + (value === "inc" ? 1 : -1) };
            const updatedCartItems = [...cartItems];
            updatedCartItems[foundProductIndex] = updatedProduct;

            setcartItems(updatedCartItems);
            settotalPrice((prevTotalPrice) => prevTotalPrice + (value === "inc" ? foundProduct.price : -foundProduct.price));
            settotalQuantities((prevTotalQuantities) => prevTotalQuantities + (value === "inc" ? 1 : -1));
        }
        
          
    }

    const onRemove = (product) => {
        foundProduct = cartItems.find((item) => item._id === product._id);
        const newCartItems = cartItems.filter((item) => item._id !== product._id);
    
        settotalPrice((prevTotalPrice) => prevTotalPrice - foundProduct.price * foundProduct.quantity);
        settotalQuantities(prevTotalQuantities => prevTotalQuantities - foundProduct.quantity);
        setcartItems(newCartItems);
    }

    const incQty = () => {
        setQty((prevQty) => prevQty + 1);
    }
    
    const decQty = () => {
        setQty((prevQty) => {
        if(prevQty - 1 < 1){
            return 1;
        } else{
            return prevQty - 1;
        }
        });
    }

    return (
        <Context.Provider
        value={{
            showCart,
            setShowCart,
            cartItems,
            totalPrice,
            totalQuantities,
            qty,
            incQty,
            decQty,
            onAdd,
            toggleCartItemQuanitity,
            onRemove,
            setcartItems,
            settotalPrice,
            settotalQuantities
        }}>
            {children}
        </Context.Provider>
    )
}


export const useStateContext = () => useContext(Context);


