/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/@google/generative-ai/dist/index.mjs":
/*!***********************************************************!*\
  !*** ./node_modules/@google/generative-ai/dist/index.mjs ***!
  \***********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BlockReason: () => (/* binding */ BlockReason),
/* harmony export */   ChatSession: () => (/* binding */ ChatSession),
/* harmony export */   DynamicRetrievalMode: () => (/* binding */ DynamicRetrievalMode),
/* harmony export */   ExecutableCodeLanguage: () => (/* binding */ ExecutableCodeLanguage),
/* harmony export */   FinishReason: () => (/* binding */ FinishReason),
/* harmony export */   FunctionCallingMode: () => (/* binding */ FunctionCallingMode),
/* harmony export */   GenerativeModel: () => (/* binding */ GenerativeModel),
/* harmony export */   GoogleGenerativeAI: () => (/* binding */ GoogleGenerativeAI),
/* harmony export */   GoogleGenerativeAIAbortError: () => (/* binding */ GoogleGenerativeAIAbortError),
/* harmony export */   GoogleGenerativeAIError: () => (/* binding */ GoogleGenerativeAIError),
/* harmony export */   GoogleGenerativeAIFetchError: () => (/* binding */ GoogleGenerativeAIFetchError),
/* harmony export */   GoogleGenerativeAIRequestInputError: () => (/* binding */ GoogleGenerativeAIRequestInputError),
/* harmony export */   GoogleGenerativeAIResponseError: () => (/* binding */ GoogleGenerativeAIResponseError),
/* harmony export */   HarmBlockThreshold: () => (/* binding */ HarmBlockThreshold),
/* harmony export */   HarmCategory: () => (/* binding */ HarmCategory),
/* harmony export */   HarmProbability: () => (/* binding */ HarmProbability),
/* harmony export */   Outcome: () => (/* binding */ Outcome),
/* harmony export */   POSSIBLE_ROLES: () => (/* binding */ POSSIBLE_ROLES),
/* harmony export */   SchemaType: () => (/* binding */ SchemaType),
/* harmony export */   TaskType: () => (/* binding */ TaskType)
/* harmony export */ });
/**
 * Contains the list of OpenAPI data types
 * as defined by https://swagger.io/docs/specification/data-models/data-types/
 * @public
 */
var SchemaType;
(function (SchemaType) {
    /** String type. */
    SchemaType["STRING"] = "string";
    /** Number type. */
    SchemaType["NUMBER"] = "number";
    /** Integer type. */
    SchemaType["INTEGER"] = "integer";
    /** Boolean type. */
    SchemaType["BOOLEAN"] = "boolean";
    /** Array type. */
    SchemaType["ARRAY"] = "array";
    /** Object type. */
    SchemaType["OBJECT"] = "object";
})(SchemaType || (SchemaType = {}));

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @public
 */
var ExecutableCodeLanguage;
(function (ExecutableCodeLanguage) {
    ExecutableCodeLanguage["LANGUAGE_UNSPECIFIED"] = "language_unspecified";
    ExecutableCodeLanguage["PYTHON"] = "python";
})(ExecutableCodeLanguage || (ExecutableCodeLanguage = {}));
/**
 * Possible outcomes of code execution.
 * @public
 */
var Outcome;
(function (Outcome) {
    /**
     * Unspecified status. This value should not be used.
     */
    Outcome["OUTCOME_UNSPECIFIED"] = "outcome_unspecified";
    /**
     * Code execution completed successfully.
     */
    Outcome["OUTCOME_OK"] = "outcome_ok";
    /**
     * Code execution finished but with a failure. `stderr` should contain the
     * reason.
     */
    Outcome["OUTCOME_FAILED"] = "outcome_failed";
    /**
     * Code execution ran for too long, and was cancelled. There may or may not
     * be a partial output present.
     */
    Outcome["OUTCOME_DEADLINE_EXCEEDED"] = "outcome_deadline_exceeded";
})(Outcome || (Outcome = {}));

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Possible roles.
 * @public
 */
const POSSIBLE_ROLES = ["user", "model", "function", "system"];
/**
 * Harm categories that would cause prompts or candidates to be blocked.
 * @public
 */
var HarmCategory;
(function (HarmCategory) {
    HarmCategory["HARM_CATEGORY_UNSPECIFIED"] = "HARM_CATEGORY_UNSPECIFIED";
    HarmCategory["HARM_CATEGORY_HATE_SPEECH"] = "HARM_CATEGORY_HATE_SPEECH";
    HarmCategory["HARM_CATEGORY_SEXUALLY_EXPLICIT"] = "HARM_CATEGORY_SEXUALLY_EXPLICIT";
    HarmCategory["HARM_CATEGORY_HARASSMENT"] = "HARM_CATEGORY_HARASSMENT";
    HarmCategory["HARM_CATEGORY_DANGEROUS_CONTENT"] = "HARM_CATEGORY_DANGEROUS_CONTENT";
    HarmCategory["HARM_CATEGORY_CIVIC_INTEGRITY"] = "HARM_CATEGORY_CIVIC_INTEGRITY";
})(HarmCategory || (HarmCategory = {}));
/**
 * Threshold above which a prompt or candidate will be blocked.
 * @public
 */
var HarmBlockThreshold;
(function (HarmBlockThreshold) {
    /** Threshold is unspecified. */
    HarmBlockThreshold["HARM_BLOCK_THRESHOLD_UNSPECIFIED"] = "HARM_BLOCK_THRESHOLD_UNSPECIFIED";
    /** Content with NEGLIGIBLE will be allowed. */
    HarmBlockThreshold["BLOCK_LOW_AND_ABOVE"] = "BLOCK_LOW_AND_ABOVE";
    /** Content with NEGLIGIBLE and LOW will be allowed. */
    HarmBlockThreshold["BLOCK_MEDIUM_AND_ABOVE"] = "BLOCK_MEDIUM_AND_ABOVE";
    /** Content with NEGLIGIBLE, LOW, and MEDIUM will be allowed. */
    HarmBlockThreshold["BLOCK_ONLY_HIGH"] = "BLOCK_ONLY_HIGH";
    /** All content will be allowed. */
    HarmBlockThreshold["BLOCK_NONE"] = "BLOCK_NONE";
})(HarmBlockThreshold || (HarmBlockThreshold = {}));
/**
 * Probability that a prompt or candidate matches a harm category.
 * @public
 */
var HarmProbability;
(function (HarmProbability) {
    /** Probability is unspecified. */
    HarmProbability["HARM_PROBABILITY_UNSPECIFIED"] = "HARM_PROBABILITY_UNSPECIFIED";
    /** Content has a negligible chance of being unsafe. */
    HarmProbability["NEGLIGIBLE"] = "NEGLIGIBLE";
    /** Content has a low chance of being unsafe. */
    HarmProbability["LOW"] = "LOW";
    /** Content has a medium chance of being unsafe. */
    HarmProbability["MEDIUM"] = "MEDIUM";
    /** Content has a high chance of being unsafe. */
    HarmProbability["HIGH"] = "HIGH";
})(HarmProbability || (HarmProbability = {}));
/**
 * Reason that a prompt was blocked.
 * @public
 */
var BlockReason;
(function (BlockReason) {
    // A blocked reason was not specified.
    BlockReason["BLOCKED_REASON_UNSPECIFIED"] = "BLOCKED_REASON_UNSPECIFIED";
    // Content was blocked by safety settings.
    BlockReason["SAFETY"] = "SAFETY";
    // Content was blocked, but the reason is uncategorized.
    BlockReason["OTHER"] = "OTHER";
})(BlockReason || (BlockReason = {}));
/**
 * Reason that a candidate finished.
 * @public
 */
var FinishReason;
(function (FinishReason) {
    // Default value. This value is unused.
    FinishReason["FINISH_REASON_UNSPECIFIED"] = "FINISH_REASON_UNSPECIFIED";
    // Natural stop point of the model or provided stop sequence.
    FinishReason["STOP"] = "STOP";
    // The maximum number of tokens as specified in the request was reached.
    FinishReason["MAX_TOKENS"] = "MAX_TOKENS";
    // The candidate content was flagged for safety reasons.
    FinishReason["SAFETY"] = "SAFETY";
    // The candidate content was flagged for recitation reasons.
    FinishReason["RECITATION"] = "RECITATION";
    // The candidate content was flagged for using an unsupported language.
    FinishReason["LANGUAGE"] = "LANGUAGE";
    // Token generation stopped because the content contains forbidden terms.
    FinishReason["BLOCKLIST"] = "BLOCKLIST";
    // Token generation stopped for potentially containing prohibited content.
    FinishReason["PROHIBITED_CONTENT"] = "PROHIBITED_CONTENT";
    // Token generation stopped because the content potentially contains Sensitive Personally Identifiable Information (SPII).
    FinishReason["SPII"] = "SPII";
    // The function call generated by the model is invalid.
    FinishReason["MALFORMED_FUNCTION_CALL"] = "MALFORMED_FUNCTION_CALL";
    // Unknown reason.
    FinishReason["OTHER"] = "OTHER";
})(FinishReason || (FinishReason = {}));
/**
 * Task type for embedding content.
 * @public
 */
var TaskType;
(function (TaskType) {
    TaskType["TASK_TYPE_UNSPECIFIED"] = "TASK_TYPE_UNSPECIFIED";
    TaskType["RETRIEVAL_QUERY"] = "RETRIEVAL_QUERY";
    TaskType["RETRIEVAL_DOCUMENT"] = "RETRIEVAL_DOCUMENT";
    TaskType["SEMANTIC_SIMILARITY"] = "SEMANTIC_SIMILARITY";
    TaskType["CLASSIFICATION"] = "CLASSIFICATION";
    TaskType["CLUSTERING"] = "CLUSTERING";
})(TaskType || (TaskType = {}));
/**
 * @public
 */
var FunctionCallingMode;
(function (FunctionCallingMode) {
    // Unspecified function calling mode. This value should not be used.
    FunctionCallingMode["MODE_UNSPECIFIED"] = "MODE_UNSPECIFIED";
    // Default model behavior, model decides to predict either a function call
    // or a natural language repspose.
    FunctionCallingMode["AUTO"] = "AUTO";
    // Model is constrained to always predicting a function call only.
    // If "allowed_function_names" are set, the predicted function call will be
    // limited to any one of "allowed_function_names", else the predicted
    // function call will be any one of the provided "function_declarations".
    FunctionCallingMode["ANY"] = "ANY";
    // Model will not predict any function call. Model behavior is same as when
    // not passing any function declarations.
    FunctionCallingMode["NONE"] = "NONE";
})(FunctionCallingMode || (FunctionCallingMode = {}));
/**
 * The mode of the predictor to be used in dynamic retrieval.
 * @public
 */
var DynamicRetrievalMode;
(function (DynamicRetrievalMode) {
    // Unspecified function calling mode. This value should not be used.
    DynamicRetrievalMode["MODE_UNSPECIFIED"] = "MODE_UNSPECIFIED";
    // Run retrieval only when system decides it is necessary.
    DynamicRetrievalMode["MODE_DYNAMIC"] = "MODE_DYNAMIC";
})(DynamicRetrievalMode || (DynamicRetrievalMode = {}));

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Basic error type for this SDK.
 * @public
 */
class GoogleGenerativeAIError extends Error {
    constructor(message) {
        super(`[GoogleGenerativeAI Error]: ${message}`);
    }
}
/**
 * Errors in the contents of a response from the model. This includes parsing
 * errors, or responses including a safety block reason.
 * @public
 */
class GoogleGenerativeAIResponseError extends GoogleGenerativeAIError {
    constructor(message, response) {
        super(message);
        this.response = response;
    }
}
/**
 * Error class covering HTTP errors when calling the server. Includes HTTP
 * status, statusText, and optional details, if provided in the server response.
 * @public
 */
class GoogleGenerativeAIFetchError extends GoogleGenerativeAIError {
    constructor(message, status, statusText, errorDetails) {
        super(message);
        this.status = status;
        this.statusText = statusText;
        this.errorDetails = errorDetails;
    }
}
/**
 * Errors in the contents of a request originating from user input.
 * @public
 */
class GoogleGenerativeAIRequestInputError extends GoogleGenerativeAIError {
}
/**
 * Error thrown when a request is aborted, either due to a timeout or
 * intentional cancellation by the user.
 * @public
 */
class GoogleGenerativeAIAbortError extends GoogleGenerativeAIError {
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com";
const DEFAULT_API_VERSION = "v1beta";
/**
 * We can't `require` package.json if this runs on web. We will use rollup to
 * swap in the version number here at build time.
 */
const PACKAGE_VERSION = "0.24.1";
const PACKAGE_LOG_HEADER = "genai-js";
var Task;
(function (Task) {
    Task["GENERATE_CONTENT"] = "generateContent";
    Task["STREAM_GENERATE_CONTENT"] = "streamGenerateContent";
    Task["COUNT_TOKENS"] = "countTokens";
    Task["EMBED_CONTENT"] = "embedContent";
    Task["BATCH_EMBED_CONTENTS"] = "batchEmbedContents";
})(Task || (Task = {}));
class RequestUrl {
    constructor(model, task, apiKey, stream, requestOptions) {
        this.model = model;
        this.task = task;
        this.apiKey = apiKey;
        this.stream = stream;
        this.requestOptions = requestOptions;
    }
    toString() {
        var _a, _b;
        const apiVersion = ((_a = this.requestOptions) === null || _a === void 0 ? void 0 : _a.apiVersion) || DEFAULT_API_VERSION;
        const baseUrl = ((_b = this.requestOptions) === null || _b === void 0 ? void 0 : _b.baseUrl) || DEFAULT_BASE_URL;
        let url = `${baseUrl}/${apiVersion}/${this.model}:${this.task}`;
        if (this.stream) {
            url += "?alt=sse";
        }
        return url;
    }
}
/**
 * Simple, but may become more complex if we add more versions to log.
 */
function getClientHeaders(requestOptions) {
    const clientHeaders = [];
    if (requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.apiClient) {
        clientHeaders.push(requestOptions.apiClient);
    }
    clientHeaders.push(`${PACKAGE_LOG_HEADER}/${PACKAGE_VERSION}`);
    return clientHeaders.join(" ");
}
async function getHeaders(url) {
    var _a;
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("x-goog-api-client", getClientHeaders(url.requestOptions));
    headers.append("x-goog-api-key", url.apiKey);
    let customHeaders = (_a = url.requestOptions) === null || _a === void 0 ? void 0 : _a.customHeaders;
    if (customHeaders) {
        if (!(customHeaders instanceof Headers)) {
            try {
                customHeaders = new Headers(customHeaders);
            }
            catch (e) {
                throw new GoogleGenerativeAIRequestInputError(`unable to convert customHeaders value ${JSON.stringify(customHeaders)} to Headers: ${e.message}`);
            }
        }
        for (const [headerName, headerValue] of customHeaders.entries()) {
            if (headerName === "x-goog-api-key") {
                throw new GoogleGenerativeAIRequestInputError(`Cannot set reserved header name ${headerName}`);
            }
            else if (headerName === "x-goog-api-client") {
                throw new GoogleGenerativeAIRequestInputError(`Header name ${headerName} can only be set using the apiClient field`);
            }
            headers.append(headerName, headerValue);
        }
    }
    return headers;
}
async function constructModelRequest(model, task, apiKey, stream, body, requestOptions) {
    const url = new RequestUrl(model, task, apiKey, stream, requestOptions);
    return {
        url: url.toString(),
        fetchOptions: Object.assign(Object.assign({}, buildFetchOptions(requestOptions)), { method: "POST", headers: await getHeaders(url), body }),
    };
}
async function makeModelRequest(model, task, apiKey, stream, body, requestOptions = {}, 
// Allows this to be stubbed for tests
fetchFn = fetch) {
    const { url, fetchOptions } = await constructModelRequest(model, task, apiKey, stream, body, requestOptions);
    return makeRequest(url, fetchOptions, fetchFn);
}
async function makeRequest(url, fetchOptions, fetchFn = fetch) {
    let response;
    try {
        response = await fetchFn(url, fetchOptions);
    }
    catch (e) {
        handleResponseError(e, url);
    }
    if (!response.ok) {
        await handleResponseNotOk(response, url);
    }
    return response;
}
function handleResponseError(e, url) {
    let err = e;
    if (err.name === "AbortError") {
        err = new GoogleGenerativeAIAbortError(`Request aborted when fetching ${url.toString()}: ${e.message}`);
        err.stack = e.stack;
    }
    else if (!(e instanceof GoogleGenerativeAIFetchError ||
        e instanceof GoogleGenerativeAIRequestInputError)) {
        err = new GoogleGenerativeAIError(`Error fetching from ${url.toString()}: ${e.message}`);
        err.stack = e.stack;
    }
    throw err;
}
async function handleResponseNotOk(response, url) {
    let message = "";
    let errorDetails;
    try {
        const json = await response.json();
        message = json.error.message;
        if (json.error.details) {
            message += ` ${JSON.stringify(json.error.details)}`;
            errorDetails = json.error.details;
        }
    }
    catch (e) {
        // ignored
    }
    throw new GoogleGenerativeAIFetchError(`Error fetching from ${url.toString()}: [${response.status} ${response.statusText}] ${message}`, response.status, response.statusText, errorDetails);
}
/**
 * Generates the request options to be passed to the fetch API.
 * @param requestOptions - The user-defined request options.
 * @returns The generated request options.
 */
function buildFetchOptions(requestOptions) {
    const fetchOptions = {};
    if ((requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.signal) !== undefined || (requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeout) >= 0) {
        const controller = new AbortController();
        if ((requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeout) >= 0) {
            setTimeout(() => controller.abort(), requestOptions.timeout);
        }
        if (requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.signal) {
            requestOptions.signal.addEventListener("abort", () => {
                controller.abort();
            });
        }
        fetchOptions.signal = controller.signal;
    }
    return fetchOptions;
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Adds convenience helper methods to a response object, including stream
 * chunks (as long as each chunk is a complete GenerateContentResponse JSON).
 */
function addHelpers(response) {
    response.text = () => {
        if (response.candidates && response.candidates.length > 0) {
            if (response.candidates.length > 1) {
                console.warn(`This response had ${response.candidates.length} ` +
                    `candidates. Returning text from the first candidate only. ` +
                    `Access response.candidates directly to use the other candidates.`);
            }
            if (hadBadFinishReason(response.candidates[0])) {
                throw new GoogleGenerativeAIResponseError(`${formatBlockErrorMessage(response)}`, response);
            }
            return getText(response);
        }
        else if (response.promptFeedback) {
            throw new GoogleGenerativeAIResponseError(`Text not available. ${formatBlockErrorMessage(response)}`, response);
        }
        return "";
    };
    /**
     * TODO: remove at next major version
     */
    response.functionCall = () => {
        if (response.candidates && response.candidates.length > 0) {
            if (response.candidates.length > 1) {
                console.warn(`This response had ${response.candidates.length} ` +
                    `candidates. Returning function calls from the first candidate only. ` +
                    `Access response.candidates directly to use the other candidates.`);
            }
            if (hadBadFinishReason(response.candidates[0])) {
                throw new GoogleGenerativeAIResponseError(`${formatBlockErrorMessage(response)}`, response);
            }
            console.warn(`response.functionCall() is deprecated. ` +
                `Use response.functionCalls() instead.`);
            return getFunctionCalls(response)[0];
        }
        else if (response.promptFeedback) {
            throw new GoogleGenerativeAIResponseError(`Function call not available. ${formatBlockErrorMessage(response)}`, response);
        }
        return undefined;
    };
    response.functionCalls = () => {
        if (response.candidates && response.candidates.length > 0) {
            if (response.candidates.length > 1) {
                console.warn(`This response had ${response.candidates.length} ` +
                    `candidates. Returning function calls from the first candidate only. ` +
                    `Access response.candidates directly to use the other candidates.`);
            }
            if (hadBadFinishReason(response.candidates[0])) {
                throw new GoogleGenerativeAIResponseError(`${formatBlockErrorMessage(response)}`, response);
            }
            return getFunctionCalls(response);
        }
        else if (response.promptFeedback) {
            throw new GoogleGenerativeAIResponseError(`Function call not available. ${formatBlockErrorMessage(response)}`, response);
        }
        return undefined;
    };
    return response;
}
/**
 * Returns all text found in all parts of first candidate.
 */
function getText(response) {
    var _a, _b, _c, _d;
    const textStrings = [];
    if ((_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0].content) === null || _b === void 0 ? void 0 : _b.parts) {
        for (const part of (_d = (_c = response.candidates) === null || _c === void 0 ? void 0 : _c[0].content) === null || _d === void 0 ? void 0 : _d.parts) {
            if (part.text) {
                textStrings.push(part.text);
            }
            if (part.executableCode) {
                textStrings.push("\n```" +
                    part.executableCode.language +
                    "\n" +
                    part.executableCode.code +
                    "\n```\n");
            }
            if (part.codeExecutionResult) {
                textStrings.push("\n```\n" + part.codeExecutionResult.output + "\n```\n");
            }
        }
    }
    if (textStrings.length > 0) {
        return textStrings.join("");
    }
    else {
        return "";
    }
}
/**
 * Returns functionCall of first candidate.
 */
function getFunctionCalls(response) {
    var _a, _b, _c, _d;
    const functionCalls = [];
    if ((_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0].content) === null || _b === void 0 ? void 0 : _b.parts) {
        for (const part of (_d = (_c = response.candidates) === null || _c === void 0 ? void 0 : _c[0].content) === null || _d === void 0 ? void 0 : _d.parts) {
            if (part.functionCall) {
                functionCalls.push(part.functionCall);
            }
        }
    }
    if (functionCalls.length > 0) {
        return functionCalls;
    }
    else {
        return undefined;
    }
}
const badFinishReasons = [
    FinishReason.RECITATION,
    FinishReason.SAFETY,
    FinishReason.LANGUAGE,
];
function hadBadFinishReason(candidate) {
    return (!!candidate.finishReason &&
        badFinishReasons.includes(candidate.finishReason));
}
function formatBlockErrorMessage(response) {
    var _a, _b, _c;
    let message = "";
    if ((!response.candidates || response.candidates.length === 0) &&
        response.promptFeedback) {
        message += "Response was blocked";
        if ((_a = response.promptFeedback) === null || _a === void 0 ? void 0 : _a.blockReason) {
            message += ` due to ${response.promptFeedback.blockReason}`;
        }
        if ((_b = response.promptFeedback) === null || _b === void 0 ? void 0 : _b.blockReasonMessage) {
            message += `: ${response.promptFeedback.blockReasonMessage}`;
        }
    }
    else if ((_c = response.candidates) === null || _c === void 0 ? void 0 : _c[0]) {
        const firstCandidate = response.candidates[0];
        if (hadBadFinishReason(firstCandidate)) {
            message += `Candidate was blocked due to ${firstCandidate.finishReason}`;
            if (firstCandidate.finishMessage) {
                message += `: ${firstCandidate.finishMessage}`;
            }
        }
    }
    return message;
}

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol */


function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const responseLineRE = /^data\: (.*)(?:\n\n|\r\r|\r\n\r\n)/;
/**
 * Process a response.body stream from the backend and return an
 * iterator that provides one complete GenerateContentResponse at a time
 * and a promise that resolves with a single aggregated
 * GenerateContentResponse.
 *
 * @param response - Response from a fetch call
 */
function processStream(response) {
    const inputStream = response.body.pipeThrough(new TextDecoderStream("utf8", { fatal: true }));
    const responseStream = getResponseStream(inputStream);
    const [stream1, stream2] = responseStream.tee();
    return {
        stream: generateResponseSequence(stream1),
        response: getResponsePromise(stream2),
    };
}
async function getResponsePromise(stream) {
    const allResponses = [];
    const reader = stream.getReader();
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            return addHelpers(aggregateResponses(allResponses));
        }
        allResponses.push(value);
    }
}
function generateResponseSequence(stream) {
    return __asyncGenerator(this, arguments, function* generateResponseSequence_1() {
        const reader = stream.getReader();
        while (true) {
            const { value, done } = yield __await(reader.read());
            if (done) {
                break;
            }
            yield yield __await(addHelpers(value));
        }
    });
}
/**
 * Reads a raw stream from the fetch response and join incomplete
 * chunks, returning a new stream that provides a single complete
 * GenerateContentResponse in each iteration.
 */
function getResponseStream(inputStream) {
    const reader = inputStream.getReader();
    const stream = new ReadableStream({
        start(controller) {
            let currentText = "";
            return pump();
            function pump() {
                return reader
                    .read()
                    .then(({ value, done }) => {
                    if (done) {
                        if (currentText.trim()) {
                            controller.error(new GoogleGenerativeAIError("Failed to parse stream"));
                            return;
                        }
                        controller.close();
                        return;
                    }
                    currentText += value;
                    let match = currentText.match(responseLineRE);
                    let parsedResponse;
                    while (match) {
                        try {
                            parsedResponse = JSON.parse(match[1]);
                        }
                        catch (e) {
                            controller.error(new GoogleGenerativeAIError(`Error parsing JSON response: "${match[1]}"`));
                            return;
                        }
                        controller.enqueue(parsedResponse);
                        currentText = currentText.substring(match[0].length);
                        match = currentText.match(responseLineRE);
                    }
                    return pump();
                })
                    .catch((e) => {
                    let err = e;
                    err.stack = e.stack;
                    if (err.name === "AbortError") {
                        err = new GoogleGenerativeAIAbortError("Request aborted when reading from the stream");
                    }
                    else {
                        err = new GoogleGenerativeAIError("Error reading from the stream");
                    }
                    throw err;
                });
            }
        },
    });
    return stream;
}
/**
 * Aggregates an array of `GenerateContentResponse`s into a single
 * GenerateContentResponse.
 */
function aggregateResponses(responses) {
    const lastResponse = responses[responses.length - 1];
    const aggregatedResponse = {
        promptFeedback: lastResponse === null || lastResponse === void 0 ? void 0 : lastResponse.promptFeedback,
    };
    for (const response of responses) {
        if (response.candidates) {
            let candidateIndex = 0;
            for (const candidate of response.candidates) {
                if (!aggregatedResponse.candidates) {
                    aggregatedResponse.candidates = [];
                }
                if (!aggregatedResponse.candidates[candidateIndex]) {
                    aggregatedResponse.candidates[candidateIndex] = {
                        index: candidateIndex,
                    };
                }
                // Keep overwriting, the last one will be final
                aggregatedResponse.candidates[candidateIndex].citationMetadata =
                    candidate.citationMetadata;
                aggregatedResponse.candidates[candidateIndex].groundingMetadata =
                    candidate.groundingMetadata;
                aggregatedResponse.candidates[candidateIndex].finishReason =
                    candidate.finishReason;
                aggregatedResponse.candidates[candidateIndex].finishMessage =
                    candidate.finishMessage;
                aggregatedResponse.candidates[candidateIndex].safetyRatings =
                    candidate.safetyRatings;
                /**
                 * Candidates should always have content and parts, but this handles
                 * possible malformed responses.
                 */
                if (candidate.content && candidate.content.parts) {
                    if (!aggregatedResponse.candidates[candidateIndex].content) {
                        aggregatedResponse.candidates[candidateIndex].content = {
                            role: candidate.content.role || "user",
                            parts: [],
                        };
                    }
                    const newPart = {};
                    for (const part of candidate.content.parts) {
                        if (part.text) {
                            newPart.text = part.text;
                        }
                        if (part.functionCall) {
                            newPart.functionCall = part.functionCall;
                        }
                        if (part.executableCode) {
                            newPart.executableCode = part.executableCode;
                        }
                        if (part.codeExecutionResult) {
                            newPart.codeExecutionResult = part.codeExecutionResult;
                        }
                        if (Object.keys(newPart).length === 0) {
                            newPart.text = "";
                        }
                        aggregatedResponse.candidates[candidateIndex].content.parts.push(newPart);
                    }
                }
            }
            candidateIndex++;
        }
        if (response.usageMetadata) {
            aggregatedResponse.usageMetadata = response.usageMetadata;
        }
    }
    return aggregatedResponse;
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
async function generateContentStream(apiKey, model, params, requestOptions) {
    const response = await makeModelRequest(model, Task.STREAM_GENERATE_CONTENT, apiKey, 
    /* stream */ true, JSON.stringify(params), requestOptions);
    return processStream(response);
}
async function generateContent(apiKey, model, params, requestOptions) {
    const response = await makeModelRequest(model, Task.GENERATE_CONTENT, apiKey, 
    /* stream */ false, JSON.stringify(params), requestOptions);
    const responseJson = await response.json();
    const enhancedResponse = addHelpers(responseJson);
    return {
        response: enhancedResponse,
    };
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function formatSystemInstruction(input) {
    // null or undefined
    if (input == null) {
        return undefined;
    }
    else if (typeof input === "string") {
        return { role: "system", parts: [{ text: input }] };
    }
    else if (input.text) {
        return { role: "system", parts: [input] };
    }
    else if (input.parts) {
        if (!input.role) {
            return { role: "system", parts: input.parts };
        }
        else {
            return input;
        }
    }
}
function formatNewContent(request) {
    let newParts = [];
    if (typeof request === "string") {
        newParts = [{ text: request }];
    }
    else {
        for (const partOrString of request) {
            if (typeof partOrString === "string") {
                newParts.push({ text: partOrString });
            }
            else {
                newParts.push(partOrString);
            }
        }
    }
    return assignRoleToPartsAndValidateSendMessageRequest(newParts);
}
/**
 * When multiple Part types (i.e. FunctionResponsePart and TextPart) are
 * passed in a single Part array, we may need to assign different roles to each
 * part. Currently only FunctionResponsePart requires a role other than 'user'.
 * @private
 * @param parts Array of parts to pass to the model
 * @returns Array of content items
 */
function assignRoleToPartsAndValidateSendMessageRequest(parts) {
    const userContent = { role: "user", parts: [] };
    const functionContent = { role: "function", parts: [] };
    let hasUserContent = false;
    let hasFunctionContent = false;
    for (const part of parts) {
        if ("functionResponse" in part) {
            functionContent.parts.push(part);
            hasFunctionContent = true;
        }
        else {
            userContent.parts.push(part);
            hasUserContent = true;
        }
    }
    if (hasUserContent && hasFunctionContent) {
        throw new GoogleGenerativeAIError("Within a single message, FunctionResponse cannot be mixed with other type of part in the request for sending chat message.");
    }
    if (!hasUserContent && !hasFunctionContent) {
        throw new GoogleGenerativeAIError("No content is provided for sending chat message.");
    }
    if (hasUserContent) {
        return userContent;
    }
    return functionContent;
}
function formatCountTokensInput(params, modelParams) {
    var _a;
    let formattedGenerateContentRequest = {
        model: modelParams === null || modelParams === void 0 ? void 0 : modelParams.model,
        generationConfig: modelParams === null || modelParams === void 0 ? void 0 : modelParams.generationConfig,
        safetySettings: modelParams === null || modelParams === void 0 ? void 0 : modelParams.safetySettings,
        tools: modelParams === null || modelParams === void 0 ? void 0 : modelParams.tools,
        toolConfig: modelParams === null || modelParams === void 0 ? void 0 : modelParams.toolConfig,
        systemInstruction: modelParams === null || modelParams === void 0 ? void 0 : modelParams.systemInstruction,
        cachedContent: (_a = modelParams === null || modelParams === void 0 ? void 0 : modelParams.cachedContent) === null || _a === void 0 ? void 0 : _a.name,
        contents: [],
    };
    const containsGenerateContentRequest = params.generateContentRequest != null;
    if (params.contents) {
        if (containsGenerateContentRequest) {
            throw new GoogleGenerativeAIRequestInputError("CountTokensRequest must have one of contents or generateContentRequest, not both.");
        }
        formattedGenerateContentRequest.contents = params.contents;
    }
    else if (containsGenerateContentRequest) {
        formattedGenerateContentRequest = Object.assign(Object.assign({}, formattedGenerateContentRequest), params.generateContentRequest);
    }
    else {
        // Array or string
        const content = formatNewContent(params);
        formattedGenerateContentRequest.contents = [content];
    }
    return { generateContentRequest: formattedGenerateContentRequest };
}
function formatGenerateContentInput(params) {
    let formattedRequest;
    if (params.contents) {
        formattedRequest = params;
    }
    else {
        // Array or string
        const content = formatNewContent(params);
        formattedRequest = { contents: [content] };
    }
    if (params.systemInstruction) {
        formattedRequest.systemInstruction = formatSystemInstruction(params.systemInstruction);
    }
    return formattedRequest;
}
function formatEmbedContentInput(params) {
    if (typeof params === "string" || Array.isArray(params)) {
        const content = formatNewContent(params);
        return { content };
    }
    return params;
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// https://ai.google.dev/api/rest/v1beta/Content#part
const VALID_PART_FIELDS = [
    "text",
    "inlineData",
    "functionCall",
    "functionResponse",
    "executableCode",
    "codeExecutionResult",
];
const VALID_PARTS_PER_ROLE = {
    user: ["text", "inlineData"],
    function: ["functionResponse"],
    model: ["text", "functionCall", "executableCode", "codeExecutionResult"],
    // System instructions shouldn't be in history anyway.
    system: ["text"],
};
function validateChatHistory(history) {
    let prevContent = false;
    for (const currContent of history) {
        const { role, parts } = currContent;
        if (!prevContent && role !== "user") {
            throw new GoogleGenerativeAIError(`First content should be with role 'user', got ${role}`);
        }
        if (!POSSIBLE_ROLES.includes(role)) {
            throw new GoogleGenerativeAIError(`Each item should include role field. Got ${role} but valid roles are: ${JSON.stringify(POSSIBLE_ROLES)}`);
        }
        if (!Array.isArray(parts)) {
            throw new GoogleGenerativeAIError("Content should have 'parts' property with an array of Parts");
        }
        if (parts.length === 0) {
            throw new GoogleGenerativeAIError("Each Content should have at least one part");
        }
        const countFields = {
            text: 0,
            inlineData: 0,
            functionCall: 0,
            functionResponse: 0,
            fileData: 0,
            executableCode: 0,
            codeExecutionResult: 0,
        };
        for (const part of parts) {
            for (const key of VALID_PART_FIELDS) {
                if (key in part) {
                    countFields[key] += 1;
                }
            }
        }
        const validParts = VALID_PARTS_PER_ROLE[role];
        for (const key of VALID_PART_FIELDS) {
            if (!validParts.includes(key) && countFields[key] > 0) {
                throw new GoogleGenerativeAIError(`Content with role '${role}' can't contain '${key}' part`);
            }
        }
        prevContent = true;
    }
}
/**
 * Returns true if the response is valid (could be appended to the history), flase otherwise.
 */
function isValidResponse(response) {
    var _a;
    if (response.candidates === undefined || response.candidates.length === 0) {
        return false;
    }
    const content = (_a = response.candidates[0]) === null || _a === void 0 ? void 0 : _a.content;
    if (content === undefined) {
        return false;
    }
    if (content.parts === undefined || content.parts.length === 0) {
        return false;
    }
    for (const part of content.parts) {
        if (part === undefined || Object.keys(part).length === 0) {
            return false;
        }
        if (part.text !== undefined && part.text === "") {
            return false;
        }
    }
    return true;
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Do not log a message for this error.
 */
const SILENT_ERROR = "SILENT_ERROR";
/**
 * ChatSession class that enables sending chat messages and stores
 * history of sent and received messages so far.
 *
 * @public
 */
class ChatSession {
    constructor(apiKey, model, params, _requestOptions = {}) {
        this.model = model;
        this.params = params;
        this._requestOptions = _requestOptions;
        this._history = [];
        this._sendPromise = Promise.resolve();
        this._apiKey = apiKey;
        if (params === null || params === void 0 ? void 0 : params.history) {
            validateChatHistory(params.history);
            this._history = params.history;
        }
    }
    /**
     * Gets the chat history so far. Blocked prompts are not added to history.
     * Blocked candidates are not added to history, nor are the prompts that
     * generated them.
     */
    async getHistory() {
        await this._sendPromise;
        return this._history;
    }
    /**
     * Sends a chat message and receives a non-streaming
     * {@link GenerateContentResult}.
     *
     * Fields set in the optional {@link SingleRequestOptions} parameter will
     * take precedence over the {@link RequestOptions} values provided to
     * {@link GoogleGenerativeAI.getGenerativeModel }.
     */
    async sendMessage(request, requestOptions = {}) {
        var _a, _b, _c, _d, _e, _f;
        await this._sendPromise;
        const newContent = formatNewContent(request);
        const generateContentRequest = {
            safetySettings: (_a = this.params) === null || _a === void 0 ? void 0 : _a.safetySettings,
            generationConfig: (_b = this.params) === null || _b === void 0 ? void 0 : _b.generationConfig,
            tools: (_c = this.params) === null || _c === void 0 ? void 0 : _c.tools,
            toolConfig: (_d = this.params) === null || _d === void 0 ? void 0 : _d.toolConfig,
            systemInstruction: (_e = this.params) === null || _e === void 0 ? void 0 : _e.systemInstruction,
            cachedContent: (_f = this.params) === null || _f === void 0 ? void 0 : _f.cachedContent,
            contents: [...this._history, newContent],
        };
        const chatSessionRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
        let finalResult;
        // Add onto the chain.
        this._sendPromise = this._sendPromise
            .then(() => generateContent(this._apiKey, this.model, generateContentRequest, chatSessionRequestOptions))
            .then((result) => {
            var _a;
            if (isValidResponse(result.response)) {
                this._history.push(newContent);
                const responseContent = Object.assign({ parts: [], 
                    // Response seems to come back without a role set.
                    role: "model" }, (_a = result.response.candidates) === null || _a === void 0 ? void 0 : _a[0].content);
                this._history.push(responseContent);
            }
            else {
                const blockErrorMessage = formatBlockErrorMessage(result.response);
                if (blockErrorMessage) {
                    console.warn(`sendMessage() was unsuccessful. ${blockErrorMessage}. Inspect response object for details.`);
                }
            }
            finalResult = result;
        })
            .catch((e) => {
            // Resets _sendPromise to avoid subsequent calls failing and throw error.
            this._sendPromise = Promise.resolve();
            throw e;
        });
        await this._sendPromise;
        return finalResult;
    }
    /**
     * Sends a chat message and receives the response as a
     * {@link GenerateContentStreamResult} containing an iterable stream
     * and a response promise.
     *
     * Fields set in the optional {@link SingleRequestOptions} parameter will
     * take precedence over the {@link RequestOptions} values provided to
     * {@link GoogleGenerativeAI.getGenerativeModel }.
     */
    async sendMessageStream(request, requestOptions = {}) {
        var _a, _b, _c, _d, _e, _f;
        await this._sendPromise;
        const newContent = formatNewContent(request);
        const generateContentRequest = {
            safetySettings: (_a = this.params) === null || _a === void 0 ? void 0 : _a.safetySettings,
            generationConfig: (_b = this.params) === null || _b === void 0 ? void 0 : _b.generationConfig,
            tools: (_c = this.params) === null || _c === void 0 ? void 0 : _c.tools,
            toolConfig: (_d = this.params) === null || _d === void 0 ? void 0 : _d.toolConfig,
            systemInstruction: (_e = this.params) === null || _e === void 0 ? void 0 : _e.systemInstruction,
            cachedContent: (_f = this.params) === null || _f === void 0 ? void 0 : _f.cachedContent,
            contents: [...this._history, newContent],
        };
        const chatSessionRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
        const streamPromise = generateContentStream(this._apiKey, this.model, generateContentRequest, chatSessionRequestOptions);
        // Add onto the chain.
        this._sendPromise = this._sendPromise
            .then(() => streamPromise)
            // This must be handled to avoid unhandled rejection, but jump
            // to the final catch block with a label to not log this error.
            .catch((_ignored) => {
            throw new Error(SILENT_ERROR);
        })
            .then((streamResult) => streamResult.response)
            .then((response) => {
            if (isValidResponse(response)) {
                this._history.push(newContent);
                const responseContent = Object.assign({}, response.candidates[0].content);
                // Response seems to come back without a role set.
                if (!responseContent.role) {
                    responseContent.role = "model";
                }
                this._history.push(responseContent);
            }
            else {
                const blockErrorMessage = formatBlockErrorMessage(response);
                if (blockErrorMessage) {
                    console.warn(`sendMessageStream() was unsuccessful. ${blockErrorMessage}. Inspect response object for details.`);
                }
            }
        })
            .catch((e) => {
            // Errors in streamPromise are already catchable by the user as
            // streamPromise is returned.
            // Avoid duplicating the error message in logs.
            if (e.message !== SILENT_ERROR) {
                // Users do not have access to _sendPromise to catch errors
                // downstream from streamPromise, so they should not throw.
                console.error(e);
            }
        });
        return streamPromise;
    }
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
async function countTokens(apiKey, model, params, singleRequestOptions) {
    const response = await makeModelRequest(model, Task.COUNT_TOKENS, apiKey, false, JSON.stringify(params), singleRequestOptions);
    return response.json();
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
async function embedContent(apiKey, model, params, requestOptions) {
    const response = await makeModelRequest(model, Task.EMBED_CONTENT, apiKey, false, JSON.stringify(params), requestOptions);
    return response.json();
}
async function batchEmbedContents(apiKey, model, params, requestOptions) {
    const requestsWithModel = params.requests.map((request) => {
        return Object.assign(Object.assign({}, request), { model });
    });
    const response = await makeModelRequest(model, Task.BATCH_EMBED_CONTENTS, apiKey, false, JSON.stringify({ requests: requestsWithModel }), requestOptions);
    return response.json();
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Class for generative model APIs.
 * @public
 */
class GenerativeModel {
    constructor(apiKey, modelParams, _requestOptions = {}) {
        this.apiKey = apiKey;
        this._requestOptions = _requestOptions;
        if (modelParams.model.includes("/")) {
            // Models may be named "models/model-name" or "tunedModels/model-name"
            this.model = modelParams.model;
        }
        else {
            // If path is not included, assume it's a non-tuned model.
            this.model = `models/${modelParams.model}`;
        }
        this.generationConfig = modelParams.generationConfig || {};
        this.safetySettings = modelParams.safetySettings || [];
        this.tools = modelParams.tools;
        this.toolConfig = modelParams.toolConfig;
        this.systemInstruction = formatSystemInstruction(modelParams.systemInstruction);
        this.cachedContent = modelParams.cachedContent;
    }
    /**
     * Makes a single non-streaming call to the model
     * and returns an object containing a single {@link GenerateContentResponse}.
     *
     * Fields set in the optional {@link SingleRequestOptions} parameter will
     * take precedence over the {@link RequestOptions} values provided to
     * {@link GoogleGenerativeAI.getGenerativeModel }.
     */
    async generateContent(request, requestOptions = {}) {
        var _a;
        const formattedParams = formatGenerateContentInput(request);
        const generativeModelRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
        return generateContent(this.apiKey, this.model, Object.assign({ generationConfig: this.generationConfig, safetySettings: this.safetySettings, tools: this.tools, toolConfig: this.toolConfig, systemInstruction: this.systemInstruction, cachedContent: (_a = this.cachedContent) === null || _a === void 0 ? void 0 : _a.name }, formattedParams), generativeModelRequestOptions);
    }
    /**
     * Makes a single streaming call to the model and returns an object
     * containing an iterable stream that iterates over all chunks in the
     * streaming response as well as a promise that returns the final
     * aggregated response.
     *
     * Fields set in the optional {@link SingleRequestOptions} parameter will
     * take precedence over the {@link RequestOptions} values provided to
     * {@link GoogleGenerativeAI.getGenerativeModel }.
     */
    async generateContentStream(request, requestOptions = {}) {
        var _a;
        const formattedParams = formatGenerateContentInput(request);
        const generativeModelRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
        return generateContentStream(this.apiKey, this.model, Object.assign({ generationConfig: this.generationConfig, safetySettings: this.safetySettings, tools: this.tools, toolConfig: this.toolConfig, systemInstruction: this.systemInstruction, cachedContent: (_a = this.cachedContent) === null || _a === void 0 ? void 0 : _a.name }, formattedParams), generativeModelRequestOptions);
    }
    /**
     * Gets a new {@link ChatSession} instance which can be used for
     * multi-turn chats.
     */
    startChat(startChatParams) {
        var _a;
        return new ChatSession(this.apiKey, this.model, Object.assign({ generationConfig: this.generationConfig, safetySettings: this.safetySettings, tools: this.tools, toolConfig: this.toolConfig, systemInstruction: this.systemInstruction, cachedContent: (_a = this.cachedContent) === null || _a === void 0 ? void 0 : _a.name }, startChatParams), this._requestOptions);
    }
    /**
     * Counts the tokens in the provided request.
     *
     * Fields set in the optional {@link SingleRequestOptions} parameter will
     * take precedence over the {@link RequestOptions} values provided to
     * {@link GoogleGenerativeAI.getGenerativeModel }.
     */
    async countTokens(request, requestOptions = {}) {
        const formattedParams = formatCountTokensInput(request, {
            model: this.model,
            generationConfig: this.generationConfig,
            safetySettings: this.safetySettings,
            tools: this.tools,
            toolConfig: this.toolConfig,
            systemInstruction: this.systemInstruction,
            cachedContent: this.cachedContent,
        });
        const generativeModelRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
        return countTokens(this.apiKey, this.model, formattedParams, generativeModelRequestOptions);
    }
    /**
     * Embeds the provided content.
     *
     * Fields set in the optional {@link SingleRequestOptions} parameter will
     * take precedence over the {@link RequestOptions} values provided to
     * {@link GoogleGenerativeAI.getGenerativeModel }.
     */
    async embedContent(request, requestOptions = {}) {
        const formattedParams = formatEmbedContentInput(request);
        const generativeModelRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
        return embedContent(this.apiKey, this.model, formattedParams, generativeModelRequestOptions);
    }
    /**
     * Embeds an array of {@link EmbedContentRequest}s.
     *
     * Fields set in the optional {@link SingleRequestOptions} parameter will
     * take precedence over the {@link RequestOptions} values provided to
     * {@link GoogleGenerativeAI.getGenerativeModel }.
     */
    async batchEmbedContents(batchEmbedContentRequest, requestOptions = {}) {
        const generativeModelRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
        return batchEmbedContents(this.apiKey, this.model, batchEmbedContentRequest, generativeModelRequestOptions);
    }
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Top-level class for this SDK
 * @public
 */
class GoogleGenerativeAI {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    /**
     * Gets a {@link GenerativeModel} instance for the provided model name.
     */
    getGenerativeModel(modelParams, requestOptions) {
        if (!modelParams.model) {
            throw new GoogleGenerativeAIError(`Must provide a model name. ` +
                `Example: genai.getGenerativeModel({ model: 'my-model-name' })`);
        }
        return new GenerativeModel(this.apiKey, modelParams, requestOptions);
    }
    /**
     * Creates a {@link GenerativeModel} instance from provided content cache.
     */
    getGenerativeModelFromCachedContent(cachedContent, modelParams, requestOptions) {
        if (!cachedContent.name) {
            throw new GoogleGenerativeAIRequestInputError("Cached content must contain a `name` field.");
        }
        if (!cachedContent.model) {
            throw new GoogleGenerativeAIRequestInputError("Cached content must contain a `model` field.");
        }
        /**
         * Not checking tools and toolConfig for now as it would require a deep
         * equality comparison and isn't likely to be a common case.
         */
        const disallowedDuplicates = ["model", "systemInstruction"];
        for (const key of disallowedDuplicates) {
            if ((modelParams === null || modelParams === void 0 ? void 0 : modelParams[key]) &&
                cachedContent[key] &&
                (modelParams === null || modelParams === void 0 ? void 0 : modelParams[key]) !== cachedContent[key]) {
                if (key === "model") {
                    const modelParamsComp = modelParams.model.startsWith("models/")
                        ? modelParams.model.replace("models/", "")
                        : modelParams.model;
                    const cachedContentComp = cachedContent.model.startsWith("models/")
                        ? cachedContent.model.replace("models/", "")
                        : cachedContent.model;
                    if (modelParamsComp === cachedContentComp) {
                        continue;
                    }
                }
                throw new GoogleGenerativeAIRequestInputError(`Different value for "${key}" specified in modelParams` +
                    ` (${modelParams[key]}) and cachedContent (${cachedContent[key]})`);
            }
        }
        const modelParamsFromCache = Object.assign(Object.assign({}, modelParams), { model: cachedContent.model, tools: cachedContent.tools, toolConfig: cachedContent.toolConfig, systemInstruction: cachedContent.systemInstruction, cachedContent });
        return new GenerativeModel(this.apiKey, modelParamsFromCache, requestOptions);
    }
}


//# sourceMappingURL=index.mjs.map


/***/ }),

/***/ "./resources/js/gemini.js":
/*!********************************!*\
  !*** ./resources/js/gemini.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   generateText: () => (/* binding */ generateText)
/* harmony export */ });
/* harmony import */ var _google_generative_ai__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @google/generative-ai */ "./node_modules/@google/generative-ai/dist/index.mjs");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }

var API_KEY = "AIzaSyD33XJDaflftv-k0Iz2KKqd9YlGZq45DeA"; // Replace with your real API key

var genAI = new _google_generative_ai__WEBPACK_IMPORTED_MODULE_0__.GoogleGenerativeAI(API_KEY);
function generateText(_x) {
  return _generateText.apply(this, arguments);
}
function _generateText() {
  _generateText = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(userPrompt) {
    var model, result, responseText, titlePrompt, titleResult, title;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          console.log("Generating text with Gemini API...", userPrompt);
          model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash"
          });
          _context.next = 4;
          return model.generateContent(userPrompt);
        case 4:
          result = _context.sent;
          _context.next = 7;
          return result.response.text();
        case 7:
          responseText = _context.sent;
          // Now ask Gemini to summarize the response in a 23-word title
          titlePrompt = "\nGenerate a very short, clear, and engaging title (max 4 words) that summarizes the main idea. Use title case. No punctuation.\n\nContent:\n".concat(userPrompt, " your response :").concat(responseText, "\n");
          _context.next = 11;
          return model.generateContent(titlePrompt);
        case 11:
          titleResult = _context.sent;
          _context.next = 14;
          return titleResult.response.text();
        case 14:
          title = _context.sent;
          console.log("23-word Title:", title);
          return _context.abrupt("return", [responseText, title]);
        case 17:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return _generateText.apply(this, arguments);
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!*********************************!*\
  !*** ./resources/js/chatbot.js ***!
  \*********************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _gemini_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./gemini.js */ "./resources/js/gemini.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }

if (!localStorage.getItem('visitor_id')) {
  localStorage.setItem('visitor_id', crypto.randomUUID());
}
localStorage.setItem('admin_control', 'false');
var hamIcon = document.getElementById('ham-icon');
var visitor_id = localStorage.getItem('visitor_id');
var pusher = new Pusher("57d1bf302023911c127a", {
  cluster: "ap2",
  encrypted: true
});
var channel = pusher.subscribe('chatbot.' + visitor_id);
console.log('channel', channel);
var channel2 = pusher.subscribe('chat.' + visitor_id);
var chatbotController = localStorage.getItem('admin_control') === 'true';
console.log('chatbotController', chatbotController);
channel2.bind('take.control', function (data) {
  console.log('take control', data);
  chatbotController = data.admin_control;
  localStorage.setItem('admin_control', data.admin_control.toString());

  // Update chatbot name and logo when admin takes control
  var container = document.querySelector('.chatbot-container');
  var titleElement = container.querySelector('.chatbot-title');
  var avatar = container.querySelector('.chatbot-avatar');
  var bubbleIcon = avatar.querySelector('.chat-bubble-icon');
  var botImg = avatar.querySelector('.bot-avatar-img');
  if (data.admin_control) {
    // Change title to show admin name if available
    var adminName = data.admin_name || 'Support Team';
    titleElement.innerHTML = "\n            <div class=\"chatbot-avatar\">\n                <span class=\"chat-bubble-icon\">\n                    <svg width=\"38\" height=\"38\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                        <path d=\"M12 2C6.477 2 2 6.477 2 12c0 1.511.38 2.955 1.037 4.207L2 22l5.793-1.037C9.045 21.62 10.489 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z\" fill=\"#fff\" stroke=\"#4F46E5\" stroke-width=\"1\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n                    </svg>\n                </span>\n                <img src=\"https://cdn-icons-gif.flaticon.com/17576/17576964.gif\" alt=\"Support Team\" class=\"bot-avatar-img\" style=\"display:none;\" />\n            </div>\n            <span class=\"chatbot-status\"></span>\n            ".concat(adminName, "\n        ");

    // Add notification message when admin takes control
    var messagesContainer = document.querySelector('.chatbot-messages');
    var messageElement = document.createElement('div');
    messageElement.className = 'chatbot-message bot-message';
    messageElement.innerHTML = "\n            <div class=\"bot-avatar\">\n                <img src=\"https://cdn-icons-gif.flaticon.com/17576/17576964.gif\" alt=\"Support Team\" />\n            </div>\n            <div class=\"message-content\">\n                <span class=\"typing-text\">You are now connected with our contact team support. How can we assist you?</span>\n                <div class=\"warning-message\" style=\"color: #ff4444; font-size: 0.7em; margin-top: 8px;\">\n                    \u26A0\uFE0F Please do not reload the page while talking to our team to maintain the connection.\n                </div>\n            </div>\n        ";
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  } else {
    // Remove existing typing indicator if any
    var existingTypingIndicator = document.querySelector('.typing-indicator');
    if (existingTypingIndicator) {
      existingTypingIndicator.remove();
    }
    // Reset to default Harmony bot
    titleElement.innerHTML = "\n            <div class=\"chatbot-avatar\">\n                <span class=\"chat-bubble-icon\">\n                    <svg width=\"38\" height=\"38\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                        <path d=\"M12 2C6.477 2 2 6.477 2 12c0 1.511.38 2.955 1.037 4.207L2 22l5.793-1.037C9.045 21.62 10.489 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z\" fill=\"#fff\" stroke=\"#4F46E5\" stroke-width=\"1\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n                    </svg>\n                </span>\n                <img src=\"/images/bot-avatar.svg\" alt=\"Harmony Bot\" class=\"bot-avatar-img\" style=\"display:none;\" />\n            </div>\n            <span class=\"chatbot-status\"></span>\n            Harmony\n        ";

    // Add notification message when control is released back to AI
    var _messagesContainer = document.querySelector('.chatbot-messages');
    var _messageElement = document.createElement('div');
    _messageElement.className = 'chatbot-message bot-message';
    _messageElement.innerHTML = "\n            <div class=\"bot-avatar\">\n                <img src=\"/images/bot-avatar.svg\" alt=\"Harmony Bot\" />\n            </div>\n            <div class=\"message-content\">\n                <span class=\"typing-text\">I'm back! How can I help you continue our conversation? \uD83E\uDD16</span>\n            </div>\n        ";
    _messagesContainer.appendChild(_messageElement);
    _messagesContainer.scrollTop = _messagesContainer.scrollHeight;
  }
});
var adminMessageChannel = pusher.subscribe('admin-chat.' + visitor_id);
var Chatbot = /*#__PURE__*/function () {
  function Chatbot() {
    var _this = this;
    _classCallCheck(this, Chatbot);
    this.isOpen = false;
    this.messages = [];
    this.hasInitialized = false;
    this.isFirstClick = true;
    this.conversationHistory = [];
    this.profanityWords = ['fuck', 'shit', 'ass', 'bitch', 'damn', 'crap', 'piss', 'dick', 'cock', 'pussy', 'bastard', 'fucking', 'shitty', 'asshole', 'bitchy', 'damned'];
    this.hasAgreedToTerms = false;
    this.hasSelectedService = false;
    this.hasProvidedEmail = false;
    this.selectedService = null;
    this.userEmail = null;
    this.initializeChatbot();
    this.setupKeyboardDetection();

    // Bind to Pusher channel for real-time messages
    channel.bind('chatbot-message', function (data) {
      console.log('user message is broadcasted', data.message);
      console.log(data);
      // Only show AI messages from admin panel
      if (data.sender != 'user') {
        _this.addBotMessage(data.message);
      }
    });
    adminMessageChannel.bind('admin.message', function (data) {
      console.log('admin message', data);
      // Remove existing typing indicator if any
      var existingTypingIndicator = document.querySelector('.typing-indicator');
      if (existingTypingIndicator) {
        existingTypingIndicator.remove();
      }

      // Show typing indicator for admin message
      var messagesContainer = document.querySelector('.chatbot-messages');
      var typingIndicator = document.createElement('div');
      typingIndicator.className = 'chatbot-message bot-message typing-indicator';
      typingIndicator.innerHTML = "\n                <div class=\"bot-avatar\">\n                    <img src=\"https://cdn-icons-gif.flaticon.com/17576/17576964.gif\" alt=\"Support Team\" />\n                </div>\n                <div class=\"message-content\">\n                    <div class=\"typing-dots\">\n                        <span class=\"dot\"></span>\n                        <span class=\"dot\"></span>\n                        <span class=\"dot\"></span>\n                    </div>\n                </div>\n            ";
      messagesContainer.appendChild(typingIndicator);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      // Transform typing indicator into response
      typingIndicator.className = 'chatbot-message bot-message';
      var messageContent = typingIndicator.querySelector('.message-content');
      messageContent.innerHTML = "<span class=\"typing-text\"></span>";
      var typingText = messageContent.querySelector('.typing-text');

      // Type out the message
      var index = 0;
      var typeInterval = setInterval(function () {
        if (index < data.message.length) {
          typingText.textContent += data.message[index];
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
          index++;
        } else {
          clearInterval(typeInterval);
          // Store admin message in database
          _this.storeMessage(data.admin_name, data.message)["catch"](function (error) {
            console.error('Error storing admin message:', error);
            typingIndicator.classList.add('error-message');
          });
        }
      }, 30);

      // Store message in conversation history
      _this.conversationHistory.push({
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString()
      });
    });
  }
  return _createClass(Chatbot, [{
    key: "setupKeyboardDetection",
    value: function setupKeyboardDetection() {
      if (window.visualViewport) {
        var _container = document.querySelector('.chatbot-container');
        var body = document.body;
        window.visualViewport.addEventListener('resize', function () {
          if (window.visualViewport.height < window.innerHeight) {
            // Keyboard is visible
            _container.classList.add('keyboard-active');
            body.classList.add('no-scroll');
          } else {
            // Keyboard is hidden
            _container.classList.remove('keyboard-active');
            body.classList.remove('no-scroll');
          }
        });
      }
    }
  }, {
    key: "initializeChatbot",
    value: function initializeChatbot() {
      // Check if chatbot already exists
      if (document.querySelector('.chatbot-container')) {
        return;
      }

      // Create chatbot container
      this.createChatbotContainer();

      // Add event listeners
      this.addEventListeners();

      // Start minimized
      var container = document.querySelector('.chatbot-container');
      container.classList.add('chatbot-minimized');
    }
  }, {
    key: "createChatbotContainer",
    value: function createChatbotContainer() {
      var container = document.createElement('div');
      container.className = 'chatbot-container chatbot-minimized';
      container.innerHTML = "\n            <div class=\"chatbot-header\">\n                <div class=\"chatbot-title\">\n                    <div class=\"chatbot-avatar\">\n                        <span class=\"chat-bubble-icon\">\n                            <svg width=\"38\" height=\"38\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                                <path d=\"M12 2C6.477 2 2 6.477 2 12c0 1.511.38 2.955 1.037 4.207L2 22l5.793-1.037C9.045 21.62 10.489 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z\" fill=\"#fff\" stroke=\"#4F46E5\" stroke-width=\"1\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n                            </svg>\n                        </span>\n                        <img src=\"/images/bot-avatar.svg\" alt=\"Harmony Bot\" class=\"bot-avatar-img\" style=\"display:none;\" />\n                    </div>\n                    <span class=\"chatbot-status\"></span>\n                    Harmony\n                </div>\n                <button class=\"chatbot-minimize\">\u2212</button>\n            </div>\n            <div class=\"chatbot-messages\"></div>\n            <div class=\"chatbot-input-container hidden\">\n                <input type=\"text\" class=\"chatbot-input\" placeholder=\"Type your message...\">\n                <button class=\"chatbot-send\">\n                    <i class=\"fas fa-paper-plane\"></i>\n                </button>\n            </div>\n        ";
      document.body.appendChild(container);
    }
  }, {
    key: "addEventListeners",
    value: function () {
      var _addEventListeners = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
        var _this2 = this;
        var container, minimizeBtn, sendBtn, input, header;
        return _regeneratorRuntime().wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              container = document.querySelector('.chatbot-container');
              minimizeBtn = container.querySelector('.chatbot-minimize');
              sendBtn = container.querySelector('.chatbot-send');
              input = container.querySelector('.chatbot-input');
              header = container.querySelector('.chatbot-header'); // Toggle chatbot on header click when minimized
              header.addEventListener('click', /*#__PURE__*/function () {
                var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(e) {
                  return _regeneratorRuntime().wrap(function _callee$(_context) {
                    while (1) switch (_context.prev = _context.next) {
                      case 0:
                        console.log('the chatbot clicked');
                        if (!show) {
                          _context.next = 5;
                          break;
                        }
                        hamIcon.click();
                        _context.next = 5;
                        return new Promise(function (resolve) {
                          return setTimeout(resolve, 500);
                        });
                      case 5:
                        if (!(e.target === header || e.target === header.querySelector('.chatbot-title'))) {
                          _context.next = 16;
                          break;
                        }
                        if (!container.classList.contains('chatbot-minimized')) {
                          _context.next = 16;
                          break;
                        }
                        if (!_this2.isFirstClick) {
                          _context.next = 13;
                          break;
                        }
                        _this2.showMessageLogo();
                        _this2.isFirstClick = false;
                        console.log('the chatbot first clicked');
                        _context.next = 16;
                        break;
                      case 13:
                        _context.next = 15;
                        return _this2.getTheOldChat();
                      case 15:
                        _this2.toggleChatbot();
                      case 16:
                      case "end":
                        return _context.stop();
                    }
                  }, _callee);
                }));
                return function (_x) {
                  return _ref.apply(this, arguments);
                };
              }());
              minimizeBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                _this2.toggleChatbot();
              });
              sendBtn.addEventListener('click', function () {
                return _this2.handleUserInput();
              });
              input.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') _this2.handleUserInput();
              });

              // Prevent event bubbling for input and buttons
              input.addEventListener('click', function (e) {
                return e.stopPropagation();
              });
              sendBtn.addEventListener('click', function (e) {
                return e.stopPropagation();
              });
            case 11:
            case "end":
              return _context2.stop();
          }
        }, _callee2);
      }));
      function addEventListeners() {
        return _addEventListeners.apply(this, arguments);
      }
      return addEventListeners;
    }()
  }, {
    key: "getTheOldChat",
    value: function () {
      var _getTheOldChat = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
        var _this3 = this;
        var response, chatHistory, messagesContainer, tagElement, hasAgreed, hasSelectedService, hasProvidedEmail, selectedService, newTagElement;
        return _regeneratorRuntime().wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              _context3.prev = 0;
              _context3.next = 3;
              return fetch("/user-chats/".concat(visitor_id), {
                method: 'GET',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                }
              });
            case 3:
              response = _context3.sent;
              if (response.ok) {
                _context3.next = 6;
                break;
              }
              throw new Error('Failed to fetch chat history');
            case 6:
              _context3.next = 8;
              return response.json();
            case 8:
              chatHistory = _context3.sent;
              messagesContainer = document.querySelector('.chatbot-messages');
              messagesContainer.innerHTML = '';

              // Clear conversation history
              this.conversationHistory = [];
              if (chatHistory && chatHistory.length > 0) {
                // Add "Previous Messages" tag
                tagElement = document.createElement('div');
                tagElement.className = 'chatbot-message-tag';
                tagElement.innerHTML = 'Previous Messages';
                messagesContainer.appendChild(tagElement);

                // Track user's progress
                hasAgreed = false;
                hasSelectedService = false;
                hasProvidedEmail = false;
                selectedService = null; // Add each message to the UI and conversation history
                chatHistory.forEach(function (chat) {
                  var messageElement = document.createElement('div');
                  messageElement.className = "chatbot-message ".concat(chat.sender == 'user' ? 'user' : 'bot', "-message");
                  if (chat.sender === 'ai') {
                    messageElement.innerHTML = "\n                            <div class=\"bot-avatar\">\n                                <img src=\"/images/bot-avatar.svg\" alt=\"Harmony Bot\" />\n                            </div>\n                            <div class=\"message-content\">\n                                <span class=\"typing-text\">".concat(chat.message, "</span>\n                            </div>\n                        ");
                  } else if (chat.sender !== 'user') {
                    // For admin or support team messages
                    messageElement.innerHTML = "\n                            <div class=\"bot-avatar\">\n                                <img src=\"https://cdn-icons-gif.flaticon.com/17576/17576964.gif\" alt=\"Support Team\" />\n                            </div>\n                            <div class=\"message-content\">\n                                <span class=\"typing-text\">".concat(chat.message, "</span>\n                            </div>\n                        ");
                  } else {
                    messageElement.innerHTML = chat.message;
                    // Check user's progress from messages
                    if (chat.message.includes("I have read and agree to the terms and conditions")) {
                      hasAgreed = true;
                    } else if (chat.message.includes("I'm interested in")) {
                      hasSelectedService = true;
                      selectedService = chat.message.replace("I'm interested in ", "").trim();
                    } else if (chat.message.includes("My email is")) {
                      hasProvidedEmail = true;
                      _this3.userEmail = chat.message.replace("My email is ", "").trim();
                    }
                  }
                  messagesContainer.appendChild(messageElement);
                  messagesContainer.scrollTop = messagesContainer.scrollHeight;

                  // Add to conversation history
                  _this3.conversationHistory.push({
                    role: chat.sender === 'user' ? 'user' : 'assistant',
                    content: chat.message,
                    timestamp: new Date().toISOString()
                  });
                });

                // Add "New Messages" tag
                newTagElement = document.createElement('div');
                newTagElement.className = 'chatbot-message-tag';
                newTagElement.innerHTML = 'New Messages';
                messagesContainer.appendChild(newTagElement);

                // Set the progress flags
                this.hasAgreedToTerms = hasAgreed;
                console.log(hasAgreed);
                this.hasSelectedService = hasSelectedService;
                console.log(hasAgreed);
                this.hasProvidedEmail = hasProvidedEmail;
                console.log(hasAgreed);
                this.selectedService = selectedService;

                // Show appropriate next step based on progress
                if (!hasAgreed) {
                  this.showTermsNotice();
                } else if (!hasSelectedService) {
                  this.showServiceSelection();
                } else if (!hasProvidedEmail) {
                  this.showEmailInput();
                } else {
                  // Show continuation message for completed setup
                  setTimeout(function () {
                    var messageElement = document.createElement('div');
                    messageElement.className = 'chatbot-message bot-message';
                    if (chatbotController) {
                      messageElement.innerHTML = "\n                                <div class=\"bot-avatar\">\n                                    <img src=\"https://cdn-icons-gif.flaticon.com/17576/17576964.gif\" alt=\"Support Team\" />\n                                </div>\n                                <div class=\"message-content\">\n                                    <span class=\"typing-text\">You are now connected with our contact team support. How can we assist you?</span>\n                                    <div class=\"warning-message\" style=\"color: #ff4444; font-size: 0.7em; margin-top: 8px;\">\n                                        \u26A0\uFE0F Please do not reload the page while talking to our team to maintain the connection.\n                                    </div>\n                                </div>\n                            ";
                    } else {
                      messageElement.innerHTML = "\n                                <div class=\"bot-avatar\">\n                                    <img src=\"/images/bot-avatar.svg\" alt=\"Harmony Bot\" />\n                                </div>\n                                <div class=\"message-content\">\n                                    <span class=\"typing-text\">I remember our previous conversation. How can I help you continue?</span>\n                                </div>\n                            ";
                    }
                    messagesContainer.appendChild(messageElement);
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;

                    // Enable chat input for completed setup
                    document.querySelector('.chatbot-input-container').classList.remove('hidden');
                  }, 0);
                }
              } else {
                // Show terms notice for new users
                this.showTermsNotice();
              }
              _context3.next = 19;
              break;
            case 15:
              _context3.prev = 15;
              _context3.t0 = _context3["catch"](0);
              console.error('Error fetching chat history:', _context3.t0);
              // Show terms notice for new users
              this.showTermsNotice();
            case 19:
            case "end":
              return _context3.stop();
          }
        }, _callee3, this, [[0, 15]]);
      }));
      function getTheOldChat() {
        return _getTheOldChat.apply(this, arguments);
      }
      return getTheOldChat;
    }()
  }, {
    key: "toggleChatbot",
    value: function toggleChatbot() {
      var container = document.querySelector('.chatbot-container');
      this.isOpen = !this.isOpen;
      var avatar = container.querySelector('.chatbot-avatar');
      var bubbleIcon = avatar.querySelector('.chat-bubble-icon');
      var botImg = avatar.querySelector('.bot-avatar-img');
      if (!this.isOpen) {
        container.classList.add('chatbot-minimized');
        if (bubbleIcon) bubbleIcon.style.display = '';
        if (botImg) botImg.style.display = 'none';
      } else {
        container.classList.remove('chatbot-minimized');
        if (bubbleIcon) bubbleIcon.style.display = 'none';
        if (botImg) botImg.style.display = '';
        // Focus input when opening
        var input = container.querySelector('.chatbot-input');
        setTimeout(function () {
          return input.focus();
        }, 300);
        // Auto scroll to bottom when opening chatbox
        setTimeout(function () {
          var messagesContainer = document.querySelector('.chatbot-messages');
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
      }
    }
  }, {
    key: "showMessageLogo",
    value: function showMessageLogo() {
      var _this4 = this;
      var container = document.querySelector('.chatbot-container');
      var avatar = container.querySelector('.chatbot-avatar');

      // Add animation class
      avatar.classList.add('message-logo-animation');

      // After animation completes, expand the chatbot
      setTimeout(function () {
        avatar.classList.remove('message-logo-animation');
        _this4.toggleChatbot();
      }, 1000);
    }
  }, {
    key: "storeMessage",
    value: function () {
      var _storeMessage = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(sender, message) {
        var messageData, _document$querySelect, token, response;
        return _regeneratorRuntime().wrap(function _callee4$(_context4) {
          while (1) switch (_context4.prev = _context4.next) {
            case 0:
              messageData = {
                visitor_id: visitor_id,
                sender: sender,
                message: message
              };
              _context4.prev = 1;
              // Get CSRF token
              token = (_document$querySelect = document.querySelector('meta[name="csrf-token"]')) === null || _document$querySelect === void 0 ? void 0 : _document$querySelect.getAttribute('content');
              if (token) {
                _context4.next = 5;
                break;
              }
              throw new Error('CSRF token not found');
            case 5:
              console.log(messageData);
              _context4.next = 8;
              return fetch('/user-chats', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'X-CSRF-TOKEN': token
                },
                body: JSON.stringify(messageData)
              });
            case 8:
              response = _context4.sent;
              if (response.ok) {
                _context4.next = 11;
                break;
              }
              throw new Error("Server error: ".concat(response.status, " ").concat(response.statusText));
            case 11:
              _context4.next = 13;
              return response.json();
            case 13:
              return _context4.abrupt("return", _context4.sent);
            case 16:
              _context4.prev = 16;
              _context4.t0 = _context4["catch"](1);
              console.error('Error storing message:', _context4.t0);
              throw _context4.t0;
            case 20:
            case "end":
              return _context4.stop();
          }
        }, _callee4, null, [[1, 16]]);
      }));
      function storeMessage(_x2, _x3) {
        return _storeMessage.apply(this, arguments);
      }
      return storeMessage;
    }()
  }, {
    key: "addUserMessage",
    value: function addUserMessage(message) {
      var _this5 = this;
      var messagesContainer = document.querySelector('.chatbot-messages');
      // const messageElement = document.createElement('div');
      // messageElement.className = 'chatbot-message user-message';
      // messageElement.innerHTML = message;
      // messagesContainer.appendChild(messageElement);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      // Store user message in conversation history
      this.conversationHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      });

      // Store message in database
      return this.storeMessage('user', message).then(function () {
        // Only process response if message was stored successfully
        _this5.processUserMessage(message, 'user');
      })["catch"](function (error) {
        console.error('Error storing message:', error);
        // Find the last user message and add error state
        var userMessages = messagesContainer.querySelectorAll('.user-message');
        var lastUserMessage = userMessages[userMessages.length - 1];
        if (lastUserMessage) {
          lastUserMessage.classList.add('error-message');
          // Add error message after the failed message
          var errorElement = document.createElement('div');
          errorElement.className = 'chatbot-message bot-message';
          errorElement.innerHTML = "\n                        <div class=\"bot-avatar\">\n                            <img src=\"/images/bot-avatar.svg\" alt=\"Harmony Bot\" />\n                        </div>\n                        <div class=\"message-content\">\n                            <span class=\"typing-text\">Sorry, there was an error saving your message. Please try again.</span>\n                        </div>\n                    ";
          messagesContainer.appendChild(errorElement);
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      });
    }
  }, {
    key: "addBotMessage",
    value: function addBotMessage(message) {
      var messagesContainer = document.querySelector('.chatbot-messages');
      // c
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      // Store bot message in conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: message,
        timestamp: new Date().toISOString()
      });

      // Store message in database
      this.storeMessage('ai', message);
    }
  }, {
    key: "handleUserInput",
    value: function handleUserInput() {
      var _this6 = this;
      if (!this.hasAgreedToTerms || !this.hasSelectedService || !this.hasProvidedEmail) {
        console.log(this.hasAgreedToTerms);
        return;
      }
      var input = document.querySelector('.chatbot-input');
      var message = input.value.trim();
      if (message) {
        var _document$querySelect2;
        // Add user message instantly with sending animation
        var messagesContainer = document.querySelector('.chatbot-messages');
        var messageElement = document.createElement('div');
        messageElement.className = 'chatbot-message user-message sending-animation';
        messageElement.innerHTML = message;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Clear input immediately
        input.value = '';

        // First broadcast the message
        var token = (_document$querySelect2 = document.querySelector('meta[name="csrf-token"]')) === null || _document$querySelect2 === void 0 ? void 0 : _document$querySelect2.getAttribute('content');
        if (!token) {
          console.warn('CSRF token not found');
        }
        console.log('message is broadcasted', message);
        fetch("/user-chats/broadcast", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': token || ''
          },
          body: JSON.stringify({
            message: message,
            sender: 'user',
            visitor_id: visitor_id
          })
        }).then(function (response) {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        }).then(function (data) {
          console.log('data is broadcasted', data);
          // Remove sending animation after successful broadcast
          messageElement.classList.remove('sending-animation');
          // Add user message after successful broadcast
          _this6.addUserMessage(message);
        })["catch"](function (error) {
          console.error('Error:', error);
          // Remove sending animation and add error state
          messageElement.classList.remove('sending-animation');
          messageElement.classList.add('error-message');
          // Add error message after the failed message
          var errorElement = document.createElement('div');
          errorElement.className = 'chatbot-message bot-message';
          errorElement.innerHTML = "\n                        <div class=\"bot-avatar\">\n                            <img src=\"/images/bot-avatar.svg\" alt=\"Harmony Bot\" />\n                        </div>\n                        <div class=\"message-content\">\n                            <span class=\"typing-text\">Sorry, there was an error sending your message. Please try again.</span>\n                        </div>\n                    ";
          messagesContainer.appendChild(errorElement);
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
      }
    }
  }, {
    key: "processUserMessage",
    value: function processUserMessage(message, user) {
      var _this7 = this;
      // Show typing indicator
      var messagesContainer = document.querySelector('.chatbot-messages');
      var typingIndicator = document.createElement('div');
      typingIndicator.className = 'chatbot-message bot-message typing-indicator';
      typingIndicator.innerHTML = "\n            <div class=\"bot-avatar\">\n                <img src=\"/images/bot-avatar.svg\" alt=\"Harmony Bot\" />\n            </div>\n            <div class=\"message-content\">\n                <div class=\"typing-dots\">\n                    <span class=\"dot\"></span>\n                    <span class=\"dot\"></span>\n                    <span class=\"dot\"></span>\n                </div>\n            </div>\n        ";
      messagesContainer.appendChild(typingIndicator);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      if (chatbotController) {
        if (user != 'ai') {
          return;
        }
        if (message) {
          // Transform typing indicator into response
          typingIndicator.className = 'chatbot-message bot-message';
          var messageContent = typingIndicator.querySelector('.message-content');
          messageContent.innerHTML = "<span class=\"typing-text\"></span>";
          var typingText = messageContent.querySelector('.typing-text');

          // Type out the message
          var index = 0;
          var typeInterval = setInterval(function () {
            if (index < message.length) {
              typingText.textContent += message[index];
              messagesContainer.scrollTop = messagesContainer.scrollHeight;
              index++;
            } else {
              var _document$querySelect3;
              clearInterval(typeInterval);
              // Broadcast the AI response after typing is complete
              var token = (_document$querySelect3 = document.querySelector('meta[name="csrf-token"]')) === null || _document$querySelect3 === void 0 ? void 0 : _document$querySelect3.getAttribute('content');
              if (!token) {
                console.warn('CSRF token not found');
              }
              fetch("/user-chats/broadcast", {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'X-CSRF-TOKEN': token || ''
                },
                body: JSON.stringify({
                  message: message,
                  sender: 'ai',
                  visitor_id: visitor_id
                })
              }).then(function (response) {
                return response.json();
              }).then(function (data) {
                console.log('data is broadcasted', data);
              })["catch"](function (error) {
                console.error('Error:', error);
                typingIndicator.classList.add('error-message');
              });
            }
          }, 30);

          // Store bot message in conversation history
          this.conversationHistory.push({
            role: 'assistant',
            content: message,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        // Process the message and generate response
        this.generateResponse(message).then(function (response) {
          if (response) {
            var _document$querySelect4;
            // Transform typing indicator into response
            typingIndicator.className = 'chatbot-message bot-message';
            var _messageContent = typingIndicator.querySelector('.message-content');
            _messageContent.innerHTML = "<span class=\"typing-text\"></span>";
            var _typingText = _messageContent.querySelector('.typing-text');

            // Type out the message
            // Broadcast the AI response after typing is complete
            var token = (_document$querySelect4 = document.querySelector('meta[name="csrf-token"]')) === null || _document$querySelect4 === void 0 ? void 0 : _document$querySelect4.getAttribute('content');
            if (!token) {
              console.warn('CSRF token not found');
            }
            fetch("/user-chats/broadcast", {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': token || ''
              },
              body: JSON.stringify({
                message: response,
                sender: 'ai',
                visitor_id: visitor_id
              })
            }).then(function (response) {
              return response.json();
            }).then(function (data) {
              console.log('data is broadcasted', data);
            })["catch"](function (error) {
              console.error('Error:', error);
              typingIndicator.classList.add('error-message');
            });
            var _index = 0;
            var _typeInterval = setInterval(function () {
              if (_index < response.length) {
                _typingText.textContent += response[_index];
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                _index++;
              } else {
                clearInterval(_typeInterval);
              }
            }, 30);

            // Store bot message in conversation history
            _this7.conversationHistory.push({
              role: 'assistant',
              content: response,
              timestamp: new Date().toISOString()
            });
          }
        })["catch"](function (error) {
          console.error('Error generating response:', error);
          // Transform typing indicator into error message
          typingIndicator.className = 'chatbot-message bot-message';
          var messageContent = typingIndicator.querySelector('.message-content');
          messageContent.innerHTML = "<span class=\"typing-text\">I'm having trouble right now. Please try again or contact support.</span>";
          typingIndicator.classList.add('error-message');
        });
      }
    }
  }, {
    key: "generateResponse",
    value: function () {
      var _generateResponse = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(message) {
        var lowerMessage, profanityResponses, conversationContext, prompt, _yield$generateText, _yield$generateText2, response, title;
        return _regeneratorRuntime().wrap(function _callee5$(_context5) {
          while (1) switch (_context5.prev = _context5.next) {
            case 0:
              lowerMessage = message.toLowerCase(); // Check for profanity
              if (!this.profanityWords.some(function (word) {
                return lowerMessage.includes(word);
              })) {
                _context5.next = 4;
                break;
              }
              profanityResponses = ["I'd be happy to help you, but could you please rephrase your question without using inappropriate language? Let's keep our conversation professional and respectful.", "I'm here to assist you, and I'd appreciate if we could communicate in a professional manner. Could you please rephrase your question?", "I'm ready to help you with your inquiry. To ensure a productive conversation, could you please rephrase your question without using inappropriate language?"];
              return _context5.abrupt("return", profanityResponses[Math.floor(Math.random() * profanityResponses.length)]);
            case 4:
              _context5.prev = 4;
              // Format entire conversation history for the prompt
              conversationContext = this.conversationHistory.map(function (msg) {
                return "".concat(msg.role === 'user' ? 'User' : 'Assistant', ": ").concat(msg.content);
              }).join('\n');
              prompt = "\n            You are Harmony, a friendly and professional AI assistant for WebNodez, a technology company.\n            WebNodez provides web-development, app-development, UI/UX design, and e-commerce solutions.\n            WebNodez has 3 years of experience, 100+ clients, and a 98% success rate. WebNodez has blogs and portfolio on website. We have many projects on website.\n            After successful communication you can ask for email or number for contact. If user wants to contact, ask for email or number.\n            WebNodez is a software development company.\n\n            Complete conversation history:\n            ".concat(conversationContext, "\n\n            Response Guidelines:\n            1. Answer ONLY what the user specifically asks for\n            2. Keep responses short and to the point\n            3. Don't add extra information unless asked\n            4. For greetings (hello, hi, hey):\n               - Only say hello once at the start of conversation\n               - Don't repeat greetings in follow-up responses\n               - Just answer the question directly\n            5. For thank you: Just say you're welcome\n            6. For questions you can't answer: Simply say you can't help with that\n            7. Use natural, friendly language\n            8. Add an emoji only when appropriate (greetings, thank you)\n            9. Maximum 2-3 sentences per response\n            10. If the question is not about WebNodez, politely redirect to WebNodez services\n            11. If user shows interest in contact, ask for their email or number\n            12. Consider the conversation history for context-aware responses\n            13. Don't repeat information already mentioned in the conversation\n            14. If asked about your name, just say \"I'm Harmony\" without adding extra questions\n            15. If discussing a project, focus on the project details before asking for contact info\n\n            User's question: ").concat(message, "\n            ");
              _context5.next = 9;
              return (0,_gemini_js__WEBPACK_IMPORTED_MODULE_0__.generateText)(prompt);
            case 9:
              _yield$generateText = _context5.sent;
              _yield$generateText2 = _slicedToArray(_yield$generateText, 2);
              response = _yield$generateText2[0];
              title = _yield$generateText2[1];
              return _context5.abrupt("return", response);
            case 16:
              _context5.prev = 16;
              _context5.t0 = _context5["catch"](4);
              console.error('Error generating AI response:', _context5.t0);
              return _context5.abrupt("return", "I'm having trouble right now. Please try again or contact support.");
            case 20:
            case "end":
              return _context5.stop();
          }
        }, _callee5, this, [[4, 16]]);
      }));
      function generateResponse(_x4) {
        return _generateResponse.apply(this, arguments);
      }
      return generateResponse;
    }()
  }, {
    key: "showTermsNotice",
    value: function showTermsNotice() {
      var _this8 = this;
      var messagesContainer = document.querySelector('.chatbot-messages');
      var termsNotice = document.createElement('div');
      termsNotice.className = 'chatbot-terms-notice';
      termsNotice.innerHTML = "\n            <div class=\"terms-content\">\n                <p class=\"terms-text\">\n                    By continuing this chat, you agree that your conversation may be recorded and monitored for quality assurance purposes. \n                    <a href=\"/terms-conditions#chatbot\" class=\"terms-link\" target=\"_blank\">Read our Terms & Conditions</a>\n                </p>\n            </div>\n            <div class=\"terms-agreement\">\n                <div class=\"terms-agreement-text\">Do you agree to our terms and conditions?</div>\n                <div class=\"terms-agreement-buttons\">\n                    <button class=\"terms-agreement-btn terms-agree-btn\">\u2713 Agree</button>\n                    <button class=\"terms-agreement-btn terms-disagree-btn\">\u2715 Disagree</button>\n                </div>\n            </div>\n        ";
      messagesContainer.appendChild(termsNotice);

      // Add event listeners for agreement buttons
      var agreeBtn = termsNotice.querySelector('.terms-agree-btn');
      var disagreeBtn = termsNotice.querySelector('.terms-disagree-btn');
      agreeBtn.addEventListener('click', /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6() {
        var agreementMessage, userMessageElement, errorMessage;
        return _regeneratorRuntime().wrap(function _callee6$(_context6) {
          while (1) switch (_context6.prev = _context6.next) {
            case 0:
              _context6.prev = 0;
              // Store the agreement in database
              agreementMessage = "I have read and agree to the terms and conditions";
              _context6.next = 4;
              return _this8.storeMessage('user', agreementMessage);
            case 4:
              _this8.conversationHistory.push({
                role: 'user',
                content: agreementMessage,
                timestamp: new Date().toISOString()
              });

              // Add agreement as user message
              userMessageElement = document.createElement('div');
              userMessageElement.className = 'chatbot-message user-message';
              userMessageElement.innerHTML = agreementMessage;
              messagesContainer.appendChild(userMessageElement);
              _this8.hasAgreedToTerms = true;
              // Remove terms notice
              termsNotice.remove();
              // Show service selection
              _this8.showServiceSelection();
              _context6.next = 22;
              break;
            case 14:
              _context6.prev = 14;
              _context6.t0 = _context6["catch"](0);
              console.error('Error storing agreement:', _context6.t0);
              errorMessage = document.createElement('div');
              errorMessage.className = 'chatbot-message bot-message';
              errorMessage.innerHTML = "\n                    <div class=\"bot-avatar\">\n                        <img src=\"/images/bot-avatar.svg\" alt=\"Harmony Bot\" />\n                    </div>\n                    <div class=\"message-content\">\n                        <span class=\"typing-text\">Sorry, there was an error processing your agreement. Please try again.</span>\n                    </div>\n                ";
              messagesContainer.appendChild(errorMessage);
              messagesContainer.scrollTop = messagesContainer.scrollHeight;
            case 22:
            case "end":
              return _context6.stop();
          }
        }, _callee6, null, [[0, 14]]);
      })));
      disagreeBtn.addEventListener('click', function () {
        _this8.hasAgreedToTerms = false;
        var messageElement = document.createElement('div');
        messageElement.className = 'chatbot-message bot-message';
        messageElement.innerHTML = "\n                <div class=\"bot-avatar\">\n                    <img src=\"/images/bot-avatar.svg\" alt=\"Harmony Bot\" />\n                </div>\n                <div class=\"message-content\">\n                    <span class=\"typing-text\">I'm sorry, but you need to agree to our terms and conditions to use the chat service.</span>\n                </div>\n            ";
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      });
    }
  }, {
    key: "showWelcomeMessage",
    value: function showWelcomeMessage() {
      var messagesContainer = document.querySelector('.chatbot-messages');
      var messageElement = document.createElement('div');
      messageElement.className = 'chatbot-message bot-message';
      messageElement.innerHTML = "\n            <div class=\"bot-avatar\">\n                <img src=\"/images/bot-avatar.svg\" alt=\"Harmony Bot\" />\n            </div>\n            <div class=\"message-content\">\n                <span class=\"typing-text\">Hello! \uD83D\uDC4B I'm Harmony, your WebNodez assistant. How can I help you today?</span>\n            </div>\n        ";
      messagesContainer.appendChild(messageElement);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      this.hasInitialized = true;
    }
  }, {
    key: "showServiceSelection",
    value: function showServiceSelection() {
      var _this9 = this;
      var messagesContainer = document.querySelector('.chatbot-messages');
      var messageElement = document.createElement('div');
      messageElement.className = 'chatbot-message bot-message';
      messageElement.innerHTML = "\n            <div class=\"bot-avatar\">\n                <img src=\"/images/bot-avatar.svg\" alt=\"Harmony Bot\" />\n            </div>\n            <div class=\"message-content\">\n                <span class=\"typing-text\">What service are you interested in?</span>\n            </div>\n        ";
      messagesContainer.appendChild(messageElement);
      var serviceSelection = document.createElement('div');
      serviceSelection.className = 'service-selection';
      serviceSelection.innerHTML = "\n            <div class=\"service-option\" data-service=\"web-dev\">Web Development</div>\n            <div class=\"service-option\" data-service=\"app-dev\">App Development</div>\n            <div class=\"service-option\" data-service=\"ecommerce\">E-commerce</div>\n            <div class=\"service-option\" data-service=\"ui-ux\">UI/UX Design</div>\n        ";
      messagesContainer.appendChild(serviceSelection);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      // Add event listeners for service options
      var serviceOptions = serviceSelection.querySelectorAll('.service-option');
      serviceOptions.forEach(function (option) {
        option.addEventListener('click', function () {
          // Remove selected class from all options
          serviceOptions.forEach(function (opt) {
            return opt.classList.remove('selected');
          });
          // Add selected class to clicked option
          option.classList.add('selected');
          _this9.selectedService = option.dataset.service;
          _this9.hasSelectedService = true;

          // Store the service selection as a user message
          var serviceMessage = "I'm interested in ".concat(option.textContent);
          _this9.storeMessage('user', serviceMessage);
          _this9.conversationHistory.push({
            role: 'user',
            content: serviceMessage,
            timestamp: new Date().toISOString()
          });

          // Add user's selection as a message
          var userMessageElement = document.createElement('div');
          userMessageElement.className = 'chatbot-message user-message';
          userMessageElement.innerHTML = serviceMessage;
          messagesContainer.appendChild(userMessageElement);

          // Remove the service selection UI
          messageElement.remove();
          serviceSelection.remove();

          // Show email input after service selection
          setTimeout(function () {
            _this9.showEmailInput();
          }, 500);
        });
      });
    }
  }, {
    key: "showEmailInput",
    value: function showEmailInput() {
      var _this0 = this;
      var messagesContainer = document.querySelector('.chatbot-messages');
      var messageElement = document.createElement('div');
      messageElement.className = 'chatbot-message bot-message';
      messageElement.innerHTML = "\n            <div class=\"bot-avatar\">\n                <img src=\"/images/bot-avatar.svg\" alt=\"Harmony Bot\" />\n            </div>\n            <div class=\"message-content\">\n                <span class=\"typing-text\">Please provide your email address so we can get back to you.</span>\n            </div>\n        ";
      messagesContainer.appendChild(messageElement);
      var emailContainer = document.createElement('div');
      emailContainer.className = 'email-input-container';
      emailContainer.innerHTML = "\n            <input type=\"email\" class=\"email-input\" placeholder=\"Please enter your email address\">\n            <button class=\"email-submit-btn\">Submit Email</button>\n        ";
      messagesContainer.appendChild(emailContainer);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      var emailInput = emailContainer.querySelector('.email-input');
      var submitBtn = emailContainer.querySelector('.email-submit-btn');
      submitBtn.addEventListener('click', function () {
        var email = emailInput.value.trim();
        if (_this0.validateEmail(email)) {
          _this0.userEmail = email;
          _this0.hasProvidedEmail = true;

          // Store the email as a user message
          var emailMessage = "My email is ".concat(email);
          _this0.storeMessage('user', emailMessage);
          _this0.conversationHistory.push({
            role: 'user',
            content: emailMessage,
            timestamp: new Date().toISOString()
          });

          // Add email as user message
          var userMessageElement = document.createElement('div');
          userMessageElement.className = 'chatbot-message user-message';
          userMessageElement.innerHTML = emailMessage;
          messagesContainer.appendChild(userMessageElement);

          // Remove the email input UI
          messageElement.remove();
          emailContainer.remove();

          // Enable chat
          document.querySelector('.chatbot-input-container').classList.remove('hidden');

          // Show welcome message and confirmation
          _this0.showWelcomeMessage();
        } else {
          var errorMessage = document.createElement('div');
          errorMessage.className = 'chatbot-message bot-message';
          errorMessage.innerHTML = "\n                    <div class=\"bot-avatar\">\n                        <img src=\"/images/bot-avatar.svg\" alt=\"Harmony Bot\" />\n                    </div>\n                    <div class=\"message-content\">\n                        <span class=\"typing-text\">Please enter a valid email address.</span>\n                    </div>\n                ";
          messagesContainer.appendChild(errorMessage);
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      });
    }
  }, {
    key: "validateEmail",
    value: function validateEmail(email) {
      var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    }
  }]);
}(); // Initialize chatbot when the page loads
document.addEventListener('DOMContentLoaded', /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7() {
  return _regeneratorRuntime().wrap(function _callee7$(_context7) {
    while (1) switch (_context7.prev = _context7.next) {
      case 0:
        if (window.chatbotInstance) {
          _context7.next = 4;
          break;
        }
        window.chatbotInstance = new Chatbot();
        // Get old chat when user first visits
        _context7.next = 4;
        return window.chatbotInstance.getTheOldChat();
      case 4:
      case "end":
        return _context7.stop();
    }
  }, _callee7);
})));
var container = document.querySelector('.chatbot-container');
hamIcon.addEventListener('click', function () {
  if (!container.classList.contains('chatbot-minimized')) {
    if (window.chatbotInstance) {
      window.chatbotInstance.toggleChatbot();
    }
  }
});
})();

/******/ })()
;