import { DataTypes, Model } from "sequelize";
import newSequelize from "../infra/sequelize";

export interface SchoolInterface {
    id?: number;
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
}

class School extends Model<SchoolInterface> implements SchoolInterface {
    public id?: number;
    public name!: string;
    public readonly createdAt?: Date;
    public readonly updatedAt?: Date;
}

School.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(150),
            allowNull: false,
        },
    },
    {
        sequelize: newSequelize(),
        tableName: "schools",
        modelName: "school",
        timestamps: true,
    }
);

export default School;
