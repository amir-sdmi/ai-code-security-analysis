const asyncHandler = (requestHandler)=>{
     return (req,res,next)=>{
             Promise.resolve(requestHandler(req,res,next)).     // use chatgpt to understand.
             catch((err)=>next(err))
     }     
}



// const asyncHandler = (fn)=async()=>{               //wrapper function
//       try {
//         await fn(req,res,next)
//       } catch (error) {
//           res.status(error.code || 500).json({
//             success:false,
//             message:error.message
//           })
//       }
          
// }





export {asyncHandler}