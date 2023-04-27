type User = {
    name: string,
    isAdmin: boolean
};

type UserAuthenticationInfo = {
    password: string
}

type Package = {
    metadata: PackageMetadata,
    data: PackageData
};

type PackageData = {
    Content?: string,
    URL?: string
};

type PackageMetadata = {
    Name: string,
    Version: string,
    ID: string
};

export {
    User,
    UserAuthenticationInfo,
    Package,
    PackageData,
    PackageMetadata
};