
import 'dotenv/config'
import mailService from '../services/mailService.js'

async function run() {
    console.log('--- STARTING EMAIL REPRO ---')

    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
        console.warn('⚠️  Missing MAIL_USER or MAIL_PASS env vars. Email sending might fail if not configured.')
    }

    const dummyProduct = {
        id: 'test-product-id',
        name: 'iPhone 15 Pro Max',
        thumbnail_url: 'https://via.placeholder.com/300'
    }

    const dummySeller = {
        id: 'test-seller-id',
        full_name: 'Test Seller',
        email: 'kane.nguyen@example.com' // Using a potentially valid email or a placeholder to test format. 
        // Ideally I would use the user's email if I knew it, but I'll trust the mailer to log success/fail.
    }

    const dummyAsker = {
        id: 'test-asker-id',
        full_name: 'Test Asker'
    }

    const dummyQuestion = {
        id: 'test-question-id',
        question: 'Sản phẩm này còn bảo hành không?'
    }

    console.log('Testing notifyNewQuestion...')
    await mailService.notifyNewQuestion({
        product: dummyProduct,
        seller: dummySeller,
        asker: dummyAsker,
        question: dummyQuestion
    })

    console.log('--- REPRO FINISHED ---')
}

run().catch(console.error)
