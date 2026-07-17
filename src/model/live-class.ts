import { DataTypes, Model } from "sequelize";
import newSequelize from "../infra/sequelize";

export interface LiveClassInterface {
    id?: number;
    schoolId: number;
    title: string;
    startTime: Date;
    durationMinutes: number;
    maxSeats: number;
    price: number;
    enrolledCount?: number;
    waitlistCount?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

class LiveClass extends Model<LiveClassInterface> implements LiveClassInterface {
    public id?: number;
    public schoolId!: number;
    public title!: string;
    public startTime!: Date;
    public durationMinutes!: number;
    public maxSeats!: number;
    public price!: number;
    public enrolledCount!: number;
    public waitlistCount!: number;
    public readonly createdAt?: Date;
    public readonly updatedAt?: Date;
}

LiveClass.init(
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
        title: {
            type: DataTypes.STRING(191),
            allowNull: false,
        },
        startTime: {
            type: DataTypes.DATE,
            allowNull: false,
            field: "start_time",
        },
        durationMinutes: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: "duration_minutes",
        },
        maxSeats: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: "max_seats",
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        enrolledCount: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
            field: "enrolled_count",
        },
        waitlistCount: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
            field: "waitlist_count",
        },
    },
    {
        sequelize: newSequelize(),
        tableName: "live_classes",
        modelName: "liveClass",
        timestamps: true,
        indexes: [
            { name: "idx_live_classes_school_start_time", fields: ["school_id", "start_time"] },
            {
                unique: true,
                name: "uniq_live_classes_school_title_start_time",
                fields: ["school_id", "title", "start_time"],
            },
        ],
    }
);

export default LiveClass;
