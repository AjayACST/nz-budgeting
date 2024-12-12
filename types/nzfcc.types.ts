export interface NZFCCDBRes {
    id: string,
    service_name: string,
    group: string
}

export interface NZFCCServices {
    id: string,
    name: string
}

export interface NZFCCGroup {
    groupName: string,
    groupServices: NZFCCServices[]
}
