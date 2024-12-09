import {H3Event} from "h3";
import verifyJWT from "~/server/verifyJWT";
import Dict = NodeJS.Dict;



export default async (event: H3Event): Promise<Dict<any>> => {
    const header = event.headers.get("authorization")

    if (header) {
        const token = header.split(' ')[1]
        const jwt = await verifyJWT(token).catch(err => {
            throw createError({
                status: 401,
                message: 'Unauthorized'
            })
        })
        console.log(Object.values(jwt.aud).includes(process.env.NUXT_KINDE_API_AUD))
        if (Object.values(jwt.aud).includes(process.env.NUXT_KINDE_API_AUD)) {
            return jwt
        } else {
            throw createError({
                status: 401,
                message: 'Unauthorized'
            })
        }
    } else {
        throw createError({
            status: 401,
            message: 'Unauthorized'
        })
    }
}