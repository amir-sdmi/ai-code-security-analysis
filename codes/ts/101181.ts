import { type ClassValue, clsx } from 'clsx'

import { twMerge } from 'tailwind-merge'
import qs from 'query-string' //this is a package if error coming install this package using "npm i query-string".

import { UrlQueryParams, RemoveUrlQueryParams } from '@/lib/types' //these are types/interfaces.

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

//these are the functions for different purposes, mainly these all funcs are created by chatGpt so just understand it little bit and work with it.
export const formatDateTime = (dateString: Date) => {
  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short', // abbreviated weekday name (e.g., 'Mon')
    month: 'short', // abbreviated month name (e.g., 'Oct')
    day: 'numeric', // numeric day of the month (e.g., '25')
    hour: 'numeric', // numeric hour (e.g., '8')
    minute: 'numeric', // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short', // abbreviated weekday name (e.g., 'Mon')
    month: 'short', // abbreviated month name (e.g., 'Oct')
    year: 'numeric', // numeric year (e.g., '2023')
    day: 'numeric', // numeric day of the month (e.g., '25')
  }

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric', // numeric hour (e.g., '8')
    minute: 'numeric', // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
  }

  const formattedDateTime: string = new Date(dateString).toLocaleString('en-US', dateTimeOptions)

  const formattedDate: string = new Date(dateString).toLocaleString('en-US', dateOptions)

  const formattedTime: string = new Date(dateString).toLocaleString('en-US', timeOptions)

  return {
    dateTime: formattedDateTime,
    dateOnly: formattedDate,
    timeOnly: formattedTime,
  }
}

export const convertFileToUrl = (file: File) => URL.createObjectURL(file)

export const formatPrice = (price: string) => {
  const amount = parseFloat(price)
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)

  return formattedPrice
}

export function formUrlQuery({ params, key, value }: UrlQueryParams) {
  const currentUrl = qs.parse(params) //yeh basically "qs" library hai jo query string ko JS object ma change kregi like: `?a=2&b=3` will become {a: 2, b: 3}

  currentUrl[key] = value //yeh phr currentUrl ek object agya or isme sa "key" ki base pa value assign krdi.or value iss lia assign kr rhay hain kiu kay search ma jab value change hogi toh wo automatically currentUrl mabi change honi chaiya

  return qs.stringifyUrl(  //basic jo yeh method hai .stringifyUrl() yeh jo be current url hoga usko and jo currentUrl object hna uper jo bnya hai convert krdega back into URL query string.
    {
      url: window.location.pathname, //yaha basic hum yeh keh rhy hain current jo currentUrl hai wo lelo.
      query: currentUrl, //yeh wo uper obj hai.
    },
    { skipNull: true } //yeh iss lia kia hai taka agr koi currentUrl objet ma undefined or null value ho toh unko ignore krdo
  )
}
//or jo uper yeh function bnaya hai yeh srf iss lia bnaya hai taka query ko update kr sakay A/c to user input.

export function removeKeysFromQuery({ params, keysToRemove }: RemoveUrlQueryParams) 
{ //yeh function iss lia bnaya hai kay agr query na ho toh URL ma say query parameter be remove hojaye, like user na search bar ma input kia or phr search bar ko again clean krdia  toh uss time query parameter be remove hojaye.

  const currentUrl = qs.parse(params) //same as above

  keysToRemove.forEach(key => {  //yaha ab keys hain wo kiu kay array of string ki form ma aa rhi hai bcuz zarori nhi kay URL ma ek hi query ho more than one be hoskti hai toh iss lia array of string ki form ma receive kia.
    delete currentUrl[key] //or yaha par jo jo key aa rhi hai unko currentUrl ma say delete krdia.
  })

  return qs.stringifyUrl(  //yaha par again jo Url hai isko update krdia on the basis of currentUrl.
    {
      url: window.location.pathname,
      query: currentUrl,
    },
    { skipNull: true }
  )
}

export const handleError = (error: unknown) => {
  console.error(error)
  throw new Error(typeof error === 'string' ? error : JSON.stringify(error))
}
