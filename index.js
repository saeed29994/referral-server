const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

// ✅ تهيئة Firebase Admin باستخدام المتغير البيئي بدلاً من الملف
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT)
  ),
});

const app = express();
app.use(cors());
app.use(express.json());

// 🚀 إضافة الإحالة
app.post('/addReferral', async (req, res) => {
  const { referrerCode, newUserEmail } = req.body;

  if (!referrerCode || !newUserEmail) {
    return res.status(400).json({ error: 'referrerCode and newUserEmail are required.' });
  }

  try {
    const usersRef = admin.firestore().collection('users');
    const refSnap = await usersRef.where('referralCode', '==', referrerCode).get();

    if (refSnap.empty) {
      return res.status(404).json({ error: 'Referrer not found.' });
    }

    const refDoc = refSnap.docs[0];
    await refDoc.ref.update({
      referralList: admin.firestore.FieldValue.arrayUnion({
        email: newUserEmail,
        status: 'Pending',
        timestamp: Date.now(),
      }),
      referrals: admin.firestore.FieldValue.increment(1),
    });

    return res.status(200).json({ message: 'Referral added successfully!' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ✅ بدء الخادم
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
