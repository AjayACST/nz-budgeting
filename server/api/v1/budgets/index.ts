import auth from "~/server/auth";
import {getConnection} from "~/server/database";
import {BudgetList} from "~/types/budgets.types";
import {BaseAPIArray} from "~/types/api.types";

export default defineEventHandler(async (event): Promise<BaseAPIArray<BudgetList>> => {
    const user = await auth(event)
    const connection = await getConnection()

    const result: BudgetList[] = await connection.query("SELECT * FROM budgets WHERE user_id='kp_8a9260d8f62a4bd9b04ec293e47735e5'")
    await connection.release()

    return {
        status: "ok",
        data: result
    }
})