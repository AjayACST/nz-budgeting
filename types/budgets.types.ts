import type {DateTime} from "luxon";

export interface CreateBudget {
    name: string
    description: string | null
    amount: number
    start_date: string
    refresh_every: RefreshCycle
    budgetIDs: string[]
}

export type RefreshCycle = 'week' | 'fortnight' | 'month' | 'quarter' | 'year'