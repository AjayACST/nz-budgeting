import {H3Event} from "h3";
import {getConnection} from "~/server/database";
import auth from "~/server/auth";
import {PoolConnection} from "mariadb";
import {NZFCCDBRes, NZFCCGroup, NZFCCServices} from "~/types/nzfcc.types";
import {BaseAPIArray} from "~/types/api.types";

export default defineEventHandler(async (event: H3Event): Promise<BaseAPIArray<NZFCCGroup>> => {
    await auth(event)
    const connection: PoolConnection = await getConnection()

    const data: NZFCCDBRes[] = await connection.query("SELECT * FROM nzfcc_groups")

    const groupedServices = data.reduce((acc: Record<string, NZFCCGroup>, item) => {
        const { group, id, service_name } = item;

        if (!acc[group]) {
            acc[group] = {groupName: group, groupServices: []}
        }

        acc[group].groupServices.push({id, name: service_name})
        return acc
    }, {})

    const result: NZFCCGroup[] = Object.values(groupedServices)

    return {
        status: 'ok',
        data: result
    }
})