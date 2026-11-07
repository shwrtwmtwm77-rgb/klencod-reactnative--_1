# غلغ

مشروع React Native CLI مُنشأ بواسطة KlencodIDE.

## القالب: محوّل الوحدات (Unit Converter)

### الميزات
- 3 فئات: الطول، الوزن، الحرارة
- 11 وحدة قياس
- تبديل فوري بين الوحدات
- عرض الصيغة الحسابية
- تصميم داكن بسيط
- بدون مكتبات خارجية، بدون إنترنت
- بدون NDK (لبناء أسرع)

## التقنيات
- React Native 0.76.7
- TypeScript
- Android Native (Kotlin)
- GitHub Actions للبناء التلقائي

## البناء

يتم البناء تلقائياً على GitHub Actions عند الضغط على "بناء APK".

## الهيكل
- `App.tsx` — واجهة التطبيق (محوّل الوحدات)
- `index.js` — نقطة الدخول
- `android/` — مشروع Android الأصلي
- `.github/workflows/` — GitHub Actions
- `.klencod/project.json` — بيانات المشروع

## Package
``com.dm.qqp``
