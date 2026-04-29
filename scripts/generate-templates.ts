/**
 * Script to pre-generate all video templates
 * Run: npm run generate-templates
 */

import { generateAllTemplates } from '../lib/templates/video-generator';

async function main() {
  console.log('🎨 CryptoClips Template Generator');
  console.log('================================\n');
  console.log('This will generate 30 beautiful video templates:');
  console.log('- 10 unique styles');
  console.log('- 3 sentiments each (bullish, bearish, neutral)');
  console.log('- All following golden ratio principles\n');
  console.log('⏱️  Estimated time: 30-60 minutes\n');

  try {
    await generateAllTemplates();
    console.log('\n🎉 Success! All templates generated.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
