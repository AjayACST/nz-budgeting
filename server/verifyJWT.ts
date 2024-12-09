import jwt from "jsonwebtoken"
import Dict = NodeJS.Dict;
import JwksClient from "jwks-rsa";

const jwks_client = JwksClient({jwksUri: process.env.NUXT_KINDE_JWKS || ""})

function getKey(header, callback: Function) {
    jwks_client.getSigningKey(header.kid, function(err, key) {
        let signingKey = key?.publicKey || key?.rsaPublicKey
        callback(null, signingKey)
    })
}

// @ts-ignore
export default async (token): Promise<Dict<any>> => {
    if (!token) return {}

    return new Promise((resolve, reject) =>
        // @ts-ignore
        jwt.verify(token, getKey,(error, decoded) => error ? reject({}) : resolve(decoded))
    )
}