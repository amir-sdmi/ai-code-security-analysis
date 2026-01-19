import User from "../models/user.model.js"
import Product from "../Models/product.model.js";
import Order from "../Models/order.model.js";
export const getAnalyticsData = async () => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        const salesData = await Order.aggregate([
            {
                "$group": {
                    _id: null,
                    totalSales: {
                        "$sum": 1
                    },
                    totalRevenue: {
                        "$sum": "$totalAmount"
                    }
                }
            }
        ]);
        const { totalSales, totalRevenue } = salesData[0] || { totalRevenue: 0, totalSales: 0 }
        return {
            users: totalUsers,
            products: totalProducts,
            totalSales,
            totalRevenue
        }

    } catch (error) {
        console.log("Aggregation Error in the analyticsController")

    }

}

export const getDailySalesData = async (startDate, endDate,res) => {

    try {

        const dailySalesData = await Order.aggregate([
            {
                "$match": {
                    createdAt: {
                        "$gte": startDate,
                        "$lte": endDate
                    },
                },
            },
            {
                "$group": {
                    "_id": {
                        "$dateToString": {
                            format: "%Y-%m-%d",
                            date: "$createdAt" // Correct key
                        }
                    },
                    sales: {
                        "$sum": 1
                    },
                    revenue: {
                        "$sum": "$totalAmount"
                    }
                }
            },
            {
                "$sort": {
                    "_id": 1
                }
            }
        ]);

        const dateArray = getDateInRange(startDate, endDate);

        return dateArray.map(date => {
            const foundData = dailySalesData.find(item => item._id === date);
            return {
                date,
                sales: foundData?.sales || 0,
                revenue: foundData?.revenue || 0
            }
        })
    } catch (error) {
        console.log("Error in the getDailySalesData controller ");
        console.log(error);
        return res.json({
            message: "Internal Server Error", error: error.message
        }).status(500);

    }
}
function getDateInRange(startData, endDate) {
    const dates = [];

    let currentDate = new Date(startData);
    while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split("T")[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}// created by chatGpt