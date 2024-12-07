import {defineCronHandler} from "#nuxt/cron";
import { akahu } from "../akahu";
import {Account, Connection, Cursor, EnrichedTransaction, Transaction} from "akahu";
import {getConnection} from "~/server/database";
import { DateTime } from "luxon";

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

        // Query last 24 hours of transactions for this account
        // Meant to be run after midnight so minus a day
        const day = DateTime.now().setZone('Pacific/Auckland').minus({day: 1})
        const startDay = day.set({hour: 0, minute: 0, second: 0, millisecond: 0}).setZone("UTC").toISO({suppressMilliseconds: true})
        const endDay = day.set({hour:23, minute: 59, second: 59, millisecond: 0}).setZone("UTC").toISO({suppressMilliseconds: true})

        const allTransactions: Transaction[] = [];
        let cursor: Cursor;

        do {
            const {items, cursor: { next }} = await akahu.accounts.listTransactions(process.env.AKAHU_USER_TOKEN, account._id, {
                start: startDay,
                end: endDay,
                cursor: cursor
            })
            cursor = next
            allTransactions.push(...items)
        } while (cursor !== null)

        for (const transaction of allTransactions) {
            // Create merchant if needed
            if (transaction.merchant) {
                const insertData = [transaction.merchant._id, transaction.merchant.name, transaction.merchant.website, transaction.meta.logo || null]
                await connection.query('INSERT INTO merchants VALUES(?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = id', insertData)
            }
        }
    }



    // Query transactions
    await connection.release()
})