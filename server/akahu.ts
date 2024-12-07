import { AkahuClient } from "akahu";

export const akahu = new AkahuClient({ appToken: process.env.AKAHU_APP_TOKEN });
