import jwt from "jsonwebtoken";
import config from "../configs/config.js";

function authMiddleware(req, res, next) {
    const authorization = req.headers.authorization;
    const [scheme, token] = authorization?.trim().split(/\s+/) ?? [];

    if (scheme?.toLowerCase() !== "bearer" || !token) {
        return res.status(401).json({
            message: "A Bearer access token is required.",
        });
    }

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);

        if (
            typeof decoded !== "object" ||
            decoded.tokenType !== "access" ||
            !decoded.id
        ) {
            return res.status(401).json({
                message: "The access token is invalid.",
            });
        }

        req.user = decoded;
        return next();
    } catch (error) {
        if (
            error instanceof jwt.JsonWebTokenError ||
            error instanceof jwt.TokenExpiredError
        ) {
            return res.status(401).json({
                message: "The access token is invalid or expired.",
            });
        }

        return next(error);
    }
}

export { authMiddleware };
export default authMiddleware;