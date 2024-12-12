import type {DateTime} from "luxon";

export interface AccountsTypes {
    account_id: string,
    account_name: string,
    user_id: string,
    formatted_account: string,
    balance_current: number,
    balance_available: number,
    last_refresh: DateTime,
    bank_name: string,
    logo: string
}
