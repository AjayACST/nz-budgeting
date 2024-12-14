import {defineCronHandler} from "#nuxt/cron";
import { akahu } from "../akahu";
import {Account, Connection, Cursor, EnrichedTransaction, Transaction} from "akahu";
import {getConnection} from "~/server/database";
import { DateTime } from "luxon";
import {queryApi, writeApi} from "~/server/influx";
import {Point} from "@influxdata/influxdb-client";
import nzfcc from "~/server/api/v1/nzfcc";

export default defineCronHandler('daily', async () => {
//     get DB connection
    const connection = await getConnection();
//     Load in user accounts
    const accounts: Account[] = await akahu.accounts.list(process.env.AKAHU_USER_TOKEN!)
//
    for (const account of accounts) {
        // Create bank just in case it does not exist
        const account_connection: Connection = account.connection
        await connection.query('INSERT INTO banks VALUES(?, ?, ?) ON DUPLICATE KEY UPDATE id = id', [account_connection._id, account_connection.name, account_connection.logo])

        // Create user accounts if it does not exist
        const lastRefresh = DateTime.fromISO(account.refreshed?.balance || '', {zone: 'UTC'}).toFormat('yyyy-LL-dd HH:mm:ss')
        const account_data = [account._id, account.name, account.formatted_account, account.balance?.current, account.balance?.available, account.balance?.available, process.env.KINDE_USER_TOKEN, account.connection._id, lastRefresh, lastRefresh, account.balance?.available]
        const accountBal = await connection.query('INSERT INTO accounts VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE last_refresh = ?, balance_reconcile = ? RETURNING balance_available', account_data)

        // Query last 24 hours of transactions for this account
        // Meant to be run after midnight so minus a day
        const day = DateTime.now().setZone('Pacific/Auckland').minus({day: 1})
        const startDay = day.set({hour: 0, minute: 0, second: 0, millisecond: 0}).setZone("UTC").toISO({suppressMilliseconds: true})
        const endDay = day.set({hour:23, minute: 59, second: 59, millisecond: 0}).setZone("UTC").toISO({suppressMilliseconds: true})

        const allTransactions: Transaction[] = [];
        let cursor: Cursor;

        do {
            const {items, cursor: { next }} = await akahu.accounts.listTransactions(process.env.AKAHU_USER_TOKEN!, account._id, {
                start: startDay || undefined,
                end: endDay || undefined,
                cursor: cursor
            })
            cursor = next
            allTransactions.push(...items)
        } while (cursor !== null)

        // Check if we balance already reflects transactions
        let doBalUpdate: boolean = true
        let accountBalance: number = Number(accountBal[0].balance_available)
        if (accountBalance == account.balance?.available) {
            // If this is true the transactions have already been created, or this is the first run
            doBalUpdate = false
        }

        for (let transaction of allTransactions) {
            // Create merchant if needed
            if (transaction.merchant) {
                const insertData = [transaction.merchant._id, transaction.merchant.name, transaction.merchant.website, transaction.meta.logo || null]
                await connection.query('INSERT INTO merchants VALUES(?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = id', insertData)
            }
            // Check if we need to put straight into transactions record
            if (transaction.type == "CREDIT" || transaction.type == "TRANSFER" || transaction.type == "DIRECT CREDIT" || transaction.type == "ATM") {
                // all of these can skip reconciling
                // Create new transaction
                const sql = "INSERT INTO transactions (id, account, date, description, amount, type, caused_update) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = id"
                const transDate = DateTime.fromISO(transaction.date || '', {zone: 'UTC'}).toFormat('yyyy-LL-dd HH:mm:ss')
                const insertData = [transaction._id, transaction._account, transDate, transaction.description, transaction.amount, transaction.type, doBalUpdate]
                await connection.query(sql, insertData)

                if (doBalUpdate) {
                    accountBalance += Number(transaction.amount)
                    // update balance and update influxDB
                    const sqlBal = "UPDATE accounts SET balance_available = ? WHERE id = ?"
                    await connection.query(sqlBal, [accountBalance, transaction._account])

                    // Update influx
                    let point = new Point('accounts')
                        .tag('trans-id', transaction._id)
                        .tag('account-id', transaction._account)
                        .timestamp(DateTime.fromISO(transaction.date, {zone: 'UTC'}).toMillis()*1000000)
                        .floatField('balance', accountBalance)

                    writeApi.writePoint(point)
                }
            } else {
                // Else we add to the reconciliation table
                // Find suggested budget
                let suggestBudget: string | null = null;
                let nzfccID: string | null = null;
                if (transaction.category) {
                    const budgetSQL = "SELECT budget_id FROM budgets_nzfcc WHERE nzfcc_id = ?"
                    const budget = await connection.query(budgetSQL, [transaction.category._id])
                    if (budget.length > 0) suggestBudget = budget[0].budget_id
                    nzfccID = transaction.category._id
                }
                // Insert into reconcile DB
                const insertSQL = "INSERT INTO reconciliation (id, account, date, description, amount, type, budget_id, nzfcc_id, merchant_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = id"
                const transDate = DateTime.fromISO(transaction.date || '', {zone: 'UTC'}).toFormat('yyyy-LL-dd HH:mm:ss')
                const insertData = [transaction._id, transaction._account, transDate, transaction.description, transaction.amount, transaction.type,  suggestBudget, nzfccID, transaction.merchant._id]
                await connection.query(insertSQL, insertData)
            }
        }
    }
    await writeApi.flush()
    await connection.release()
})