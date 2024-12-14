import type {DateTime} from "luxon";

export interface BudgetList {
    id: string
    name: string
    description: string | null
    amount: number
    spent: number
    start_date: string
    last_refresh: string
    refresh_every: RefreshCycle
}

export interface CreateBudget {
    name: string
    description: string | null
    amount: number
    start_date: string
    refresh_every: RefreshCycle
    budgetIDs: string[]
}

export type RefreshCycle = 'week' | 'fortnight' | 'month' | 'quarter' | 'year'