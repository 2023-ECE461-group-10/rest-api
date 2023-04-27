import { Prisma, PrismaClient } from '@prisma/client';

class PackageModelUtils {

    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async checkPkgExists(name: string, version: string): Promise<boolean> {
        const pkg = await this.prisma.package.findFirst({where: {
            name: name,
            version: version
        }});
        return pkg != null;
    }
}

export {
    PackageModelUtils
};