import {H3Event} from "h3";
import auth from "~/server/auth";
import {getConnection} from "~/server/database";
import {AccountsTypes} from "~/types/accounts.types";
import {BaseAPIArray} from "~/types/api.types";

export default defineEventHandler(async (event: H3Event): Promise<BaseAPIArray<AccountsTypes>> => {
    const user = await auth(event)
    const connection = await getConnection();
    console.log(user)
    const sql = 'SELECT ' +
            'a.id as account_id,' +
            'a.name as account_name,' +
            'a.user_id,' +
            'a.formatted_account,' +
            'a.balance_current,' +
            'a.balance_available,' +
            'a.last_refresh,' +
            'b.name as bank_name,' +
            'b.logo' +
        ' FROM ' +
            'accounts a' +
        ' RIGHT JOIN ' +
            'banks b' +
        ' ON ' +
            'a.bank_connection = b.id' +
        ' WHERE ' +
            'a.user_id = ?';

    const data: AccountsTypes[] = await connection.query(sql, [user.sub])
    await connection.release()
    return {
        status: "ok",
        data: data
    }
})