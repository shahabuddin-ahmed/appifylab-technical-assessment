import { ERROR_CODES } from "../constant/error";
import { SchoolInterface } from "../model/school";
import { SchoolRepoInterface } from "../repo/school";
import { BadRequestException } from "../web/exception/bad-request-exception";
import { NotFoundException } from "../web/exception/not-found-exception";

export interface SchoolServiceInterface {
    create(school: SchoolInterface): Promise<SchoolInterface>;
    getById(id: number): Promise<SchoolInterface>;
}

export class SchoolService implements SchoolServiceInterface {
    constructor(private repo: SchoolRepoInterface) {}

    async create(school: SchoolInterface): Promise<SchoolInterface> {
        const existing = await this.repo.findByName(school.name);
        if (existing) {
            throw new BadRequestException(
                ERROR_CODES.E_INVALID_DATA,
                "School name already exists"
            );
        }

        return this.repo.create(school);
    }

    async getById(id: number): Promise<SchoolInterface> {
        const school = await this.repo.findById(id);
        if (!school) {
            throw new NotFoundException(ERROR_CODES.E_PAGE_NOT_FOUND, "School not found");
        }
        return school;
    }
}

export const newSchoolService = async (
    repo: SchoolRepoInterface
): Promise<SchoolServiceInterface> => {
    return new SchoolService(repo);
};
