import { Request, Response } from "express";
import * as math from "mathjs";
import { Readable } from "stream";

import { RandomNumberRequestBody } from "../../types/index.js";

export function randomNumber(req: Request<{}, {}, RandomNumberRequestBody>, res: Response) {
    const { type, max } = req.body;
    const min = req.body.min || 0;
    const amount = req.body.amount || 1;

    if (!type) {
        res.status(400).json({ error: "A type to random is required" });
        return;
    }
    else if (!max) {
        res.status(400).json({ error: "Max value is required" });
        return;
    }
    
    if (min >= max) {
        res.status(400).json({ error: "The 'min' value must not greater or equal the 'max' value" });
        return;
    }
    
    if (amount > 10**10) {
        res.status(400).json({ error: "Amount exceeds the maximum allowed limit of 10^10" });
        return;
    }
    if (max >= Number.MAX_SAFE_INTEGER) {
        res.status(400).json({ error: "The 'max' value must not larger than `MAX_SAFE_INTEGER`"});
        return;
    }
    if (min <= Number.MIN_SAFE_INTEGER) {
        res.status(400).json({ error: "The 'min' value must not smaller than `MIN_SAFE_INTEGER`"});
        return;
    }

    if (type !== "decimal" && type !== "integer") {
        res.status(400).json({ error: "Invalid type. Allowed values are 'decimal' and 'integer'" });
        return;
    }

    res.on("close", () => {
        stream.destroy();
    });

    let index = 0;
    const stream = new Readable({
        read() {
            if (index === 0) {
                this.push("{\"result\":[");
            }

            while (index < amount) {
                const isLast = index === amount - 1;
                const value =
                type === "integer"
                    ? math.randomInt(min, max)
                    : math.random(min, max);
                const chunk = JSON.stringify(value) + (isLast ? "" : ",");

                index++;

                const ok = this.push(chunk);
                if (!ok) return; // pause if buffer full
            }

            // End JSON array and object
            if (index >= amount) {
                this.push("]}");
                this.push(null); // signal end
            }
        },
    });

    stream.pipe(res);
}

// Im using ChatGPT to help me generate the code to send data thourgh stream.pipe(), please dont bully me