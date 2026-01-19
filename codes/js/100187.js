// GENERATED WITH CHATGPT

const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('./utils/auth');
const prisma = new PrismaClient();

(async () => { 
    try {
        const hashedPassword = await hashPassword('adminPassword'); 
        const user = await prisma.user.create({ 
            data: {
                email: 'admin@example.com',  
                username: 'admin',     
                password: hashedPassword,    
                firstName: 'Admin',      
                lastName: 'User',        
                phoneNumber: BigInt('1234567890'),  
                avatar: '@/scriptorium/public/uploads/avatars/man.png', 
                role: 'ADMIN'             
            },
        });
        console.log('Admin user created:', user);
    } catch (error) {
        console.error('Error creating user:', error);
    } finally {
        await prisma.$disconnect();
    }
})();
