import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

async function main() {
    await prisma.user.create({
        data: {
            name: "John Doe",
        },
    });
}   
main()