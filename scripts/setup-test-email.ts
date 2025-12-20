import { EmailTestHelper } from '../src/shared/email/email-test.helper'

/**
 * Script para generar credenciales de Ethereal Email para testing
 *
 * Ejecutar: npx ts-node scripts/setup-test-email.ts
 */
async function setup() {
  console.log('\n🚀 Generando cuenta de prueba de Ethereal Email...\n')

  try {
    await EmailTestHelper.createTestAccount()

    console.log('\n✅ Listo! Ahora puedes:')
    console.log('   1. Copiar las credenciales a tu archivo .env')
    console.log('   2. Reiniciar tu aplicación')
    console.log('   3. Enviar emails de prueba')
    console.log('   4. Ver los emails en https://ethereal.email/messages\n')
  } catch (error) {
    console.error('❌ Error al generar cuenta de prueba:', error)
    process.exit(1)
  }
}

setup()
