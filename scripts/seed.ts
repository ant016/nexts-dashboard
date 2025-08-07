import bcrypt from 'bcrypt';
import postgres from 'postgres';
import { invoices, customers, revenue, users } from '../app/lib/placeholder-data';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

async function dropTables() {
  try {
    console.log('🗑️  Eliminando tablas existentes...');
    
    // Eliminar tablas en orden correcto (considerando las relaciones)
    await sql`DROP TABLE IF EXISTS invoices CASCADE;`;
    console.log('   ✅ Tabla invoices eliminada');
    
    await sql`DROP TABLE IF EXISTS customers CASCADE;`;
    console.log('   ✅ Tabla customers eliminada');
    
    await sql`DROP TABLE IF EXISTS users CASCADE;`;
    console.log('   ✅ Tabla users eliminada');
    
    await sql`DROP TABLE IF EXISTS revenue CASCADE;`;
    console.log('   ✅ Tabla revenue eliminada');
    
    console.log('🗑️  Todas las tablas eliminadas exitosamente');
  } catch (error) {
    console.error('❌ Error al eliminar tablas:', error);
    throw error;
  }
}

async function seedUsers() {
  try {
    console.log('🔄 Creando extensión uuid-ossp...');
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    
    console.log('🔄 Creando tabla users...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `;

    console.log('🔄 Insertando usuarios...');
    const insertedUsers = await Promise.all(
      users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return sql`
          INSERT INTO users (id, name, email, password)
          VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
          ON CONFLICT (id) DO NOTHING;
        `;
      }),
    );

    console.log(`✅ ${insertedUsers.length} usuarios insertados`);
    return insertedUsers;
  } catch (error) {
    console.error('❌ Error al crear usuarios:', error);
    throw error;
  }
}

async function seedCustomers() {
  try {
    console.log('🔄 Creando tabla customers...');
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    await sql`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        image_url VARCHAR(255) NOT NULL
      );
    `;

    console.log('🔄 Insertando clientes...');
    const insertedCustomers = await Promise.all(
      customers.map(
        (customer) => sql`
          INSERT INTO customers (id, name, email, image_url)
          VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
          ON CONFLICT (id) DO NOTHING;
        `,
      ),
    );

    console.log(`✅ ${insertedCustomers.length} clientes insertados`);
    return insertedCustomers;
  } catch (error) {
    console.error('❌ Error al crear clientes:', error);
    throw error;
  }
}

async function seedInvoices() {
  try {
    console.log('🔄 Creando tabla invoices...');
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    await sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        customer_id UUID NOT NULL,
        amount INT NOT NULL,
        status VARCHAR(255) NOT NULL,
        date DATE NOT NULL
      );
    `;

    console.log('🔄 Insertando facturas...');
    const insertedInvoices = await Promise.all(
      invoices.map(
        (invoice) => sql`
          INSERT INTO invoices (customer_id, amount, status, date)
          VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
          ON CONFLICT (id) DO NOTHING;
        `,
      ),
    );

    console.log(`✅ ${insertedInvoices.length} facturas insertadas`);
    return insertedInvoices;
  } catch (error) {
    console.error('❌ Error al crear facturas:', error);
    throw error;
  }
}

async function seedRevenue() {
  try {
    console.log('🔄 Creando tabla revenue...');
    await sql`
      CREATE TABLE IF NOT EXISTS revenue (
        month VARCHAR(4) NOT NULL UNIQUE,
        revenue INT NOT NULL
      );
    `;

    console.log('🔄 Insertando datos de ingresos...');
    const insertedRevenue = await Promise.all(
      revenue.map(
        (rev) => sql`
          INSERT INTO revenue (month, revenue)
          VALUES (${rev.month}, ${rev.revenue})
          ON CONFLICT (month) DO NOTHING;
        `,
      ),
    );

    console.log(`✅ ${insertedRevenue.length} registros de ingresos insertados`);
    return insertedRevenue;
  } catch (error) {
    console.error('❌ Error al crear datos de ingresos:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Iniciando regeneración completa de la base de datos...');
  
  if (!process.env.POSTGRES_URL) {
    console.error('❌ POSTGRES_URL no está definida en las variables de entorno');
    process.exit(1);
  }

  try {
    // Primero eliminar todas las tablas
    await dropTables();
    
    // Luego crear todo de nuevo
    await seedUsers();
    await seedCustomers();
    await seedInvoices();
    await seedRevenue();
    
    console.log('🎉 Base de datos regenerada exitosamente');
  } catch (error) {
    console.error('❌ Error durante la regeneración:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
