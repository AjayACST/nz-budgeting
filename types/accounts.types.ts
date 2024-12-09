import type {DateTime} from "luxon";

export interface AccountsTypes {
    account_id: String,
    account_name: String,
    user_id: String,
    formatted_account: String,
    balance_current: Number,
    balance_available: Number,
    last_refresh: DateTime,
    bank_name: String,
    logo: String
}

export interface ApiGetAccounts {
    status: String,
    data: AccountsTypes[]
}