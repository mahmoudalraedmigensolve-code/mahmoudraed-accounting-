# Cloudinary Setup Guide - دليل إعداد Cloudinary

## خطوات إنشاء Upload Preset

لكي يعمل رفع الصور بشكل صحيح، يجب إنشاء Upload Preset في Cloudinary باتباع الخطوات التالية:

### 1. افتح لوحة التحكم
افتح الرابط: https://cloudinary.com/console

### 2. انتقل إلى إعدادات Upload
- اذهب إلى **Settings** (الإعدادات)
- اختر **Upload**
- اضغط على **Upload presets**

### 3. أنشئ Preset جديد
- اضغط على زر **"Add upload preset"**
- في حقل **"Preset name"**: اكتب `accounting_app`
- في حقل **"Signing Mode"**: اختر **"Unsigned"** ⚠️ (مهم جداً)
- اضغط **Save**

### 4. تأكد من الإعدادات

يجب أن تكون الإعدادات كالتالي:
- **Preset name**: `accounting_app`
- **Signing Mode**: `Unsigned`
- **Folder**: يمكن تركه فارغاً (التطبيق يحدد المجلد تلقائياً)

---

## Environment Variables المطلوبة

تأكد من وجود هذه المتغيرات في ملف `.env`:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dwsclyzyp
NEXT_PUBLIC_CLOUDINARY_API_KEY=824349784337583
CLOUDINARY_API_SECRET=x1Ww3qGZrmLEO5xixY6qaSbAeYo
```

---

## استكشاف الأخطاء

### خطأ: "Failed to upload image"

**السبب المحتمل**: Upload preset غير موجود أو الـ Signing Mode ليس Unsigned

**الحل**:
1. تأكد من إنشاء preset باسم `accounting_app`
2. تأكد من أن Signing Mode = Unsigned
3. جرب رفع الصورة مرة أخرى

### خطأ: "Invalid upload preset"

**السبب**: اسم الـ preset غير صحيح

**الحل**: تأكد من أن الاسم بالضبط `accounting_app` (بدون مسافات أو أحرف إضافية)

---

## معلومات إضافية

- **الحد المجاني**: 25 GB تخزين مجاني
- **أنواع الملفات المدعومة**: JPG, PNG, GIF, WebP, SVG
- **لا يوجد حد لحجم الملف** في التطبيق (حسب طلبك)
- **المجلدات المستخدمة**:
  - `company-logos` - شعارات الشركات
  - `whatsapp-qr` - رموز QR للواتساب

---

## روابط مفيدة

- لوحة التحكم: https://cloudinary.com/console
- Upload Presets: https://cloudinary.com/console/settings/upload
- التوثيق الرسمي: https://cloudinary.com/documentation/upload_presets
