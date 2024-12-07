import {H3Event} from "h3";

export default defineEventHandler(async (event: H3Event) => {
    const kinde = event.context.kinde;
    console.log(kinde.getToken())
})