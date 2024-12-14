import auth from "~/server/auth";
import {getConnection} from "~/server/database";
import {CreateBudget} from "~/types/budgets.types";
import {DateTime} from "luxon";
import {BaseAPI} from "~/types/api.types";

export default defineEventHandler(async (event): Promise<BaseAPI> => {
    const user = await auth(event)
    const connection= await getConnection()
    const body: CreateBudget = await readBody(event)
    console.log(body)

    const start_date: string = DateTime.fromISO(body.start_date, {zone: 'UTC'}).toFormat('yyyy-LL-dd HH:mm:ss')

    const insertData = [body.name, body.description, body.amount, user.sub, start_date, body.refresh_every]
    const sqlInsert: string = 'INSERT INTO budgets (name, description, amount, spent, user_id, start_date, last_refresh, refresh_every) VALUES (?, ?, ?, 0, ?, ?, CURRENT_DATE, ?) RETURNING id'
    const budgetID = await connection.query(sqlInsert, insertData)

    for (const groupId of body.budgetIDs) {
        const sqlInsert: string = 'INSERT INTO budgets_nzfcc (budget_id, nzfcc_id) VALUES (?, ?)'
        const insertData = [budgetID[0].id, groupId]
        await connection.query(sqlInsert, insertData)
    }
    await connection.release()
    return {
        status: "ok"
    }
})