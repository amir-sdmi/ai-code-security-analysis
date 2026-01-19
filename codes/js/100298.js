import jwt from 'jsonwebtoken';

const authSeller = async (req, res, next) => {
    const { sellerToken } = req.cookies;

    if (!sellerToken) {
        return res.json({ success: false, message: 'Not Authorized' });
    }
    // try {
    //         // const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    //          const tokenDecode = jwt.verify(sellerToken, process.env.JWT_SECRET);
    //         if (tokenDecode.email === process.env.SELLER_EMAIL) {
    //             req.user = tokenDecode; //suggested by chatgpt
    //             return next();
    //         } else {
    //             return res.json({ success: false, message: 'Not Authorized' });  // fixed typo here
    //         }
    //         // next();
    //     } catch (error) {
    //         res.json({ success: false, message: error.message });
    //     }
    try {
        const tokenDecode = jwt.verify(sellerToken, process.env.JWT_SECRET);
        if (tokenDecode.email === process.env.SELLER_EMAIL) {
            req.user = tokenDecode;  // <<< ADD THIS LINE
            next();  // <<< REMOVE the duplicate next() after the if-else
        } else {
            return res.json({ success: false, message: 'Not Authorized' });
        }
    } catch (error) {
        res.json({ success: false, message: error.message });
    }

}

export default authSeller;