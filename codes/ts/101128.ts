// // export { auth as middleware } from "@/auth"


// import NextAuth from "next-auth"
// import authConfig from "@/auth.config"
// import {DEFALT_LOGIN_REDIRECT, apiAuthPrefix, authRoutes, publicRoutea} from "@/routes"
// const {auth} = NextAuth(authConfig)

// export default auth((req)=>{
//   const {nextUrl} = req;
//   const isLoggedIn = !!req.auth
  
//   const isApiAuthPoute = nextUrl.pathname.startsWith(apiAuthPrefix);
//   const isAuthRoute = authRoutes.includes(nextUrl.pathname);
//   const isPublicRoute = publicRoutea.includes(nextUrl.pathname);

//   if(isApiAuthPoute){
//     return null;
//   }

//   if(isAuthRoute){
//       if(isLoggedIn){
//         return Response.redirect(new URL(DEFALT_LOGIN_REDIRECT, nextUrl));
//       }
//       return null;
//   }

//   if(!isLoggedIn && !isPublicRoute){
//     return Response.redirect(new URL("/auth/login", nextUrl));

//   }

//   return null;
// })

// export const config = {
//   matcher : [
//     // Skip Next.js internals and all static files, unless found in search params
//     '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
//     // Always run for API routes
//     '/(api|trpc)(.*)', 
//   ],
// }



// ####### I change above code using ChatGPT ########

// export { auth as middleware } from "@/auth"

import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { DEFALT_LOGIN_REDIRECT, apiAuthPrefix, authRoutes, publicRoutea } from "@/routes";
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isPublicRoute = publicRoutea.includes(nextUrl.pathname);

  // Handle API auth routes
  if (isApiAuthRoute) {
    return;
  }

  // Handle auth routes
  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFALT_LOGIN_REDIRECT, nextUrl));
    }
    return;
  }

  // Redirect unauthenticated users away from private routes
  if (!isLoggedIn && !isPublicRoute) {
    return Response.redirect(new URL("/auth/login", nextUrl));
  }

  return;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
