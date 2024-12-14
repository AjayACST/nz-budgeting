import {InfluxDB, QueryApi, WriteApi} from "@influxdata/influxdb-client";

const influxDB = new InfluxDB({url: process.env.INFLUX_URL!, token: process.env.INFLUX_TOKEN!})

export const queryApi: QueryApi = influxDB.getQueryApi(process.env.INFLUX_ORG!)
export const writeApi: WriteApi = influxDB.getWriteApi(process.env.INFLUX_ORG!, process.env.INFLUX_BUCKET!)