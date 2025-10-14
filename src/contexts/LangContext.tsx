import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Dict = Record<string, string>;

type Lang = 'en' | 'hi' | 'ur';

const en: Dict = {
  'common.theme': 'Theme',
  'common.english': 'English',
  'common.hindi': 'हिंदी',
  'common.urdu': 'اردو',
  'common.close': 'Close',
  'common.print_certificate': 'Print Certificate',

  // Navigation
  'nav.dashboard': 'Dashboard',
  'nav.students': 'Students',
  'nav.teachers': 'Teachers',
  'nav.classes': 'Classes',
  'nav.subjects': 'Subjects',
  'nav.exams': 'Exams',
  'nav.fees': 'Fees',
  'nav.timetable': 'Timetable',
  'nav.attendance': 'Attendance',
  'nav.notifications': 'Notifications',
  'nav.settings': 'Settings',
  'nav.my_children': 'My Children',
  'nav.performance': 'Performance',
  'nav.fee_payments': 'Fee Payments',
  'nav.assignments': 'Assignments',
  'nav.quizzes_tests': 'Quizzes & Tests',
  'nav.exams_results': 'Exams & Results',
  'nav.my_attendance': 'My Attendance',
  'nav.fee_payment': 'Fee Payment',
  'nav.my_classes': 'My Classes',
  'nav.study_materials': 'Study Materials',
  'nav.quiz_test': 'Quiz & Test',
  'nav.grading': 'Grading',
  'nav.teacher_students': 'Students',
  'nav.finance_tools': 'Finance Tools',
  'nav.notification_tools': 'Notification Tools',
  'nav.admin_reports': 'Admin Reports',

  'parent.performance.title': 'Academic Performance',
  'parent.performance.subtitle': "Track your children's academic progress",
  'parent.performance.select_child': 'Select Child',
  'parent.performance.overall_average': 'Overall Average',
  'parent.performance.class_rank': 'Class Rank',
  'parent.performance.progress': 'Progress',
  'parent.performance.no_data': 'No performance data available',
  'parent.performance.subject_wise': 'Subject-wise Performance',
  'parent.performance.assignments': 'Assignments',
  'parent.performance.exams': 'Exam Results',
  'parent.performance.quizzes': 'Quizzes & Tests',
  'parent.performance.no_assignments': 'No assignments found',
  'parent.performance.no_quizzes': 'No quizzes/tests found',

  'table.title': 'Title',
  'table.subject': 'Subject',
  'table.type': 'Type',
  'table.status': 'Status',
  'table.marks': 'Marks',
  'table.percent': '%',
  'table.result': 'Result',

  'result.passed': 'Passed',
  'result.failed': 'Failed',

  'student.quizzes.results': 'Results',
  'student.quizzes.attempt': 'Attempt',
  'student.quizzes.score': 'Score',
  'student.quizzes.status': 'Status',
  'student.quizzes.submitted': 'Submitted',
};

const hi: Dict = {
  'common.theme': 'थीम',
  'common.english': 'English',
  'common.hindi': 'हिंदी',
  'common.urdu': 'اردو',
  'common.close': 'बंद करें',
  'common.print_certificate': 'प्रमाणपत्र प्रिंट करें',

  // Navigation
  'nav.dashboard': 'डैशबोर्ड',
  'nav.students': 'छात्र',
  'nav.teachers': 'शिक्षक',
  'nav.classes': 'कक्षाएं',
  'nav.subjects': 'विषय',
  'nav.exams': 'परीक्षाएं',
  'nav.fees': 'शुल्क',
  'nav.timetable': 'समय सारिणी',
  'nav.attendance': 'उपस्थिति',
  'nav.notifications': 'सूचनाएँ',
  'nav.settings': 'सेटिंग्स',
  'nav.my_children': 'मेरे बच्चे',
  'nav.performance': 'प्रदर्शन',
  'nav.fee_payments': 'शुल्क भुगतान',
  'nav.assignments': 'असाइनमेंट',
  'nav.quizzes_tests': 'क्विज़ और टेस्ट',
  'nav.exams_results': 'परीक्षा और परिणाम',
  'nav.my_attendance': 'मेरी उपस्थिति',
  'nav.fee_payment': 'शुल्क भुगतान',
  'nav.my_classes': 'मेरी कक्षाएं',
  'nav.study_materials': 'अध्ययन सामग्री',
  'nav.quiz_test': 'क्विज़ और टेस्ट',
  'nav.grading': 'ग्रेडिंग',
  'nav.teacher_students': 'छात्र',
  'nav.finance_tools': 'वित्त उपकरण',
  'nav.notification_tools': 'सूचना उपकरण',
  'nav.admin_reports': 'एडमिन रिपोर्ट्स',

  'parent.performance.title': 'शैक्षणिक प्रदर्शन',
  'parent.performance.subtitle': 'अपने बच्चों की प्रगति देखें',
  'parent.performance.select_child': 'बच्चा चुनें',
  'parent.performance.overall_average': 'कुल औसत',
  'parent.performance.class_rank': 'कक्षा रैंक',
  'parent.performance.progress': 'प्रगति',
  'parent.performance.no_data': 'कोई डेटा उपलब्ध नहीं',
  'parent.performance.subject_wise': 'विषय-वार प्रदर्शन',
  'parent.performance.assignments': 'असाइनमेंट',
  'parent.performance.exams': 'परीक्षा परिणाम',
  'parent.performance.quizzes': 'क्विज़ और टेस्ट',
  'parent.performance.no_assignments': 'कोई असाइनमेंट नहीं मिला',
  'parent.performance.no_quizzes': 'कोई क्विज़/टेस्ट नहीं मिला',

  'table.title': 'शीर्षक',
  'table.subject': 'विषय',
  'table.type': 'प्रकार',
  'table.status': 'स्थिति',
  'table.marks': 'अंक',
  'table.percent': '%',
  'table.result': 'परिणाम',

  'result.passed': 'उत्तीर्ण',
  'result.failed': 'अनुत्तीर्ण',

  'student.quizzes.results': 'परिणाम',
  'student.quizzes.attempt': 'प्रयास',
  'student.quizzes.score': 'स्कोर',
  'student.quizzes.status': 'स्थिति',
  'student.quizzes.submitted': 'जमा किया',
};

const ur: Dict = {
  'common.theme': 'تھیم',
  'common.english': 'English',
  'common.hindi': 'हिंदी',
  'common.urdu': 'اردو',
  'common.close': 'بند کریں',
  'common.print_certificate': 'سرٹیفکیٹ پرنٹ کریں',

  // Navigation
  'nav.dashboard': 'ڈیش بورڈ',
  'nav.students': 'طلباء',
  'nav.teachers': 'اساتذہ',
  'nav.classes': 'کLASسز',
  'nav.subjects': 'مضامین',
  'nav.exams': 'امتحانات',
  'nav.fees': 'فیس',
  'nav.timetable': 'ٹائم ٹیبل',
  'nav.attendance': 'حاضری',
  'nav.notifications': 'اطلاعات',
  'nav.settings': 'سیٹنگز',
  'nav.my_children': 'میرے بچے',
  'nav.performance': 'کارکردگی',
  'nav.fee_payments': 'فیس ادائیگی',
  'nav.assignments': 'اسائنمنٹس',
  'nav.quizzes_tests': 'کوئز و ٹیسٹ',
  'nav.exams_results': 'امتحانات و نتائج',
  'nav.my_attendance': 'میری حاضری',
  'nav.fee_payment': 'فیس ادائیگی',
  'nav.my_classes': 'میری کلاسز',
  'nav.study_materials': 'مطالعہ مواد',
  'nav.quiz_test': 'کوئز و ٹیسٹ',
  'nav.grading': 'گریڈنگ',
  'nav.teacher_students': 'طلباء',
  'nav.finance_tools': 'مالیاتی ٹولز',
  'nav.notification_tools': 'اطلاعی ٹولز',
  'nav.admin_reports': 'ایڈمن رپورٹس',

  'parent.performance.title': 'تعلیمی کارکردگی',
  'parent.performance.subtitle': 'اپنے بچوں کی کارکردگی دیکھیں',
  'parent.performance.select_child': 'بچے کا انتخاب کریں',
  'parent.performance.overall_average': 'مجموعی اوسط',
  'parent.performance.class_rank': 'کلاس درجہ',
  'parent.performance.progress': 'پیش رفت',
  'parent.performance.no_data': 'کوئی ڈیٹا دستیاب نہیں',
  'parent.performance.subject_wise': 'موضوع کے لحاظ سے کارکردگی',
  'parent.performance.assignments': 'اسائنمنٹس',
  'parent.performance.exams': 'امتحانی نتائج',
  'parent.performance.quizzes': 'کوئز و ٹیسٹ',
  'parent.performance.no_assignments': 'کوئی اسائنمنٹ نہیں ملا',
  'parent.performance.no_quizzes': 'کوئی کوئز/ٹیسٹ نہیں ملا',

  'table.title': 'عنوان',
  'table.subject': 'مضمون',
  'table.type': 'قسم',
  'table.status': 'حالت',
  'table.marks': 'نمبر',
  'table.percent': '%',
  'table.result': 'نتیجہ',

  'result.passed': 'کامیاب',
  'result.failed': 'ناکام',

  'student.quizzes.results': 'نتائج',
  'student.quizzes.attempt': 'کوشش',
  'student.quizzes.score': 'اسکور',
  'student.quizzes.status': 'حالت',
  'student.quizzes.submitted': 'جمع کیا',
};

const dicts: Record<Lang, Dict> = { en, hi, ur };

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  dir: 'ltr' | 'rtl';
  t: (key: string) => string;
};

const LangContext = createContext<Ctx | undefined>(undefined);

export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = (typeof window !== 'undefined' ? localStorage.getItem('lang') : null) as Lang | null;
    return saved || 'en';
  });

  useEffect(() => {
    try { localStorage.setItem('lang', lang); } catch {}
    try {
      const el = document.documentElement;
      el.setAttribute('lang', lang);
      el.setAttribute('dir', lang === 'ur' ? 'rtl' : 'ltr');
    } catch {}
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);
  const dir: 'ltr' | 'rtl' = lang === 'ur' ? 'rtl' : 'ltr';

  const t = useMemo(() => {
    return (key: string) => {
      const d = dicts[lang] || en;
      return d[key] ?? en[key] ?? key;
    };
  }, [lang]);

  const value: Ctx = { lang, setLang, dir, t };
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
};

export const useLang = () => {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
};
