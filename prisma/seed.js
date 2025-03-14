import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const defaultSettings = [
        { name: "open_to_trade", value: "false" },
        { name: "auto_decide_win_lose", value: "true" },
    ];

    for (const setting of defaultSettings) {
        await prisma.generalSetting.upsert({
            where: { name: setting.name },
            update: {},
            create: {
                name: setting.name,
                value: setting.value,
            },
        });
    }

    console.log("Default settings inserted ✅");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
