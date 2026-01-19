// Particular User's Specific Task.
// Complex API : localhost:3000/api/users/[userId]/tasks

import { connectDb } from "@/helper/db";
import { getErrorResponse } from "@/helper/errorResponse";
import { Task } from "@/models/task";
import { NextResponse } from "next/server";


// Connecting with DB, By calling the function.
connectDb();


export const GET = async (request, {params}) => {
    const {userId} = params;

    try {
      const userTask = await Task.find({
        userId : userId
      });
      return NextResponse.json(userTask);

    } catch (error) {
      console.log(error);
      return getErrorResponse("Error in getting User Specific task",404,false);
    }
};





// Same Above Code using ChatGPT (Proper Code)
// import { getErrorResponse } from "@/helper/errorResponse";
// import { NextResponse } from "next/server";
// import Task from "@/models/Task"; // Ensure this is the correct path to your Task model
// import mongoose from "mongoose";

// export const GET = async (request, { params }) => {
//   const { userId } = params;

//   try {
//     // Validate userId format
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return getErrorResponse("Invalid userId format", 400, false);
//     }

//     // Fetch tasks specific to the userId
//     const userTasks = await Task.find({ userId });

//     if (userTasks.length === 0) {
//       return NextResponse.json({
//         message: "No tasks found for this user.",
//         success: true,
//         data: [],
//       });
//     }

//     return NextResponse.json({
//       message: "User-specific tasks fetched successfully.",
//       success: true,
//       data: userTasks,
//     });
//   } catch (error) {
//     console.error("Error fetching user-specific tasks:", error);

//     return getErrorResponse("Error in getting User Specific task", 500, false);
//   }
// };