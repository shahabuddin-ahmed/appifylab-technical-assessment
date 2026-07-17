import { DataTypes, Model } from "sequelize";
import newSequelize from "../infra/sequelize";

export interface StudentInterface {
    id?: number;
    schoolId: number;
    name: string;
    email: string;
    createdAt?: Date;
    updatedAt?: Date;
}

class Student extends Model<StudentInterface> implements StudentInterface {
    public id?: number;
    public schoolId!: number;
    public name!: string;
    public email!: string;
    public readonly createdAt?: Date;
    public readonly updatedAt?: Date;
}

Student.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        schoolId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: "school_id",
        },
        name: {
            type: DataTypes.STRING(150),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING(191),
            allowNull: false,
            unique: "uniq_school_email",
        },
    },
    {
        sequelize: newSequelize(),
        tableName: "students",
        modelName: "student",
        timestamps: true,
        indexes: [
            {
                unique: true,
                name: "uniq_school_email",
                fields: ["school_id", "email"],
            },
        ],
    }
);

export default Student;
