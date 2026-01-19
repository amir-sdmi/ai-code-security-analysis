
// ===== Application =====

export const BASE_URL = process.env.NODE_ENV === "production" ?
    "https://littlescript.io" :
    "http://localhost:3000"

export const FUNCTIONS_URL = process.env.NODE_ENV === "production" ?
    functionName => `https://us-central1-little-scripts-391918.cloudfunctions.net/${functionName}` :
    functionName => `http://localhost:5001/little-scripts-391918/us-central1/${functionName}`

export const MAX_FREE_RUNS = 100
export const COST_PER_RUN = 0.01
export const SIGNED_URL_EXPIRATION = 15 * 60 * 1000 // 15 minutes
export const SCRIPT_RUN_LOAD_LIMIT = 100

export const RUN_SCRIPT_QUEUE = "run-script-queue"
export const SCRIPT_RUNNER_URL = "https://script-runner-r5i5bvmuaa-uc.a.run.app"
export const FINISH_SCRIPT_RUN_TOPIC = "finish-script-run"
export const SCRIPT_RUNNER_ERROR_TOPIC = "script-runner-error"


// ===== Scripts =====

export const RUN_STATUS = {
    RUNNING: "RUNNING",
    PENDING: "PENDING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    CANCELLED: "CANCELLED",
    SCHEDULED: "SCHEDULED",
    PENDING_SCHEDULING: "PENDING_SCHEDULING",
}

export function isStatusFinished(status) {
    return status === RUN_STATUS.COMPLETED || status === RUN_STATUS.FAILED || status === RUN_STATUS.CANCELLED
}

export const TRIGGER_TYPE = {
    MANUAL: "trigger.manual",
    RECURRING_SCHEDULE: "trigger.recurring-schedule",
    ASYNC_URL: "trigger.url-async",
    SYNC_URL: "trigger.url-sync",
}

export const SCRIPT_RUN_COLLECTION = "script-runs"
export const TRIGGER_COLLECTION = "triggers"
export const SCRIPT_COLLECTION = "scripts"
export const USER_COLLECTION = "users"

export const SOURCE_FILE_PATH = scriptId => `scripts/${scriptId}/source.js`
export const LOG_FILE_PATH = (scriptId, scriptRunId) => `scripts/${scriptId}/runs/${scriptRunId}/log.txt`

export const ASYNC_TRIGGER_URL = process.env.NODE_ENV === "production" ?
    `${BASE_URL}/trigger/async-url?t=` :
    `${FUNCTIONS_URL("onRequestAsyncUrlTrigger")}?t=`

export const SYNC_TRIGGER_URL = process.env.NODE_ENV === "production" ?
    `${BASE_URL}/trigger/sync-url?t=` :
    `${FUNCTIONS_URL("onRequestSyncUrlTrigger")}?t=`

export const STARTER_CODE = `/**
 * Welcome to your Script!
 * 
 * Scripts are single-file JavaScript modules. 
 * 
 * A few things:
 *  1. For imports, you must use ES modules (import), not CommonJS (require).
 *  2. Dependencies are limited to a set of common packages. Click the "Dependencies" tab to view them.
 *  3. If you're using ChatGPT to code, click "I'm using ChatGPT" for help with prompting.
 */

import fetch from "node-fetch"

const hello = await fetch("https://littlescript.io/hello-littlescript.txt").then(res => res.text())
console.log(hello)
`

export const SERVICE_ERROR_REMAPS = [
    {
        includeText: "container instance was found to be using too much memory and was terminated",
        remapTo: "Your script used too much memory. Try using less memory or optimizing your code.",
    },
    {
        includeText: "reached the maximum request timeout",
        remapTo: "Your script took too long to run.",
    },
]


// ===== Stripe =====

export const STRIPE_CUSTOMERS_COLLECTION = "stripe-customers"
export const STRIPE_PRODUCTS_COLLECTION = "stripe-products"

export const STRIPE_FREE_PRICE_ID = "price_1NTZ3dFpVzJHyi82UMmAOOMg"
export const STRIPE_LITTLE_PRICE_ID = "price_1NTZ3dFpVzJHyi82JtiiFCIB"
export const PLAN = {
    FREE: "free",
    LITTLE: "little",
}
export const PLAN_STRIPE_PRICE_ID = {
    [PLAN.FREE]: STRIPE_FREE_PRICE_ID,
    [PLAN.LITTLE]: STRIPE_LITTLE_PRICE_ID,
}
export const PRICE_ID_PLAN = {
    [STRIPE_FREE_PRICE_ID]: PLAN.FREE,
    [STRIPE_LITTLE_PRICE_ID]: PLAN.LITTLE,
}