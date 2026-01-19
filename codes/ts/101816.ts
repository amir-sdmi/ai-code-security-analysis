/*
//                                                                          Basic intro
interface User{
    name: string;
    age: number;
}

function sum(user1:User,user2:User){
    return user1.age+user2.age;
}

const age=sum({
    name:'Akshit',
    age:20
},{
    name:'Jane',
    age:19
})

console.log(age)



//                                                                          Pick
interface User1{
    id: string;
    name: string;
    age: number;
    email: string;
    password: string
}

type updateProps=Pick<User1,'name'|'age'|'email'>

function updateUser(props:updateProps){
    //hit the db to update the user
}


//                                                                          Partial
interface User1{
    id: string;
    name: string;
    age: number;
    email: string;
    password: string
}

type updateProps=Pick<User1,'name'|'age'|'email'>

type optional1stWay={
    name?: string;
    age?: number;
    email: string;
}                                                   // This has selective optional

type optional2ndWay=Partial<updateProps>            // This shas all optional

function updateUser(props:optional2ndWay){
    //hit the db to update the user
}

//                                                                          ReadOnly
const a="Akshit";
//a="Fuck"                    // We cnat do this, cant change ref of a const
//a[3]='s';                   // Error/red-swiggly Says only read only possible

const b=[1,2,3];
//b=[2,2,3]                   // We cnat do this, cant change ref of a const
b[0]=2;                       // No error,allowed, same goes for object

// What if we wanna introduce readonly to object too
type User2={
    readonly name: string;
    readonly age: number
}
const u:User2={
    name:"Akshit",
    age:20
}
// u.age=21;                  // Error msg: Cannot assign to 'age' because it is a read-only property

// Another way
type User3={
    name: string;
    age: number
}
const us: Readonly<User3>={
    name:"Akshit",
    age:20
}

// Use Case:-
interface Config {
    readonly endpoint: string;
    readonly apiKey: string;
  }
  
  const config: Readonly<Config> = {
    endpoint: 'https://api.example.com',
    apiKey: 'abcdef123456',
  };
  
  // config.apiKey = 'newkey'; // Error: Cannot assign to 'apiKey' because it is a read-only property.

// If u ever using chatgpt api, THis makes sure that developer do not update the config by mistake

  
//                                                                      Record & Maps

//                      Record:-

interface User {
    id: string;
    name: string;
  }
  
  type Users = { [key: string]: User };
  
  const users: Users = {
    'abc123': { id: 'abc123', name: 'John Doe' },
    'xyz789': { id: 'xyz789', name: 'Jane Doe' },
  };


// Using record:-

interface User {
    id: string;
    name: string;
  }
  
  type Users = Record<string, User>;
  
  const users: Users = {
    'abc123': { id: 'abc123', name: 'John Doe' },
    'xyz789': { id: 'xyz789', name: 'Jane Doe' },
  };
  
  console.log(users['abc123']); // Output: { id: 'abc123', name: 'John Doe' }


//                                                                      Map
const user = new Map()

user.set('abc123',{ id: 'abc123', name: 'John Doe' });
user.set('abc123',{ id: 'abc123', name: 'John Doe' });

const user1=user.get('abc123');
console.log(user1);

// Type casting maps
type User={
    id: string;
    name: string
}

const user2=new Map<string,User>()

user2.set('abc123',{ id: 'abc123', name: 'John Doe' });  

//                                                                      Exclude
type EventType = 'click' | 'scroll' | 'mousemove';
type ExcludeEvent = Exclude<EventType, 'scroll'>; // 'click' | 'mousemove'

const handleEvent = (event: ExcludeEvent) => {
  console.log(`Handling event: ${event}`);
};

handleEvent('click'); // OK
//handleEvent("scroll") // Error

*/

//                                                                      Type Inference in Zod
import { z } from 'zod';
import express from "express";

const app = express();

// Define the schema for profile update
const userProfileSchema = z.object({
  name: z.string().min(1, { message: "Name cannot be empty" }),
  email: z.string().email({ message: "Invalid email format" }),
  age: z.number().min(18, { message: "You must be at least 18 years old" }).optional(),
});

type userDataType= z.infer<typeof userProfileSchema>

app.put("/user", (req, res) => {
  const { success } = userProfileSchema.safeParse(req.body);
  //const updateBody = req.body; // how to assign a type to updateBody?
  // Type of this variable is any, which is an issue here
  // One solution is to hard code the type and assign it to the variable, but that is quite inefficient and redundent, as we will be repeting what we did while writting zod schema
  
  // After doing z.infer for type userData:-
  const updateBody:userDataType=req.body;
  if (!success) {
    res.status(411).json({});
    return
  }
  // update database here
  res.json({
    message: "User updated"
  })
});

app.listen(3000);

// Use Case:-
// Ususally its major application is when we gotta export the type to the frontEnd(since react do not support ZOD) using monoRepos
export type userDataType2= z.infer<typeof userProfileSchema>