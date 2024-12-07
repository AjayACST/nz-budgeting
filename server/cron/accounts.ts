import {defineCronHandler} from "#nuxt/cron";
import { akahu } from "../akahu";
import {Account, Connection} from "akahu";
import {getConnection} from "~/server/database";

export default defineCronHandler('daily', async () => {
//     get DB connection
    const connection = await getConnection();

// //     Load in user accounts
    const accounts: Account[] = await akahu.accounts.list(process.env.AKAHU_USER_TOKEN)
//
    for (const account of accounts) {
        // Create bank just in case it does not exist
        const account_connection: Connection = account.connection
        await connection.query('INSERT INTO banks VALUES(?, ?, ?) ON DUPLICATE KEY UPDATE id = id', [account_connection._id, account_connection.name, account_connection.logo])

        // Create user accounts if it does not exist
        const account_data = [account._id, account.name, account.formatted_account, account.balance?.current, account.balance?.available, process.env.KINDE_USER_TOKEN, account.connection._id]
        await connection.query('INSERT INTO accounts VALUES(?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = id', account_data)
    }
    await connection.release()
})