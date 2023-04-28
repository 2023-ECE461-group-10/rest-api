import { PrismaClient } from '@prisma/client';

class PackageModelUtils {

    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async checkPkgExists(name: string, version: string): Promise<boolean> {
        logger.log('info', 'Checking if package exists...');
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