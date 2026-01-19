// Using Dynamic Routes Concept - api/tasks/{taskId}

import { connectDb } from "@/helper/db";
import { getErrorResponse } from "@/helper/errorResponse";
import { Task } from "@/models/task";
import { NextResponse } from "next/server";


// Connecting with DB, By calling the function.
connectDb();

// Get any Specific Task using it's Id from Parameters
export const GET = async (request, {params}) => {
  const {taskId} = params;
  try {
    const singleTask = await Task.findById(taskId);
    return NextResponse.json(singleTask);
  } catch (error) {
    console.log(error);
    return getErrorResponse("Error in getting task",404,false);
  }
};

// Better way to update the task - by using ChatGpt
export const PUT = async (request, { params }) => {
  const { taskId } = params;
  try {
    const { title, content, status } = await request.json();

    // Validate input
    // if (!title || !content || typeof status !== 'boolean') {
    //   return NextResponse.json({
    //     message: 'Invalid input. Please provide a title, content, and status.',
    //     success: false,
    //   }, { status: 400 });
    // }

    // Update task directly with `findByIdAndUpdate`
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { title, content, status },
      { new: true } // Return the updated document
    );

    if (!updatedTask) {
      return NextResponse.json({
        message: 'Task not found.',
        success: false,
      }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Task updated successfully.',
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    console.error('Error updating task:', error);

    return NextResponse.json({
      message: 'Failed to update the task.',
      success: false,
    }, { status: 500 });
  }
};

// Better way to DELETE the task - by using ChatGpt
export const DELETE = async (request, { params }) => {
  const { taskId } = params;

  try {
    const deletedTask = await Task.findByIdAndDelete(taskId);

    if (!deletedTask) {
      return NextResponse.json({
        message: 'Task not found. Deletion failed.',
        success: false,
      }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Task deleted successfully.',
      success: true,
    });
  } catch (error) {
    console.error('Error in deleting task:', error);

    return NextResponse.json({
      message: 'Failed to delete the task.',
      success: false,
    }, { status: 500 });
  }
};




// API to Delete the code, Self written code (Less Accurate)
// export const DELETE = async (request, {params}) => {
//   const {taskId} = params;
//   try {
//     await Task.deleteOne({
//       _id:taskId
//     });
//     return NextResponse.json({
//       message : "Task Deleted Successfully",
//       success : true,
//     })
//   } catch (error) {
//     console.error('Error in Deleting task:', error);

//     return NextResponse.json({
//       message:'Failed to Delete the Task.',
//       success: false,
//     })
//   }
// };




// API to Update the code, Self written code (Less Accurate)
// export const PUT = async (request, {params}) => {
//   const {taskId} = params;
//   try {
//     const {title, content, status} = await request.json();
//     let task = await Task.findById(taskId);
//     (task.title = title), (task.content = content), (task.status = status);
//     const updatedTask = await updatedTask.save();
//     return NextResponse.json(updatedTask);
//   } catch (error) {
//     console.log(error);
//     return NextResponse({
//       message : "Failed to Update the Task",
//       success : false
//     })
//   }
// };