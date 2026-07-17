import School, { SchoolInterface } from "../model/school";

export interface SchoolRepoInterface {
    create(school: SchoolInterface): Promise<SchoolInterface>;
    findById(id: number): Promise<SchoolInterface | null>;
    findByName(name: string): Promise<SchoolInterface | null>;
}

export class SchoolRepo implements SchoolRepoInterface {
    async create(school: SchoolInterface): Promise<SchoolInterface> {
        const created = await School.create(school);
        return created.get({ plain: true }) as SchoolInterface;
    }

    async findById(id: number): Promise<SchoolInterface | null> {
        const school = await School.findByPk(id);
        return school ? (school.get({ plain: true }) as SchoolInterface) : null;
    }

    async findByName(name: string): Promise<SchoolInterface | null> {
        const school = await School.findOne({
            where: { name },
        });
        return school ? (school.get({ plain: true }) as SchoolInterface) : null;
    }
}

export const newSchoolRepo = async (): Promise<SchoolRepoInterface> => {
    return new SchoolRepo();
};
