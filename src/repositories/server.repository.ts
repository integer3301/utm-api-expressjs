import { SQLiteDB } from "../database/conection.database";

export class ServerRepository { 
    async findAll (): Promise<ServerModels[]> {
        const rows = SQLiteDB.query("SELECT * FROM servers");
        return rows.map(row => new ServerModels(row));
    }
}