// src/services/i18n.js
// i18next config — English + Hindi built-in, with Google Translate for others

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      dashboard: 'Dashboard', learning: 'Learning', attendance: 'Attendance', timetable: 'Timetable', career: 'Career', chatbot: 'AI Tutor', logout: 'Logout',
      welcome_back: 'Welcome back!', sign_in: 'Sign in to GyaanaSetu', create_account_desc: 'Start your personalized learning experience today', email: 'Email address', password: 'Password', login: 'Login', register: 'Create Account', name: 'Full Name', role: 'I am a', student: 'Student', teacher: 'Teacher', grade: 'Grade', already_account: 'Already have an account?', no_account: 'Don\'t have an account?', school: 'School',
      next_gen_education: 'Next-Gen Education', empower_your: 'Empower Your ', learning_journey: 'Learning Journey', hero_subtitle: 'Experience the future of higher education with AI-driven insights, interactive course libraries, and smart learning tools.', feature_library: 'Course Library', feature_ai: 'AI Tutor Assistant', feature_career: 'Career Guidance',
      good_morning: 'Good Morning', good_afternoon: 'Good Afternoon', good_evening: 'Good Evening', todays_schedule: 'Today\'s Schedule', quick_actions: 'Quick Actions', recent_progress: 'Recent Progress', no_classes_today: 'No classes scheduled today',
      ncert_library: 'Course Library', select_grade: 'Select Semester', select_subject: 'Select Subject', select_chapter: 'Select Module', open_chapter: 'Open Module', ask_ai: 'Ask AI about this topic', chapter_progress: 'Module Progress',
      start_class: 'Start Class', end_class: 'End Class', scan_qr: 'Scan QR Code', marked_present: 'You\'re marked present!', qr_expired: 'QR code expired. Ask your teacher for a new one.', students_present: 'Students Present', attendance_history: 'Attendance History',
      generate_timetable: 'Generate Timetable', weekly_schedule: 'Weekly Schedule', add_subject: 'Add Subject', add_teacher: 'Add Teacher',
      career_quiz: 'Career Aptitude Quiz', start_quiz: 'Start Quiz', your_result: 'Your Career Path', retake_quiz: 'Retake Quiz',
      chat_placeholder: 'Ask me anything about your studies...', send: 'Send', clear_chat: 'Clear Chat',
      chatbot_subtitle: 'Powered by Groq LLaMA 3.3-70B · BNMIT Engineering AI Tutor', chatbot_welcome: 'Namaste! 🙏 I\'m your AI Tutor for BNMIT. I can help you with engineering subjects (CS, ECE, Mech, Civil), exam preparation, programming doubts, and more. What would you like to learn today?', try_asking: 'Try asking:',
      suggested_1: 'Explain binary search trees with an example', suggested_2: 'What is normalisation in DBMS?', suggested_3: 'How do I prepare for my algorithms exam?', suggested_4: 'What is the difference between process and thread?', suggested_5: 'Explain TCP/IP model layers',
      loading: 'Loading...', error: 'Something went wrong', save: 'Save', cancel: 'Cancel', submit: 'Submit', back: 'Back', next: 'Next', done: 'Done', view_all: 'View All', coming_soon: 'Coming Soon'
    }
  },
  hi: {
    translation: {
      dashboard: 'डैशबोर्ड', learning: 'सीखना', attendance: 'उपस्थिति', timetable: 'समय सारणी', career: 'करियर', chatbot: 'AI शिक्षक', logout: 'लॉग आउट',
      welcome_back: 'वापस स्वागत है!', sign_in: 'साइन इन करें', create_account_desc: 'अपनी सीखने की यात्रा शुरू करें', email: 'ईमेल', password: 'पासवर्ड', login: 'लॉगिन', register: 'खाता बनाएं', name: 'पूरा नाम', role: 'मैं हूं', student: 'छात्र', teacher: 'शिक्षक', grade: 'कक्षा', already_account: 'पहले से खाता है?', no_account: 'खाता नहीं है?', school: 'विद्यालय',
      next_gen_education: 'अगली पीढ़ी की शिक्षा', empower_your: 'सशक्त बनाएं ', learning_journey: 'अपनी सीखने की यात्रा', hero_subtitle: 'AI, NCERT पुस्तकालय और स्मार्ट गेमिफिकेशन के साथ शिक्षा का भविष्य अनुभव करें।', feature_library: 'इंटरैक्टिव लाइब्रेरी', feature_ai: 'AI सहायक', feature_career: 'करियर मार्गदर्शन',
      good_morning: 'सुप्रभात', good_afternoon: 'शुभ दोपहर', good_evening: 'शुभ संध्या', todays_schedule: 'आज का कार्यक्रम', quick_actions: 'त्वरित कार्य', recent_progress: 'हालिया प्रगति', no_classes_today: 'आज कोई कक्षा नहीं',
      ncert_library: 'NCERT पुस्तकालय', select_grade: 'कक्षा चुनें', select_subject: 'विषय चुनें', select_chapter: 'अध्याय चुनें', open_chapter: 'अध्याय खोलें', ask_ai: 'AI से पूछें', chapter_progress: 'प्रगति',
      start_class: 'कक्षा शुरू करें', end_class: 'कक्षा समाप्त करें', scan_qr: 'QR स्कैन करें', marked_present: 'उपस्थिति दर्ज!', qr_expired: 'QR समाप्त हो गया।', students_present: 'उपस्थित छात्र', attendance_history: 'उपस्थिति इतिहास',
      generate_timetable: 'समय सारणी बनाएं', weekly_schedule: 'साप्ताहिक कार्यक्रम', add_subject: 'विषय जोड़ें', add_teacher: 'शिक्षक जोड़ें',
      career_quiz: 'करियर प्रश्नोत्तरी', start_quiz: 'प्रश्नोत्तरी शुरू करें', your_result: 'आपका करियर', retake_quiz: 'फिर से प्रयास करें',
      chat_placeholder: 'कुछ भी पूछें...', send: 'भेजें', clear_chat: 'चैट साफ करें',
      chatbot_subtitle: 'Groq LLaMA 3.3-70B द्वारा संचालित · NCERT ट्यूटर', chatbot_welcome: 'नमस्ते! 🙏 मैं आपका AI ट्यूटर हूँ। मैं आपको NCERT विषयों (कक्षा IV-X), परीक्षा की तैयारी और बहुत कुछ में मदद कर सकता हूँ। आज आप क्या सीखना चाहेंगे?', try_asking: 'पूछने का प्रयास करें:',
      suggested_1: 'प्रकाश संश्लेषण को सरल शब्दों में समझाएं', suggested_2: 'त्रिभुज के गुण क्या हैं?', suggested_3: 'मैं अपनी विज्ञान परीक्षा की तैयारी कैसे करूँ?', suggested_4: 'गति और वेग में क्या अंतर है?', suggested_5: 'मुझे फ्रांसीसी क्रांति के बारे में बताएं',
      loading: 'लोड हो रहा है...', error: 'कुछ गलत हुआ', save: 'सहेजें', cancel: 'रद्द करें', submit: 'जमा करें', back: 'वापस', next: 'अगला', done: 'हो गया', view_all: 'सभी देखें', coming_soon: 'जल्द आ रहा है'
    }
  },
  ta: {
    translation: {
      dashboard: 'முகப்பு', learning: 'கற்றல்', attendance: 'வருகை', timetable: 'கால அட்டவணை', career: 'தொழில்', chatbot: 'AI ஆசிரியர்', logout: 'வெளியேறு',
      welcome_back: 'மீண்டும் வரவேற்கிறோம்!', sign_in: 'உள்நுழைக', create_account_desc: 'உங்கள் கற்றல் பயணத்தை தொடங்குங்கள்', email: 'மின்னஞ்சல்', password: 'கடவுச்சொல்', login: 'உள்நுழை', register: 'கணக்கை உருவாக்கு', name: 'முழு பெயர்', role: 'நான் ஒரு', student: 'மாணவர்', teacher: 'ஆசிரியர்', grade: 'வகுப்பு', already_account: 'கணக்கு உள்ளதா?', no_account: 'கணக்கு இல்லையா?', school: 'பள்ளி',
      next_gen_education: 'அடுத்த தலைமுறை கல்வி', empower_your: 'மேம்படுத்துங்கள் ', learning_journey: 'உங்கள் கற்றலை', hero_subtitle: 'AI, NCERT நூலகங்கள் மற்றும் ஸ்மார்ட் கேமிஃபிகேஷன் மூலம் கல்வியின் எதிர்காலத்தை அனுபவியுங்கள்.', feature_library: 'ஊடாடும் நூலகம்', feature_ai: 'AI உதவி', feature_career: 'தொழில் வழிகாட்டல்',
      good_morning: 'காலை வணக்கம்', good_afternoon: 'மதிய வணக்கம்', good_evening: 'மாலை வணக்கம்', todays_schedule: 'இன்றைய அட்டவணை', quick_actions: 'விரைவான செயல்கள்', recent_progress: 'சமீபத்திய முன்னேற்றம்', no_classes_today: 'இன்று வகுப்புகள் இல்லை',
      ncert_library: 'NCERT நூலகம்', select_grade: 'வகுப்பைத் தேர்ந்தெடு', select_subject: 'பாடத்தைத் தேர்ந்தெடு', select_chapter: 'அத்தியாயத்தைத் தேர்ந்தெடு', open_chapter: 'அத்தியாயத்தைத் திற', ask_ai: 'AI-யிடம் கேள்', chapter_progress: 'முன்னேற்றம்',
      start_class: 'வகுப்பைத் தொடங்கு', end_class: 'வகுப்பை முடி', scan_qr: 'QR ஸ்கேன்', marked_present: 'வருகை பதிவு செய்யப்பட்டது!', qr_expired: 'QR காலாவதியானது.', students_present: 'வந்த மாணவர்கள்', attendance_history: 'வருகை வரலாறு',
      generate_timetable: 'அட்டவணையை உருவாக்கு', weekly_schedule: 'வார அட்டவணை', add_subject: 'பாடம் சேர்', add_teacher: 'ஆசிரியர் சேர்',
      career_quiz: 'தொழில் வினாடி வினா', start_quiz: 'வினாடி வினா தொடங்கு', your_result: 'உங்கள் தொழில்', retake_quiz: 'மீண்டும் செய்',
      chat_placeholder: 'கேள்விகளை கேட்கவும்...', send: 'அனுப்பு', clear_chat: 'அழி',
      chatbot_subtitle: 'Groq LLaMA 3.3-70B ஆல் இயக்கப்படுகிறது · NCERT ஆசிரியர்', chatbot_welcome: 'நமஸ்தே! 🙏 நான் உங்கள் AI ஆசிரியர். NCERT பாடங்கள் (வகுப்புகள் IV-X), தேர்வு தயாரிப்பு மற்றும் பலவற்றில் நான் உங்களுக்கு உதவ முடியும். இன்று நீங்கள் என்ன கற்க விரும்புகிறீர்கள்?', try_asking: 'இதை கேட்க முயற்சிக்கவும்:',
      suggested_1: 'ஒளிச்சேர்க்கையை எளிய வார்த்தைகளில் விளக்குங்கள்', suggested_2: 'முக்கோணத்தின் பண்புகள் என்ன?', suggested_3: 'எனது அறிவியல் தேர்வுக்கு நான் எவ்வாறு தயார் செய்வது?', suggested_4: 'வேகத்திற்கும் திசைவேகத்திற்கும் உள்ள வேறுபாடு என்ன?', suggested_5: 'பிரெஞ்சு புரட்சியைப் பற்றி கூறுங்கள்',
      loading: 'ஏற்றுகிறது...', error: 'பிழை ஏற்பட்டது', save: 'சேமி', cancel: 'ரத்து', submit: 'சமர்ப்பி', back: 'பின்னோக்கி', next: 'அடுத்து', done: 'முடிந்தது', view_all: 'அனைத்தையும் காண்', coming_soon: 'விரைவில்'
    }
  },
  te: {
    translation: {
      dashboard: 'డాష్‌బోర్డ్', learning: 'అభ్యసన', attendance: 'హాజరు', timetable: 'టైమ్‌టేబుల్', career: 'కెరీర్', chatbot: 'AI గురువు', logout: 'లాగౌట్',
      welcome_back: 'స్వాగతం!', sign_in: 'సైన్ ఇన్ చేయండి', create_account_desc: 'మీ ప్రయాణాన్ని ప్రారంభించండి', email: 'ఇమెయిల్', password: 'పాస్‌వర్డ్', login: 'లాగిన్', register: 'ఖాతా సృష్టించండి', name: 'పూర్తి పేరు', role: 'నేను', student: 'విద్యార్థి', teacher: 'ఉపాధ్యాయుడు', grade: 'తరగతి', already_account: 'ఖాతా ఉందా?', no_account: 'ఖాతా లేదా?', school: 'పాఠశాల',
      next_gen_education: 'నెక్స్ట్-జెన్ విద్య', empower_your: 'సశక్తం చేయండి ', learning_journey: 'మీ అభ్యసన ప్రయాణాన్ని', hero_subtitle: 'AI, NCERT లైబ్రరీలు మరియు స్మార్ట్ గేమిఫికేషన్‌తో విద్య భవిష్యత్తును అనుభవించండి.', feature_library: 'ఇంటరాక్టివ్ లైబ్రరీ', feature_ai: 'AI సహాయకుడు', feature_career: 'కెరీర్ గైడెన్స్',
      good_morning: 'శుభోదయం', good_afternoon: 'మధ్యాహ్నం', good_evening: 'శుభ సాయంత్రం', todays_schedule: 'నేటి షెడ్యూల్', quick_actions: 'త్వరిత చర్యలు', recent_progress: 'ఇటీవలి పురోగతి', no_classes_today: 'నేడు తరగతులు లేవు',
      ncert_library: 'NCERT లైబ్రరీ', select_grade: 'తరగతిని ఎంచుకోండి', select_subject: 'సబ్జెక్ట్‌ను ఎంచుకోండి', select_chapter: 'అధ్యాయాన్ని ఎంచుకోండి', open_chapter: 'అధ్యాయాన్ని తెరవండి', ask_ai: 'AI ని అడగండి', chapter_progress: 'పురోగతి',
      start_class: 'తరగతి ప్రారంభించండి', end_class: 'తరగతి ముగించండి', scan_qr: 'QR స్కాన్ చేయండి', marked_present: 'హాజరు నమోదైంది!', qr_expired: 'QR గడువు ముగిసింది.', students_present: 'హాజరైన విద్యార్థులు', attendance_history: 'హాజరు చరిత్ర',
      generate_timetable: 'టైమ్‌టేబుల్ సృష్టించండి', weekly_schedule: 'వారపు షెడ్యూల్', add_subject: 'సబ్జెక్ట్ జోడించండి', add_teacher: 'ఉపాధ్యాయుడిని జోడించండి',
      career_quiz: 'కెరీర్ క్విజ్', start_quiz: 'క్విజ్ ప్రారంభించండి', your_result: 'మీ కెరీర్', retake_quiz: 'మళ్లీ ప్రయత్నించండి',
      chat_placeholder: 'ప్రశ్నలను అడగండి...', send: 'పంపండి', clear_chat: 'చాట్ క్లియర్ చేయండి',
      chatbot_subtitle: 'Groq LLaMA 3.3-70B ద్వారా ఆధారితం · NCERT ట్యూటర్', chatbot_welcome: 'నమస్తే! 🙏 నేను మీ AI ట్యూటర్‌ని. నేను మీకు NCERT అంశాలు (తరగతులు IV-X), పరీక్షల తయారీ మరియు మరిన్నింటిలో సహాయపడగలను. ఈరోజు మీరు ఏమి నేర్చుకోవాలనుకుంటున్నారు?', try_asking: 'ఇలా అడగడానికి ప్రయత్నించండి:',
      suggested_1: 'కిరణజన్య సంయోగక్రియను సరళమైన పదాలలో వివరించండి', suggested_2: 'త్రిభుజం యొక్క లక్షణాలు ఏమిటి?', suggested_3: 'నా సైన్స్ పరీక్ష కోసం నేను ఎలా సిద్ధపడాలి?', suggested_4: 'వేగం మరియు వెలాసిటీ మధ్య తేడా ఏమిటి?', suggested_5: 'ఫ్రెంచ్ విప్లవం గురించి చెప్పండి',
      loading: 'లోడ్ అవుతోంది...', error: 'లోపం ఏర్పడింది', save: 'సేవ్ చేయండి', cancel: 'రద్దు చేయండి', submit: 'సమర్పించండి', back: 'వెనుకకు', next: 'తర్వాత', done: 'పూర్తయింది', view_all: 'అన్నింటినీ చూడండి', coming_soon: 'త్వరలో'
    }
  },
  kn: {
    translation: {
      dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', learning: 'ಕಲಿಕೆ', attendance: 'ಹಾಜರಾತಿ', timetable: 'ವೇಳಾಪಟ್ಟಿ', career: 'ವೃತ್ತಿ', chatbot: 'AI ಬೋಧಕ', logout: 'ಲಾಗ್ ಔಟ್',
      welcome_back: 'ಮರಳಿ ಸ್ವಾಗತ!', sign_in: 'ಸೈನ್ ಇನ್ ಮಾಡಿ', create_account_desc: 'ನಿಮ್ಮ ಕಲಿಕೆಯ ಪ್ರಯಾಣವನ್ನು ಪ್ರಾರಂಭಿಸಿ', email: 'ಇಮೇಲ್', password: 'ಪಾಸ್‌ವರ್ಡ್', login: 'ಲಾಗಿನ್', register: 'ಖಾತೆ ರಚಿಸಿ', name: 'ಪೂರ್ಣ ಹೆಸರು', role: 'ನಾನು', student: 'ವಿದ್ಯಾರ್ಥಿ', teacher: 'ಶಿಕ್ಷಕ', grade: 'ತರಗತಿ', already_account: 'ಖಾತೆ ಇದೆಯೇ?', no_account: 'ಖಾತೆ ಇಲ್ಲವೇ?', school: 'ಶ್ರೀ ಕುಮಾರನ್ ಶಾಲೆ',
      next_gen_education: 'ಮುಂದಿನ ಪೀಳಿಗೆಯ ಶಿಕ್ಷಣ', empower_your: 'ಸಶಕ್ತಗೊಳಿಸಿ ', learning_journey: 'ನಿಮ್ಮ ಕಲಿಕೆಯ ಪ್ರಯಾಣವನ್ನು', hero_subtitle: 'AI, NCERT ಗ್ರಂಥಾಲಯಗಳು ಮತ್ತು ಸ್ಮಾರ್ಟ್ ಗ್ಯಾಮಿಫಿಕೇಶನ್‌ನೊಂದಿಗೆ ಶಿಕ್ಷಣದ ಭವಿಷ್ಯವನ್ನು ಅನುಭವಿಸಿ.', feature_library: 'ಇಂಟರಾಕ್ಟಿವ್ ಲೈಬ್ರರಿ', feature_ai: 'AI ಸಹಾಯಕ', feature_career: 'ವೃತ್ತಿ ಮಾರ್ಗದರ್ಶನ',
      good_morning: 'ಶುಭೋದಯ', good_afternoon: 'ಶುಭ ಮಧ್ಯಾಹ್ನ', good_evening: 'ಶುಭ ಸಂಜೆ', todays_schedule: 'ಇಂದಿನ ವೇಳಾಪಟ್ಟಿ', quick_actions: 'ತ್ವರಿತ ಕ್ರಮಗಳು', recent_progress: 'ಇತ್ತೀಚಿನ ಪ್ರಗತಿ', no_classes_today: 'ಇಂದು ತರಗತಿಗಳಿಲ್ಲ',
      ncert_library: 'NCERT ಗ್ರಂಥಾಲಯ', select_grade: 'ತರಗತಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ', select_subject: 'ವಿಷಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ', select_chapter: 'ಅಧ್ಯಾಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ', open_chapter: 'ಅಧ್ಯಾಯವನ್ನು ತೆರೆಯಿರಿ', ask_ai: 'AI ಯನ್ನು ಕೇಳಿ', chapter_progress: 'ಪ್ರಗತಿ',
      start_class: 'ತರಗತಿಯನ್ನು ಪ್ರಾರಂಭಿಸಿ', end_class: 'ತರಗತಿಯನ್ನು ಮುಗಿಸಿ', scan_qr: 'QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ', marked_present: 'ಹಾಜರಾತಿ ದಾಖಲಾಗಿದೆ!', qr_expired: 'QR ಅವಧಿ ಮುಗಿದಿದೆ.', students_present: 'ಹಾಜರಾದ ವಿದ್ಯಾರ್ಥಿಗಳು', attendance_history: 'ಹಾಜರಾತಿ ಇತಿಹಾಸ',
      generate_timetable: 'ವೇಳಾಪಟ್ಟಿಯನ್ನು ರಚಿಸಿ', weekly_schedule: 'ಸಾಪ್ತಾಹಿಕ ವೇಳಾಪಟ್ಟಿ', add_subject: 'ವಿಷಯ ಸೇರಿಸಿ', add_teacher: 'ಶಿಕ್ಷಕರನ್ನು ಸೇರಿಸಿ',
      career_quiz: 'ವೃತ್ತಿ ರಸಪ್ರಶ್ನೆ', start_quiz: 'ರಸಪ್ರಶ್ನೆ ಪ್ರಾರಂಭಿಸಿ', your_result: 'ನಿಮ್ಮ ವೃತ್ತಿ', retake_quiz: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
      chat_placeholder: 'ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ...', send: 'ಕಳುಹಿಸಿ', clear_chat: 'ಚಾಟ್ ಅಳಿಸಿ',
      chatbot_subtitle: 'Groq LLaMA 3.3-70B ನಿಂದ ನಡೆಸಲ್ಪಡುತ್ತಿದೆ · NCERT ಟ್ಯೂಟರ್', chatbot_welcome: 'ನಮಸ್ತೆ! 🙏 ನಾನು ನಿಮ್ಮ AI ಟ್ಯೂಟರ್. ನಾನು ನಿಮಗೆ NCERT ವಿಷಯಗಳು (ತರಗತಿಗಳು IV-X), ಪರೀಕ್ಷೆಯ ತಯಾರಿ ಮತ್ತು ಹೆಚ್ಚಿನವುಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ಇಂದು ನೀವು ಏನನ್ನು ಕಲಿಯಲು ಬಯಸುತ್ತೀರಿ?', try_asking: 'ಇದನ್ನು ಕೇಳಲು ಪ್ರಯತ್ನಿಸಿ:',
      suggested_1: 'ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆಯನ್ನು ಸರಳ ಪದಗಳಲ್ಲಿ ವಿವರಿಸಿ', suggested_2: 'ತ್ರಿಕೋನದ ಗುಣಲಕ್ಷಣಗಳು ಯಾವುವು?', suggested_3: 'ನನ್ನ ವಿಜ್ಞಾನ ಪರೀಕ್ಷೆಗೆ ನಾನು ಹೇಗೆ ತಯಾರಿ ನಡೆಸಬೇಕು?', suggested_4: 'ವೇಗ ಮತ್ತು ವೆಲಾಸಿಟಿ ನಡುವಿನ ವ್ಯತ್ಯಾಸವೇನು?', suggested_5: 'ಫ್ರೆಂಚ್ ಕ್ರಾಂತಿಯ ಬಗ್ಗೆ ನನಗೆ ಹೇಳಿ',
      loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...', error: 'ದೋಷ ಸಂಭವಿಸಿದೆ', save: 'ಉಳಿಸಿ', cancel: 'ರದ್ದುಗೊಳಿಸಿ', submit: 'ಸಲ್ಲಿಸಿ', back: 'ಹಿಂದೆ', next: 'ಮುಂದೆ', done: 'ಮುಗಿದಿದೆ', view_all: 'ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ', coming_soon: 'ಶೀಘ್ರದಲ್ಲೇ ಬರಲಿದೆ'
    }
  },
  mr: {
    translation: {
      dashboard: 'डॅशबोर्ड', learning: 'शिक्षण', attendance: 'उपस्थिती', timetable: 'वेळापत्रक', career: 'करिअर', chatbot: 'AI शिक्षक', logout: 'लॉग आउट',
      welcome_back: 'परत स्वागत आहे!', sign_in: 'साइन इन करा', create_account_desc: 'तुमचा शिकण्याचा प्रवास सुरू करा', email: 'ईमेल', password: 'पासवर्ड', login: 'लॉगिन', register: 'खाते तयार करा', name: 'पूर्ण नाव', role: 'मी आहे', student: 'विद्यार्थी', teacher: 'शिक्षक', grade: 'इयत्ता', already_account: 'आधीच खाते आहे?', no_account: 'खाते नाही?', school: 'श्री कुमारन शाळा',
      next_gen_education: 'नेक्स्ट-जेन एज्युकेशन', empower_your: 'सशक्त करा ', learning_journey: 'तुमचा शिकण्याचा प्रवास', hero_subtitle: 'AI, NCERT लायब्ररी आणि स्मार्ट गेमिफिकेशनसह शिक्षणाच्या भविष्याचा अनुभव घ्या.', feature_library: 'परस्परसंवादी लायब्ररी', feature_ai: 'AI सहाय्यक', feature_career: 'करिअर मार्गदर्शन',
      good_morning: 'शुभ सकाळ', good_afternoon: 'शुभ दुपार', good_evening: 'शुभ संध्याकाळ', todays_schedule: 'आजचे वेळापत्रक', quick_actions: 'त्वरित क्रिया', recent_progress: 'अलीकडील प्रगती', no_classes_today: 'आज कोणतेही वर्ग नाहीत',
      ncert_library: 'NCERT लायब्ररी', select_grade: 'इयत्ता निवडा', select_subject: 'विषय निवडा', select_chapter: 'धडा निवडा', open_chapter: 'धडा उघडा', ask_ai: 'AI ला विचारा', chapter_progress: 'प्रगती',
      start_class: 'वर्ग सुरू करा', end_class: 'वर्ग संपवा', scan_qr: 'QR स्कॅन करा', marked_present: 'उपस्थिती नोंदवली गेली!', qr_expired: 'QR कालबाह्य झाला.', students_present: 'उपस्थित विद्यार्थी', attendance_history: 'उपस्थिती इतिहास',
      generate_timetable: 'वेळापत्रक तयार करा', weekly_schedule: 'साप्ताहिक वेळापत्रक', add_subject: 'विषय जोडा', add_teacher: 'शिक्षक जोडा',
      career_quiz: 'करिअर प्रश्नमंजुषा', start_quiz: 'प्रश्नमंजुषा सुरू करा', your_result: 'तुमचे करिअर', retake_quiz: 'पुन्हा प्रयत्न करा',
      chat_placeholder: 'काहीही विचारा...', send: 'पाठवा', clear_chat: 'चॅट साफ करा',
      chatbot_subtitle: 'Groq LLaMA 3.3-70B द्वारे समर्थित · NCERT ट्यूटर', chatbot_welcome: 'नमस्ते! 🙏 मी तुमचा AI ट्यूटर आहे. मी तुम्हाला NCERT विषय (इयत्ता IV-X), परीक्षेची तयारी आणि इतर गोष्टींमध्ये मदत करू शकतो. आज तुम्हाला काय शिकायला आवडेल?', try_asking: 'विचारून पहा:',
      suggested_1: 'प्रकाशसंश्लेषण सोप्या शब्दांत स्पष्ट करा', suggested_2: 'त्रिकोणाचे गुणधर्म काय आहेत?', suggested_3: 'मी माझ्या विज्ञान परीक्षेची तयारी कशी करू?', suggested_4: 'गती आणि वेग (velocity) मध्ये काय फरक आहे?', suggested_5: 'मला फ्रेंच राज्यक्रांतीबद्दल सांगा',
      loading: 'लोड होत आहे...', error: 'काहीतरी चूक झाली', save: 'जतन करा', cancel: 'रद्द करा', submit: 'सबमिट करा', back: 'मागे', next: 'पुढे', done: 'पूर्ण झाले', view_all: 'सर्व पहा', coming_soon: 'लवकरच येत आहे'
    }
  },
  bn: {
    translation: {
      dashboard: 'ড্যাশবোর্ড', learning: 'শেখা', attendance: 'উপস্থিতি', timetable: 'রুটিন', career: 'পেশা', chatbot: 'এআই টিউটর', logout: 'লগ আউট',
      welcome_back: 'আবার স্বাগতম!', sign_in: 'সাইন ইন করুন', create_account_desc: 'আপনার শেখার যাত্রা শুরু করুন', email: 'ইমেইল', password: 'পাসওয়ার্ড', login: 'লগইন', register: 'অ্যাকাউন্ট তৈরি করুন', name: 'পুরো নাম', role: 'আমি একজন', student: 'ছাত্র', teacher: 'শিক্ষক', grade: 'শ্রেণী', already_account: 'অ্যাকাউন্ট আছে?', no_account: 'অ্যাকাউন্ট নেই?', school: 'শ্রী কুমারন স্কুল',
      next_gen_education: 'পরবর্তী প্রজন্মের শিক্ষা', empower_your: 'ক্ষমতায়ন করুন ', learning_journey: 'আপনার শেখার যাত্রা', hero_subtitle: 'এআই, এনসিইআরটি লাইব্রেরি এবং স্মার্ট গ্যামিফিকেশনের মাধ্যমে শিক্ষার ভবিষ্যতের অভিজ্ঞতা নিন।', feature_library: 'ইন্টারেক্টিভ লাইব্রেরি', feature_ai: 'এআই সহকারী', feature_career: 'পেশাগত নির্দেশিকা',
      good_morning: 'সুপ্রভাত', good_afternoon: 'শুভ অপরাহ্ন', good_evening: 'শুভ সন্ধ্যা', todays_schedule: 'আজকের রুটিন', quick_actions: 'দ্রুত পদক্ষেপ', recent_progress: 'সাম্প্রতিক অগ্রগতি', no_classes_today: 'আজ কোন ক্লাস নেই',
      ncert_library: 'NCERT লাইব্রেরি', select_grade: 'শ্রেণী নির্বাচন করুন', select_subject: 'বিষয় নির্বাচন করুন', select_chapter: 'অধ্যায় নির্বাচন করুন', open_chapter: 'অধ্যায় খুলুন', ask_ai: 'AI কে জিজ্ঞাসা করুন', chapter_progress: 'অগ্রগতি',
      start_class: 'ক্লাস শুরু করুন', end_class: 'ক্লাস শেষ করুন', scan_qr: 'QR স্ক্যান করুন', marked_present: 'উপস্থিতি রেকর্ড করা হয়েছে!', qr_expired: 'QR মেয়াদ শেষ।', students_present: 'উপস্থিত ছাত্র', attendance_history: 'উপস্থিতির ইতিহাস',
      generate_timetable: 'রুটিন তৈরি করুন', weekly_schedule: 'সাপ্তাহিক রুটিন', add_subject: 'বিষয় যোগ করুন', add_teacher: 'শিক্ষক যোগ করুন',
      career_quiz: 'পেশা ক্যুইজ', start_quiz: 'ক্যুইজ শুরু করুন', your_result: 'আপনার পেশা', retake_quiz: 'আবার চেষ্টা করুন',
      chat_placeholder: 'যেকোনো কিছু জিজ্ঞাসা করুন...', send: 'পাঠান', clear_chat: 'চ্যাট মুছুন',
      chatbot_subtitle: 'Groq LLaMA 3.3-70B দ্বারা চালিত · NCERT টিউটর', chatbot_welcome: 'নমস্তে! 🙏 আমি আপনার AI টিউটর। আমি আপনাকে NCERT বিষয় (চতুর্থ-দশম শ্রেণী), পরীক্ষার প্রস্তুতি এবং আরও অনেক কিছুতে সাহায্য করতে পারি। আজ আপনি কী শিখতে চান?', try_asking: 'জিজ্ঞাসা করার চেষ্টা করুন:',
      suggested_1: 'সালোকসংশ্লেষণ সহজ কথায় ব্যাখ্যা করুন', suggested_2: 'একটি ত্রিভুজের বৈশিষ্ট্যগুলি কী কী?', suggested_3: 'আমি আমার বিজ্ঞান পরীক্ষার জন্য কীভাবে প্রস্তুতি নেব?', suggested_4: 'দ্রুতি (speed) এবং বেগের (velocity) মধ্যে পার্থক্য কী?', suggested_5: 'ফরাসি বিপ্লব সম্পর্কে আমাকে বলুন',
      loading: 'লোড হচ্ছে...', error: 'কিছু ভুল হয়েছে', save: 'সংরক্ষণ করুন', cancel: 'বাতিল করুন', submit: 'জমা দিন', back: 'পিছনে', next: 'পরবর্তী', done: 'সম্পন্ন', view_all: 'সব দেখুন', coming_soon: 'শীঘ্রই আসছে'
    }
  },
  gu: {
    translation: {
      dashboard: 'ડેશબોર્ડ', learning: 'શીખવું', attendance: 'હાજરી', timetable: 'ટાઇમટેબલ', career: 'કારકિર્દી', chatbot: 'AI શિક્ષક', logout: 'લોગ આઉટ',
      welcome_back: 'ફરી સ્વાગત છે!', sign_in: 'સાઇન ઇન કરો', create_account_desc: 'તમારી શીખવાની યાત્રા શરૂ કરો', email: 'ઇમેઇલ', password: 'પાસવર્ડ', login: 'લોગિન', register: 'એકાઉન્ટ બનાવો', name: 'પૂરું નામ', role: 'હું છું', student: 'વિદ્યાર્થી', teacher: 'શિક્ષક', grade: 'ધોરણ', already_account: 'પહેલેથી એકાઉન્ટ છે?', no_account: 'એકાઉન્ટ નથી?', school: 'શ્રી કુમારન શાળા',
      next_gen_education: 'નેક્સ્ટ-જેન શિક્ષણ', empower_your: 'સશક્ત કરો ', learning_journey: 'તમારી શીખવાની યાત્રા', hero_subtitle: 'AI, NCERT લાઇબ્રેરીઓ અને સ્માર્ટ ગેમિફિકેશન સાથે શિક્ષણના ભવિષ્યનો અનુભવ કરો.', feature_library: 'ઇન્ટરેક્ટિવ લાઇબ્રેરી', feature_ai: 'AI સહાયક', feature_career: 'કારકિર્દી માર્ગદર્શન',
      good_morning: 'શુભ સવાર', good_afternoon: 'શુભ બપોર', good_evening: 'શુભ સાંજ', todays_schedule: 'આજનું સમયપત્રક', quick_actions: 'ત્વરિત ક્રિયાઓ', recent_progress: 'તાજેતરની પ્રગતિ', no_classes_today: 'આજે કોઈ વર્ગો નથી',
      ncert_library: 'NCERT લાઇબ્રેરી', select_grade: 'ધોરણ પસંદ કરો', select_subject: 'વિષય પસંદ કરો', select_chapter: 'પ્રકરણ પસંદ કરો', open_chapter: 'પ્રકરણ ખોલો', ask_ai: 'AI ને પૂછો', chapter_progress: 'પ્રગતિ',
      start_class: 'વર્ગ શરૂ કરો', end_class: 'વર્ગ સમાપ્ત કરો', scan_qr: 'QR સ્કેન કરો', marked_present: 'હાજરી નોંધાઈ ગઈ!', qr_expired: 'QR ની સમયસીમા સમાપ્ત થઈ ગઈ.', students_present: 'હાજર વિદ્યાર્થીઓ', attendance_history: 'હાજરીનો ઇતિહાસ',
      generate_timetable: 'ટાઇમટેબલ બનાવો', weekly_schedule: 'સાપ્તાહિક ટાઇમટેબલ', add_subject: 'વિષય ઉમેરો', add_teacher: 'શિક્ષક ઉમેરો',
      career_quiz: 'કારકિર્દી ક્વિઝ', start_quiz: 'ક્વિઝ શરૂ કરો', your_result: 'તમારી કારકિર્દી', retake_quiz: 'ફરી પ્રયાસ કરો',
      chat_placeholder: 'કંઈપણ પૂછો...', send: 'મોકલો', clear_chat: 'ચેટ સાફ કરો',
      chatbot_subtitle: 'Groq LLaMA 3.3-70B દ્વારા સંચાલિત · NCERT ટ્યુટર', chatbot_welcome: 'નમસ્તે! 🙏 હું તમારો AI ટ્યુટર છું. હું તમને NCERT વિષયો (ધોરણ IV-X), પરીક્ષાની તૈયારી અને વધુમાં મદદ કરી શકું છું. આજે તમે શું શીખવા માંગો છો?', try_asking: 'પૂછવાનો પ્રયાસ કરો:',
      suggested_1: 'પ્રકાશસંશ્લેષણને સરળ શબ્દોમાં સમજાવો', suggested_2: 'ત્રિકોણના ગુણધર્મો શું છે?', suggested_3: 'હું મારી વિજ્ઞાન પરીક્ષા માટે કેવી રીતે તૈયારી કરું?', suggested_4: 'ઝડપ અને વેગ વચ્ચે શું તફાવત છે?', suggested_5: 'મને ફ્રેન્ચ ક્રાંતિ વિશે કહો',
      loading: 'લોડ થઈ રહ્યું છે...', error: 'કંઈક ખોટું થયું', save: 'સાચવો', cancel: 'રદ કરો', submit: 'સબમિટ કરો', back: 'પાછળ', next: 'આગળ', done: 'થઈ ગયું', view_all: 'બધું જુઓ', coming_soon: 'ટૂંક સમયમાં આવી રહ્યું છે'
    }
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('gs-lang') || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })

export const changeLanguage = (lang) => {
  i18n.changeLanguage(lang)
  localStorage.setItem('gs-lang', lang)
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English',    nativeName: 'English' },
  { code: 'hi', name: 'Hindi',      nativeName: 'हिन्दी' },
  { code: 'ta', name: 'Tamil',      nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu',     nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada',    nativeName: 'ಕನ್ನಡ' },
  { code: 'mr', name: 'Marathi',    nativeName: 'मराठी' },
  { code: 'bn', name: 'Bengali',    nativeName: 'বাংলা' },
  { code: 'gu', name: 'Gujarati',   nativeName: 'ગુજરાતી' },
]

export default i18n
