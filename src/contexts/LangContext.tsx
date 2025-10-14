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
