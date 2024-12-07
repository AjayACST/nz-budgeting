import mariadb from "mariadb";

let pool: mariadb.Pool;

export async function createPool() {
    if (!pool) {
        pool = mariadb.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            connectionLimit: 30, // Adjust the limit as needed
        });
    }

    return pool;
}

export async function getConnection() {
    const connectionPool = await createPool();
    return connectionPool.getConnection();
}