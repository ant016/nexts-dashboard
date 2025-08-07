'use server' //Todas las funciones de este archivo son del lado del servidor

import {z} from 'zod'
import {Invoice} from './definitions'
import postgres from 'postgres'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const CreateInvoiceSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['paid', 'pending']),
    date: z.string()
})

const CreateInvoiceFromSchema = CreateInvoiceSchema.omit({id: true, date: true})

export async function createInvoice(formData: FormData) {
    const {customerId, amount, status}= CreateInvoiceFromSchema.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    })

    const amountInCents=amount*100 //evitar errores de redondeo

    const [date] = new Date().toISOString().split('T') // Del objeto sacamos solo la fecha actual

    await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `
    
    // Revalidar y dirigir para ver los cambios en la pagina principal
    revalidatePath('/dashboard/invoices')
    redirect('/dashboard/invoices')
}