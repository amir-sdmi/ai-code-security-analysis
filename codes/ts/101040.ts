
// function minimumRounds(tasks):number {


//     //hey 🖐 this was my solution actually but because of time complexity it fails
//     //you can run the solution it will give result but fails for Time Limit Exceeded
  
//     let rounds:number=0;
//     const obj={}
//     for(let i=0;i<tasks.length;i++){
//         if(!Object.keys(obj).includes(tasks[i].toString())){
//         obj[`${tasks[i]}`]=0
//         obj[`${tasks[i]}`]=obj[`${tasks[i]}`]+1
//         }else{
//            obj[`${tasks[i]}`]=obj[`${tasks[i]}`]+1
//         }
//     }
 
    
//     const counts=Object.values(obj)
//     console.log(counts)
//     for(let i=0;i<counts.length;i++){
    
//     just(counts[i])
//         function just(r){
//             if(r===0){
//                 return ;
//             }
//             if(r===1){
//                 i=counts.length;
//                 rounds=-1
//                 return;
//             }
//             if(r===4){
//                 rounds=rounds+2;
//                 return;
//             }
//             if(r>=3){
//              rounds=rounds+1;
//              just(r-3);
//             }else{
//                 rounds=rounds+1
//                 just(r-2)
//             }
            
//         }
//     }
//     return rounds;
    
// };

//this is the solution which i had run after googling and using chatgpt

function minimumRounds(tasks: number[]): number {

    let rounds:number=0;
    const obj={}
    for(let i=0;i<tasks.length;i++){
        if(!(`${tasks[i]}` in obj)){
        obj[`${tasks[i]}`]=0
        obj[`${tasks[i]}`]=obj[`${tasks[i]}`]+1
        }else{
           obj[`${tasks[i]}`]=obj[`${tasks[i]}`]+1
        }
    }
 
    
    const counts=Object.values(obj)
    console.log(counts)
    for(let i=0;i<counts.length;i++){
         if (counts[i] === 1) return -1;
        rounds += Math.ceil(counts[i] as number / 3);
    }
 
     return rounds;
    
    

   }

   console.log(minimumRounds([2,2,3,3,2,4,4,4,4,4]))

