import cloudinary from './config/cloudinary.js';

async function testCloudinaryConnection() {
  console.log('--- Testing Cloudinary Connection & Configuration ---');
  console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME || '(Not set)');
  console.log('API Key:', process.env.CLOUDINARY_API_KEY ? '*****' + process.env.CLOUDINARY_API_KEY.slice(-4) : '(Not set)');

  try {
    // 1. Ping Cloudinary API & Check Account Usage
    console.log('\n1. Ping Cloudinary API...');
    const pingRes = await cloudinary.api.ping();
    console.log('✅ Cloudinary API Ping Successful:', pingRes);

    try {
      console.log('\nFetching Account Usage...');
      const usageRes = await cloudinary.api.usage();
      console.log('✅ Account Usage Info:', JSON.stringify(usageRes, null, 2));
    } catch (uErr) {
      console.error('❌ Failed to fetch Account Usage:', uErr);
    }

    // 2. Test Uploading a tiny sample 1x1 image buffer
    console.log('\n2. Testing Cloudinary Upload Stream...');
    const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    try {
      const uploadRes = await cloudinary.uploader.upload(sampleBase64, {
        folder: 'dr_vinish_test',
        resource_type: 'image'
      });
      console.log('✅ Direct Upload Test Successful!');
      console.log('Uploaded Image URL:', uploadRes.secure_url);
      console.log('Public ID:', uploadRes.public_id);

      // Clean up test image
      console.log('\n3. Cleaning up test image from Cloudinary...');
      const deleteRes = await cloudinary.uploader.destroy(uploadRes.public_id);
      console.log('✅ Cleanup Successful:', deleteRes);
    } catch (err) {
      console.error('Direct upload failed:', err);

      console.log('\nRetrying via stream upload with explicit resource_type...');
      const sampleBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
      const uploadPromise = new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'dr_vinish_test',
            resource_type: 'image'
          },
          (err, res) => {
            if (err) return reject(err);
            resolve(res);
          }
        );
        stream.end(sampleBuffer);
      });
      const streamRes = await uploadPromise;
      console.log('✅ Stream Upload Test Successful!');
      console.log('Uploaded Image URL:', streamRes.secure_url);
    }

    console.log('\n🎉 ALL CLOUDINARY TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (error) {
    console.error('\n❌ Cloudinary Test Failed!');
    console.error('Error Details:', error.error || error.message || error);
    process.exit(1);
  }
}

testCloudinaryConnection();
