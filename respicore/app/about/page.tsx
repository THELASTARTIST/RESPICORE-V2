// app/about/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type Lang = "en" | "hi" | "bn";

const T: Record<Lang, Record<string, string>> = {
  en: {
    heroChip: "Our story",
    heroTitle: 'From a <em>broken stethoscope</em><br>to a pocket clinic',
    heroSub: "RespiCore was born from a simple frustration — that millions lack access to basic respiratory screening. We asked: what if a smartphone could do what a stethoscope does, without the cloud, without the cost?",
    scrollHint: "SCROLL TO EXPLORE",
    tlLabel: "The journey", tlTitle: "How RespiCore came to life",
    tlSub: "From an idea scribbled on a napkin to a working AI triage system.",
    tl1month: "Month 01", tl1head: "The spark",
    tl1body: "Our team member's grandmother was misdiagnosed due to a faulty stethoscope in a rural clinic. That moment of helplessness became our driving question — can a smartphone replace the hardware entirely?",
    tl2month: "Month 02", tl2head: "Research deep-dive",
    tl2body: "We devoured 40+ papers on acoustic respiratory diagnostics, explored COUGHVID and Project Coswara datasets, and confirmed that Mel-spectrograms could encode clinically meaningful patterns invisible to the eye.",
    tl3month: "Month 03", tl3head: "First working model",
    tl3body: "After 200+ failed training runs, a fine-tuned MobileNetV2 achieved 89% accuracy on held-out data. The team celebrated at 3 AM over instant noodles. The model ran on a 5-year-old Android phone in under 50ms.",
    tl4month: "Month 04", tl4head: "Flutter app & integration",
    tl4body: "Built the cross-platform Flutter UI, integrated the TFLite model on-device, added the SQLite reporting layer and waveform visualizer. First end-to-end pipeline test — record, process, classify — in a single breath.",
    tl5month: "Today", tl5head: "Hackathon demo",
    tl5body: "A production-grade acoustic triage system running entirely on a smartphone. 100% offline. 4.2 MB model. Sub-50ms inference. No patient data ever transmitted. Presented here at the hackathon stage.",
    teamLabel: "The builders", teamTitle: "Who we are",
    teamSub: "A multidisciplinary team of engineers united by one mission — democratising respiratory screening.",
    t1name: "Adhrikto", t1role: "ML Lead · Model Architect",
    t1bio: "Designed the MobileNetV2 training pipeline, spectral preprocessing, and INT8 quantization strategy. Drove 200+ training runs to achieve 89% AUC on 4-class respiratory classification.",
    t2name: "Aarushi", t2role: "Mobile Lead · Flutter Engineer",
    t2bio: "Built the cross-platform Flutter app from scratch — audio capture, real-time waveform rendering, tflite_flutter inference binding, and the full SQLite reporting layer.",
    t3name: "Rajdeep", t3role: "Data Engineer · Research",
    t3bio: "Curated and cleaned the COUGHVID and Coswara datasets, designed the augmentation strategy, and built the preprocessing pipeline with spectral gating.",
    t4name: "Sneha", t4role: "UI/UX Lead · Frontend Engineer",
    t4bio: "Crafted the end-to-end visual design system — from the dark-mode UI language to the animated waveform dashboard — ensuring a clinical yet approachable user experience.",
    cmpLabel: "Competitive landscape", cmpTitle: "How we compare",
    cmpSub: "RespiCore vs existing respiratory screening tools across the metrics that matter for real-world deployment.",
    c1title: "Model accuracy (%)", c1sub: "4-CLASS RESPIRATORY CLASSIFICATION", c1win: "RespiCore leads",
    c2title: "Model size (MB)", c2sub: "SMALLER IS BETTER FOR MOBILE DEPLOYMENT", c2win: "Most compact model",
    c3title: "Inference latency (ms)", c3sub: "ON SNAPDRAGON 680 — LOWER IS BETTER", c3win: "Fastest on-device",
    c4title: "Privacy score", c4sub: "BASED ON DATA TRANSMISSION AUDIT", c4win: "Zero data transmission",
    ctTitle: "Feature comparison", ctSub: "RESPICORE VS COMPETING TOOLS",
    thFeature: "Feature",
    f1: "Fully offline / on-device", f2: "No hardware add-on required",
    f3: "Open source / hackable", f4: "Multi-condition classification",
    f5: "Free to use", f6: "Android + iOS", f7: "Patient data stored locally",
    whyLabel: "Why it matters", whyTitle: "The problem we're solving",
    s1lbl: "People lack access to a doctor", s2lbl: "Deaths/year from COPD alone", s3lbl: "Smartphones in the world",
    quoteText: '"If every smartphone is a potential stethoscope, then access to respiratory screening is no longer a privilege of geography or wealth."',
    quoteAttr: "— RespiCore Team, 2026",
    privLabel: "Privacy by design", privTitle: "Your data never leaves your phone",
    privSub: "Every architectural decision was made with patient privacy as a hard constraint, not an afterthought.",
    p1t: "Zero network calls", p1d: "The app makes exactly zero outbound network requests during inference. No telemetry, no analytics ping, no model download. Verified with a network traffic audit.",
    p2t: "On-device model only", p2d: "The 4.2 MB TFLite model ships inside the app binary. Inference runs in the device RAM. The audio file never leaves the sandbox.",
    p3t: "Local SQLite storage", p3d: "All triage reports are written to an encrypted SQLite database on the device. No cloud sync, no backup to third-party servers.",
    p4t: "No patient identifiers", p4d: "The app collects zero PII. No name, age, or location is required. Reports are identified only by timestamp and a local UUID.",
    backBtn: "Back to App",
  },
  hi: {
    heroChip: "हमारी कहानी",
    heroTitle: 'एक <em>टूटे स्टेथोस्कोप</em><br>से जेब के क्लिनिक तक',
    heroSub: "RespiCore एक सरल निराशा से जन्मा — लाखों लोगों को बुनियादी श्वसन जांच की सुविधा नहीं मिलती। हमने पूछा: क्या एक स्मार्टफोन क्लाउड और लागत के बिना वही काम कर सकता है जो स्टेथोस्कोप करता है?",
    scrollHint: "नीचे स्क्रॉल करें",
    tlLabel: "यात्रा", tlTitle: "RespiCore कैसे बना", tlSub: "एक नैपकिन पर लिखे विचार से एक काम करने वाली AI ट्राइज प्रणाली तक।",
    tl1month: "महीना 01", tl1head: "प्रेरण",
    tl1body: "हमारी टीम के एक सदस्य की दादी को एक ग्रामीण क्लिनिक में खराब स्टेथोस्कोप के कारण गलत निदान मिला। उस असहाय क्षण ने हमें प्रेरित किया — क्या स्मार्टफोन पूरी तरह हार्डवेयर की जगह ले सकता है?",
    tl2month: "महीना 02", tl2head: "गहरा शोध",
    tl2body: "हमने ध्वनिक श्वसन निदान पर 40+ शोध पत्र पढ़े, COUGHVID और Project Coswara डेटासेट का अध्ययन किया, और पुष्टि की कि Mel-spectrograms चिकित्सकीय रूप से सार्थक पैटर्न एनकोड कर सकते हैं।",
    tl3month: "महीना 03", tl3head: "पहला काम करने वाला मॉडल",
    tl3body: "200+ असफल प्रशिक्षण के बाद, MobileNetV2 ने 89% सटीकता हासिल की। टीम ने रात 3 बजे इंस्टेंट नूडल्स के साथ जश्न मनाया। मॉडल 5 साल पुराने Android फोन पर 50ms में चला।",
    tl4month: "महीना 04", tl4head: "Flutter ऐप और एकीकरण",
    tl4body: "क्रॉस-प्लेटफॉर्म Flutter UI बनाया, TFLite मॉडल को डिवाइस पर एकीकृत किया, SQLite रिपोर्टिंग और वेवफॉर्म विज़ुअलाइज़र जोड़े। पहला एंड-टू-एंड पाइपलाइन परीक्षण।",
    tl5month: "आज", tl5head: "हैकाथॉन डेमो",
    tl5body: "पूरी तरह स्मार्टफोन पर चलने वाला प्रोडक्शन-ग्रेड ध्वनिक ट्राइज सिस्टम। 100% ऑफलाइन। 4.2 MB मॉडल। 50ms से कम इन्फरेंस। कोई मरीज डेटा प्रसारित नहीं।",
    teamLabel: "निर्माता", teamTitle: "हम कौन हैं",
    teamSub: "एक बहु-विषयक इंजीनियरिंग टीम जो एक मिशन से जुड़ी है — श्वसन जांच को सभी के लिए सुलभ बनाना।",
    t1name: "अधृक्त", t1role: "ML लीड · मॉडल आर्किटेक्ट",
    t1bio: "MobileNetV2 प्रशिक्षण पाइपलाइन, स्पेक्ट्रल प्रीप्रोसेसिंग और INT8 क्वांटाइज़ेशन रणनीति डिज़ाइन की।",
    t2name: "आरुषि", t2role: "मोबाइल लीड · Flutter इंजीनियर",
    t2bio: "शुरू से Flutter ऐप बनाया — ऑडियो कैप्चर, रियल-टाइम वेवफॉर्म, TFLite इन्फरेंस और SQLite रिपोर्टिंग।",
    t3name: "राजदीप", t3role: "डेटा इंजीनियर · रिसर्च",
    t3bio: "COUGHVID और Coswara डेटासेट क्यूरेट किए, ऑगमेंटेशन रणनीति डिज़ाइन की और स्पेक्ट्रल गेटिंग के साथ प्रीप्रोसेसिंग पाइपलाइन बनाई।",
    t4name: "स्नेहा", t4role: "UI/UX लीड · फ्रंटएंड इंजीनियर",
    t4bio: "डार्क-मोड UI से एनिमेटेड वेवफॉर्म डैशबोर्ड तक पूरा विजुअल डिज़ाइन सिस्टम तैयार किया।",
    cmpLabel: "प्रतिस्पर्धी परिदृश्य", cmpTitle: "हम कैसे तुलना करते हैं", cmpSub: "वास्तविक दुनिया में तैनाती के लिए महत्वपूर्ण मेट्रिक्स में RespiCore बनाम मौजूदा टूल।",
    c1title: "मॉडल सटीकता (%)", c1sub: "4-क्लास श्वसन वर्गीकरण", c1win: "RespiCore आगे",
    c2title: "मॉडल आकार (MB)", c2sub: "मोबाइल के लिए छोटा बेहतर", c2win: "सबसे कॉम्पैक्ट मॉडल",
    c3title: "इन्फरेंस विलंबता (ms)", c3sub: "कम बेहतर", c3win: "सबसे तेज़ ऑन-डिवाइस",
    c4title: "गोपनीयता स्कोर", c4sub: "डेटा ट्रांसमिशन ऑडिट", c4win: "शून्य डेटा ट्रांसमिशन",
    ctTitle: "फीचर तुलना", ctSub: "RESPICORE बनाम प्रतिस्पर्धी",
    thFeature: "फीचर",
    f1: "पूरी तरह ऑफलाइन", f2: "कोई हार्डवेयर ऐड-ऑन नहीं",
    f3: "ओपन सोर्स", f4: "मल्टी-कंडीशन वर्गीकरण",
    f5: "मुफ्त उपयोग", f6: "Android + iOS", f7: "स्थानीय डेटा संग्रहण",
    whyLabel: "यह क्यों महत्वपूर्ण है", whyTitle: "हम क्या समस्या हल कर रहे हैं",
    s1lbl: "लोग डॉक्टर तक पहुंच से वंचित", s2lbl: "COPD से वार्षिक मृत्यु", s3lbl: "दुनिया में स्मार्टफोन",
    quoteText: '"यदि हर स्मार्टफोन एक संभावित स्टेथोस्कोप है, तो श्वसन जांच तक पहुंच अब भूगोल या धन का विशेषाधिकार नहीं है।"',
    quoteAttr: "— RespiCore टीम, 2026",
    privLabel: "डिज़ाइन में गोपनीयता", privTitle: "आपका डेटा आपके फोन से बाहर नहीं जाता",
    privSub: "हर आर्किटेक्चरल निर्णय मरीज की गोपनीयता को एक कठोर बाधा के रूप में रखकर लिया गया।",
    p1t: "शून्य नेटवर्क कॉल", p1d: "ऐप इन्फरेंस के दौरान बिल्कुल शून्य आउटबाउंड नेटवर्क अनुरोध करता है। कोई टेलीमेट्री नहीं, कोई एनालिटिक्स नहीं।",
    p2t: "केवल ऑन-डिवाइस मॉडल", p2d: "4.2 MB TFLite मॉडल ऐप बाइनरी के अंदर है। ऑडियो फ़ाइल कभी सैंडबॉक्स नहीं छोड़ती।",
    p3t: "स्थानीय SQLite संग्रहण", p3d: "सभी ट्राइज रिपोर्ट डिवाइस पर एक एन्क्रिप्टेड SQLite डेटाबेस में लिखी जाती हैं।",
    p4t: "कोई मरीज पहचानकर्ता नहीं", p4d: "ऐप कोई PII एकत्र नहीं करता। कोई नाम, उम्र, या स्थान आवश्यक नहीं।",
    backBtn: "ऐप पर वापस",
  },
  bn: {
    heroChip: "আমাদের গল্প",
    heroTitle: 'একটি <em>ভাঙা স্টেথোস্কোপ</em><br>থেকে পকেট ক্লিনিক',
    heroSub: "RespiCore জন্ম নিয়েছে একটি সরল হতাশা থেকে — লক্ষ লক্ষ মানুষের শ্বাসযন্ত্রের মৌলিক পরীক্ষা করার সুযোগ নেই। আমরা জিজ্ঞেস করলাম: ক্লাউড ছাড়া, খরচ ছাড়া একটি স্মার্টফোন কি স্টেথোস্কোপের কাজ করতে পারে?",
    scrollHint: "নিচে স্ক্রোল করুন",
    tlLabel: "যাত্রা", tlTitle: "RespiCore কীভাবে জীবন পেল", tlSub: "ন্যাপকিনে লেখা ধারণা থেকে একটি কার্যকর AI ট্রাইয়াজ সিস্টেম পর্যন্ত।",
    tl1month: "মাস ০১", tl1head: "অনুপ্রেরণ",
    tl1body: "আমাদের দলের একজনের দাদি একটি গ্রামীণ ক্লিনিকে ত্রুটিপূর্ণ স্টেথোস্কোপের কারণে ভুল নির্ণয় পেয়েছিলেন। সেই অসহায়ত্বের মুহূর্তটি আমাদের প্রশ্নে পরিণত হলো — স্মার্টফোন কি সম্পূর্ণভাবে হার্ডওয়্যার প্রতিস্থাপন করতে পারে?",
    tl2month: "মাস ০২", tl2head: "গবেষণায় ডুব",
    tl2body: "আমরা ৪০টিরও বেশি গবেষণাপত্র পড়েছি, COUGHVID এবং Project Coswara ডেটাসেট অন্বেষণ করেছি, এবং নিশ্চিত করেছি যে Mel-spectrograms চিকিৎসাগতভাবে অর্থবহ প্যাটার্ন এনকোড করতে পারে।",
    tl3month: "মাস ০৩", tl3head: "প্রথম কার্যকর মডেল",
    tl3body: "২০০টিরও বেশি ব্যর্থ প্রশিক্ষণের পরে, MobileNetV2 ৮৯% নির্ভুলতা অর্জন করেছে। দল রাত ৩টায় ইনস্ট্যান্ট নুডলস নিয়ে উদযাপন করেছে। মডেলটি ৫ বছরের পুরানো Android ফোনে ৫০ms-এ চলেছে।",
    tl4month: "মাস ০৪", tl4head: "Flutter অ্যাপ ও একীভূতকরণ",
    tl4body: "ক্রস-প্ল্যাটফর্ম Flutter UI তৈরি করা হয়েছে, TFLite মডেল ডিভাইসে একীভূত করা হয়েছে, SQLite রিপোর্টিং এবং ওয়েভফর্ম ভিজ্যুয়ালাইজার যোগ করা হয়েছে।",
    tl5month: "আজ", tl5head: "হ্যাকাথন ডেমো",
    tl5body: "সম্পূর্ণ স্মার্টফোনে চলা প্রোডাকশন-গ্রেড অ্যাকুস্টিক ট্রাইয়াজ সিস্টেম। ১০০% অফলাইন। ৪.২ MB মডেল। ৫০ms-এর কম ইনফারেন্স। কোনো রোগীর ডেটা কখনো প্রেরিত হয় না।",
    teamLabel: "নির্মাতারা", teamTitle: "আমরা কারা",
    teamSub: "একটি বহু-বিষয়ক প্রকৌশল দল যারা একটি লক্ষ্যে একত্রিত — শ্বাসযন্ত্রের স্ক্রিনিং সবার জন্য সুলভ করা।",
    t1name: "অধৃক্ত", t1role: "ML প্রধান · মডেল আর্কিটেক্ট",
    t1bio: "MobileNetV2 প্রশিক্ষণ পাইপলাইন, স্পেকট্রাল প্রিপ্রসেসিং এবং INT8 কোয়ান্টাইজেশন কৌশল ডিজাইন করেছেন।",
    t2name: "আরুষি", t2role: "মোবাইল প্রধান · Flutter প্রকৌশলী",
    t2bio: "শুরু থেকে Flutter অ্যাপ তৈরি করেছেন — অডিও ক্যাপচার, রিয়েল-টাইম ওয়েভফর্ম, TFLite ইনফারেন্স বাইন্ডিং এবং SQLite রিপোর্টিং।",
    t3name: "রাজদীপ", t3role: "ডেটা প্রকৌশলী · গবেষণা",
    t3bio: "COUGHVID এবং Coswara ডেটাসেট কিউরেট করেছেন, অগমেন্টেশন কৌশল ডিজাইন করেছেন এবং স্পেকট্রাল গেটিং সহ প্রিপ্রসেসিং পাইপলাইন তৈরি করেছেন।",
    t4name: "স্নেহা", t4role: "UI/UX প্রধান · ফ্রন্টএন্ড প্রকৌশলী",
    t4bio: "ডার্ক-মোড UI থেকে অ্যানিমেটেড ওয়েভফর্ম ড্যাশবোর্ড পর্যন্ত সম্পূর্ণ ভিজ্যুয়াল ডিজাইন সিস্টেম তৈরি করেছেন।",
    cmpLabel: "প্রতিযোগিতামূলক পরিদৃশ্য", cmpTitle: "আমরা কীভাবে তুলনা করি", cmpSub: "বাস্তব-বিশ্বের মোতায়েনের জন্য গুরুত্বপূর্ণ মেট্রিক্সে RespiCore বনাম বিদ্যমান টুল।",
    c1title: "মডেল নির্ভুলতা (%)", c1sub: "৪-ক্লাস শ্বাসযন্ত্র শ্রেণীবিভাগ", c1win: "RespiCore এগিয়ে",
    c2title: "মডেল আকার (MB)", c2sub: "মোবাইলের জন্য ছোট ভালো", c2win: "সবচেয়ে কম্প্যাক্ট মডেল",
    c3title: "ইনফারেন্স বিলম্ব (ms)", c3sub: "কম ভালো", c3win: "দ্রুততম অন-ডিভাইস",
    c4title: "গোপনীয়তা স্কোর", c4sub: "ডেটা ট্রান্সমিশন অডিট", c4win: "শূন্য ডেটা ট্রান্সমিশন",
    ctTitle: "ফিচার তুলনা", ctSub: "RespiCore বনাম প্রতিযোগী",
    thFeature: "ফিচার",
    f1: "সম্পূর্ণ অফলাইন", f2: "কোনো হার্ডওয়্যার অ্যাড-অন নেই",
    f3: "ওপেন সোর্স", f4: "মাল্টি-কন্ডিশন শ্রেণীবিভাগ",
    f5: "বিনামূল্যে ব্যবহার", f6: "Android + iOS", f7: "স্থানীয় ডেটা সংরক্ষণ",
    whyLabel: "কেন গুরুত্বপূর্ণ", whyTitle: "আমরা কোন সমস্যা সমাধান করছি",
    s1lbl: "মানুষ ডাক্তারের কাছে যেতে পারছে না", s2lbl: "COPD-এ বার্ষিক মৃত্যু", s3lbl: "বিশ্বে স্মার্টফোন",
    quoteText: '"যদি প্রতিটি স্মার্টফোন একটি সম্ভাব্য স্টেথোস্কোপ হয়, তাহলে শ্বাসযন্ত্রের স্ক্রিনিং আর ভূগোল বা সম্পদের বিশেষাধিকার নয়।"',
    quoteAttr: "— RespiCore দল, ২০২৬",
    privLabel: "ডিজাইনে গোপনীয়তা", privTitle: "আপনার ডেটা আপনার ফোন ছাড়ে না",
    privSub: "প্রতিটি আর্কিটেকচারাল সিদ্ধান্ত রোগীর গোপনীয়তাকে একটি কঠোর সীমাবদ্ধতা হিসেবে রেখে নেওয়া হয়েছে।",
    p1t: "শূন্য নেটওয়ার্ক কল", p1d: "অ্যাপটি ইনফারেন্সের সময় ঠিক শূন্য আউটবাউন্ড নেটওয়ার্ক অনুরোধ করে। কোনো টেলিমেট্রি নেই।",
    p2t: "শুধুমাত্র অন-ডিভাইস মডেল", p2d: "৪.২ MB TFLite মডেল অ্যাপ বাইনারির মধ্যে আছে। অডিও ফাইল কখনো স্যান্ডবক্স ছেড়ে যায় না।",
    p3t: "স্থানীয় SQLite সংরক্ষণ", p3d: "সমস্ত ট্রাইয়াজ রিপোর্ট ডিভাইসে একটি এনক্রিপ্টেড SQLite ডেটাবেসে লেখা হয়।",
    p4t: "কোনো রোগী পরিচয়কারী নেই", p4d: "অ্যাপটি কোনো PII সংগ্রহ করে না। কোনো নাম, বয়স বা অবস্থান প্রয়োজন নেই।",
    backBtn: "অ্যাপে ফিরুন",
  }
};

export default function AboutPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [visibleEls, setVisibleEls] = useState<Set<string>>(new Set());
  const tlTrackRef = useRef<HTMLDivElement>(null);

  // Particles data — generated once
  const particles = useRef(
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      dx: (Math.random() - 0.5) * 60,
      dur: 6 + Math.random() * 8,
      delay: Math.random() * 6,
      size: 1 + Math.random() * 2,
    }))
  );

  // Scroll observer for animated elements
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.target.id) {
            const id = e.target.id;
            setVisibleEls((prev) => {
              if (prev.has(id)) return prev;
              return new Set(prev).add(id);
            });
          }
        });
      },
      { threshold: 0.15 }
    );

    // Observe all animatable elements by data attribute
    requestAnimationFrame(() => {
      document.querySelectorAll("[data-scroll-id]").forEach((el) => {
        observer.observe(el);
      });
    });

    return () => observer.disconnect();
  }, []);

  // Bar chart data
  const chartData = [
    {
      id: "cc1",
      title: T[lang].c1title,
      sub: T[lang].c1sub,
      data: [89.2, 81.4, 78.6, 75.1],
      max: 100,
      suffix: "%",
    },
    {
      id: "cc2",
      title: T[lang].c2title,
      sub: T[lang].c2sub,
      data: [4.2, 24.6, 31.8, 18.3],
      max: 40,
      suffix: "MB",
    },
    {
      id: "cc3",
      title: T[lang].c3title,
      sub: T[lang].c3sub,
      data: [38, 220, 310, 180],
      max: 350,
      suffix: "ms",
    },
    {
      id: "cc4",
      title: T[lang].c4title,
      sub: T[lang].c4sub,
      data: [100, 42, 38, 55],
      max: 100,
      suffix: "/100",
    },
  ];

  const labels = ["RespiCore", "ResApp Health", "StethoMe", "Hyfe AI"];
  const barColors = ["rgba(0,200,255,0.85)", "rgba(120,150,180,0.6)", "rgba(100,130,160,0.6)", "rgba(80,110,140,0.6)"];
  const barBorders = ["#00c8ff", "#4a7a9b", "#3d6880", "#2d5870"];

  const t = T[lang];

  return (
    <div>
      {/* ── FULL CSS (exact replica of the HTML styles) ── */}
      <style>{`
        :root {
          --bg:#050d14;--bg2:#0a1520;--bg3:#0f1e2d;
          --card:#0d1b28;--card2:#112030;
          --border:rgba(120,200,255,0.08);--border2:rgba(120,200,255,0.18);
          --accent:#00c8ff;--accent2:#0090d4;
          --accent-dim:rgba(0,200,255,0.1);--accent-glow:rgba(0,200,255,0.22);
          --green:#00e5a0;--green-dim:rgba(0,229,160,0.1);
          --amber:#ffb830;--amber-dim:rgba(255,184,48,0.1);
          --red:#ff4d6a;--red-dim:rgba(255,77,106,0.1);
          --coral:#ff7c5c;
          --text:#e8f4ff;--text2:#7aa8cc;--text3:#3d6880;
          --mono:'DM Mono',monospace;--serif:'DM Serif Display',serif;--sans:'Syne',sans-serif;
          --r:12px;--r2:20px;
        }
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        body{font-family:var(--sans);background:var(--bg);color:var(--text);overflow-x:hidden;}
        body::before{content:'';position:fixed;inset:0;
          background-image:linear-gradient(rgba(0,200,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,200,255,0.025) 1px,transparent 1px);
          background-size:48px 48px;pointer-events:none;z-index:0;}

        @keyframes fadeUp{from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);}}
        @keyframes float-particle{
          0%{opacity:0;transform:translateY(100vh) translateX(0);}
          10%{opacity:0.6;}
          90%{opacity:0.2;}
          100%{opacity:0;transform:translateY(-20px) translateX(var(--dx,20px));}
        }
        @keyframes scroll-pulse{0%,100%{opacity:0.3;transform:scaleY(1);}50%{opacity:1;transform:scaleY(1.2);}}
        @keyframes ring-spin{to{transform:rotate(360deg);}}

        /* ── NAV ── */
        nav{position:fixed;top:0;left:0;right:0;z-index:200;height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 40px;background:rgba(5,13,20,0.9);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);}
        .nav-logo{display:flex;align-items:center;gap:10px;text-decoration:none;}
        .logo-icon{width:32px;height:32px;border:1.5px solid var(--accent);border-radius:8px;display:flex;align-items:center;justify-content:center;}
        .logo-text{font-size:17px;font-weight:700;letter-spacing:0.04em;color:var(--text);}
        .logo-text span{color:var(--accent);}
        .nav-right{display:flex;align-items:center;gap:20px;}
        .lang-switcher{display:flex;gap:4px;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:3px;}
        .lang-btn{font-family:var(--mono);font-size:10px;letter-spacing:0.08em;padding:5px 10px;border-radius:6px;border:none;background:transparent;color:var(--text3);cursor:pointer;transition:all 0.2s;font-weight:500;}
        .lang-btn.active{background:var(--accent);color:#050d14;}
        .lang-btn:hover:not(.active){color:var(--text);background:var(--border);}
        .btn-back{font-family:var(--sans);font-size:13px;font-weight:600;color:var(--text2);text-decoration:none;border:1px solid var(--border2);padding:8px 18px;border-radius:var(--r);transition:all 0.2s;display:flex;align-items:center;gap:6px;}
        .btn-back:hover{border-color:var(--accent);color:var(--accent);}

        /* ── HERO ── */
        #story-hero{position:relative;z-index:1;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:100px 40px 80px;text-align:center;overflow:hidden;}
        .particles{position:absolute;inset:0;pointer-events:none;}
        .particle{position:absolute;width:2px;height:2px;background:var(--accent);border-radius:50%;opacity:0;animation:float-particle linear infinite;}
        .hero-chip{font-family:var(--mono);font-size:10px;letter-spacing:0.2em;color:var(--accent);text-transform:uppercase;border:1px solid rgba(0,200,255,0.3);padding:6px 16px;border-radius:100px;margin-bottom:32px;display:inline-block;opacity:0;animation:fadeUp 0.8s ease 0.2s forwards;}
        .hero-title{font-family:var(--serif);font-size:clamp(52px,8vw,96px);line-height:1.0;margin-bottom:20px;opacity:0;animation:fadeUp 0.8s ease 0.35s forwards;}
        .hero-title em{font-style:italic;color:var(--accent);}
        .hero-sub{font-size:clamp(14px,2vw,18px);color:var(--text2);max-width:600px;line-height:1.7;margin:0 auto 60px;opacity:0;animation:fadeUp 0.8s ease 0.5s forwards;}
        .scroll-hint{position:absolute;bottom:40px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:8px;font-family:var(--mono);font-size:10px;color:var(--text3);letter-spacing:0.15em;opacity:0;animation:fadeUp 0.8s ease 1.2s forwards;}
        .scroll-line{width:1px;height:40px;background:linear-gradient(to bottom,var(--accent),transparent);animation:scroll-pulse 2s ease-in-out infinite;}

        /* ── TIMELINE ── */
        #timeline{position:relative;z-index:1;padding:100px 0;max-width:900px;margin:0 auto;}
        .timeline-heading{text-align:center;padding:0 40px;margin-bottom:80px;}
        .section-label{font-family:var(--mono);font-size:10px;letter-spacing:0.2em;color:var(--accent);text-transform:uppercase;margin-bottom:12px;display:block;}
        .section-title{font-family:var(--serif);font-size:clamp(32px,4vw,52px);line-height:1.1;}
        .section-sub{font-size:15px;color:var(--text2);line-height:1.7;margin-top:10px;}
        .timeline-track{position:relative;padding:0 40px;}
        .timeline-track::before{content:'';position:absolute;left:50%;top:0;bottom:0;width:1px;background:linear-gradient(to bottom,transparent,var(--accent),var(--accent),transparent);opacity:0.2;transform:translateX(-50%);}
        .tl-item{display:grid;grid-template-columns:1fr 60px 1fr;gap:0;margin-bottom:60px;align-items:start;opacity:0;transform:translateY(30px);transition:all 0.7s ease;}
        .tl-item.visible{opacity:1;transform:translateY(0);}
        .empty-col{display:block;}
        .tl-content-left{text-align:right;padding-right:32px;}
        .tl-content-right{padding-left:32px;}
        .tl-dot{display:flex;flex-direction:column;align-items:center;gap:0;z-index:2;}
        .tl-dot-inner{width:14px;height:14px;border-radius:50%;background:var(--accent);border:3px solid var(--bg);box-shadow:0 0 0 1px var(--accent),0 0 20px var(--accent-glow);flex-shrink:0;margin-top:6px;}
        .tl-dot-line{flex:1;width:1px;background:var(--border2);}
        .tl-month{font-family:var(--mono);font-size:10px;color:var(--accent);letter-spacing:0.15em;text-transform:uppercase;margin-bottom:8px;}
        .tl-heading{font-family:var(--serif);font-size:22px;color:var(--text);margin-bottom:8px;line-height:1.2;}
        .tl-body{font-size:13px;color:var(--text2);line-height:1.65;}
        .tl-tag{display:inline-block;font-family:var(--mono);font-size:9px;letter-spacing:0.1em;color:var(--accent);background:var(--accent-dim);border:1px solid rgba(0,200,255,0.2);padding:3px 8px;border-radius:4px;margin-top:10px;margin-right:4px;}

        /* ── TEAM ── */
        #team{position:relative;z-index:1;padding:100px 40px;background:var(--bg2);border-top:1px solid var(--border);border-bottom:1px solid var(--border);}
        .team-inner{max-width:1000px;margin:0 auto;}
        .team-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-top:60px;}
        .team-card{background:var(--card);border:1px solid var(--border);border-radius:var(--r2);padding:32px 24px;text-align:center;opacity:0;transform:translateY(24px);transition:opacity 0.6s ease,transform 0.6s ease,border-color 0.3s;}
        .team-card.visible{opacity:1;transform:translateY(0);}
        .team-card:hover{border-color:var(--border2);transform:translateY(-4px)!important;}
        .team-avatar{width:72px;height:72px;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:26px;font-style:italic;color:var(--bg);position:relative;}
        .av-accent{background:var(--accent);}
        .av-green{background:var(--green);}
        .av-coral{background:var(--coral);}
        .av-amber{background:var(--amber);}
        .team-ring{position:absolute;inset:-4px;border-radius:50%;border:1px solid;animation:ring-spin 8s linear infinite;}
        .av-accent .team-ring{border-color:var(--accent);opacity:0.4;}
        .av-green .team-ring{border-color:var(--green);opacity:0.4;}
        .av-coral .team-ring{border-color:var(--coral);opacity:0.4;}
        .av-amber .team-ring{border-color:var(--amber);opacity:0.4;}
        .team-name{font-size:17px;font-weight:700;color:var(--text);margin-bottom:4px;}
        .team-role{font-family:var(--mono);font-size:10px;color:var(--accent);letter-spacing:0.12em;text-transform:uppercase;margin-bottom:12px;}
        .team-bio{font-size:12px;color:var(--text2);line-height:1.65;}
        .team-skills{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:14px;}
        .skill-tag{font-family:var(--mono);font-size:9px;color:var(--text3);letter-spacing:0.08em;background:var(--bg3);border:1px solid var(--border);padding:3px 8px;border-radius:4px;}

        /* ── COMPARISON ── */
        #compare{position:relative;z-index:1;padding:100px 40px;}
        .compare-inner{max-width:1100px;margin:0 auto;}
        .compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:60px;}
        .chart-card{background:var(--card);border:1px solid var(--border);border-radius:var(--r2);padding:32px;opacity:0;transform:translateY(24px);transition:opacity 0.7s ease,transform 0.7s ease;}
        .chart-card.visible{opacity:1;transform:translateY(0);}
        .chart-card:hover{border-color:var(--border2);}
        .chart-title{font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px;letter-spacing:0.02em;}
        .chart-sub{font-family:var(--mono);font-size:10px;color:var(--text3);letter-spacing:0.08em;margin-bottom:24px;}
        .chart-wrap{position:relative;}
        .winner-badge{display:inline-flex;align-items:center;gap:6px;margin-top:16px;font-family:var(--mono);font-size:10px;color:var(--green);letter-spacing:0.1em;background:var(--green-dim);border:1px solid rgba(0,229,160,0.25);padding:5px 12px;border-radius:6px;}
        .compare-table-wrap{grid-column:1/-1;background:var(--card);border:1px solid var(--border);border-radius:var(--r2);padding:32px;margin-top:8px;opacity:0;transform:translateY(24px);transition:opacity 0.7s ease 0.2s,transform 0.7s ease 0.2s;}
        .compare-table-wrap.visible{opacity:1;transform:translateY(0);}
        .feat-table{width:100%;border-collapse:collapse;}
        .feat-table th{font-family:var(--mono);font-size:10px;letter-spacing:0.12em;color:var(--text3);text-transform:uppercase;text-align:left;padding:12px 16px;border-bottom:1px solid var(--border);}
        .feat-table th.ours{color:var(--accent);}
        .feat-table td{padding:13px 16px;font-size:13px;color:var(--text2);border-bottom:1px solid var(--border);}
        .feat-table tr:last-child td{border-bottom:none;}
        .feat-table td.ours{color:var(--green);font-weight:600;}
        .feat-table tr:hover td{background:rgba(0,200,255,0.02);}
        .check{color:var(--green);}
        .cross{color:var(--red-dim);opacity:0.5;}
        .partial{color:var(--amber);}

        /* ── BAR CHARTS (CSS-only, no Chart.js) ── */
        .chart-container{min-height:260px;display:flex;flex-direction:column;justify-content:flex-end;}
        .chart-bars{display:flex;align-items:flex-end;gap:16px;height:200px;padding-top:10px;}
        .chart-bar-group{flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;height:100%;justify-content:flex-end;}
        .chart-bar-value{font-family:var(--mono);font-size:10px;color:var(--accent);opacity:0;transform:translateY(8px);transition:all 0.3s ease;}
        .chart-bar-value.show{opacity:1;transform:translateY(0);}
        .chart-bar-col{width:100%;height:0;border-radius:6px;transition:height 0.8s ease-out;position:relative;overflow:hidden;}
        .chart-bar-col.show{height:var(--h);}
        .chart-bar-fill{width:100%;height:100%;border-radius:6px;border:1px solid;}
        .chart-bar-label{font-family:var(--mono);font-size:9px;color:var(--text3);text-align:center;line-height:1.2;max-width:80px;}

        /* ── WHY ── */
        #why{position:relative;z-index:1;padding:100px 40px;background:var(--bg2);border-top:1px solid var(--border);border-bottom:1px solid var(--border);}
        .why-inner{max-width:900px;margin:0 auto;}
        .stat-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:60px;}
        .stat-card{background:var(--card);border:1px solid var(--border);border-radius:var(--r2);padding:32px 24px;text-align:center;opacity:0;transform:scale(0.95);transition:all 0.6s ease;}
        .stat-card.visible{opacity:1;transform:scale(1);}
        .stat-card:hover{border-color:var(--border2);}
        .stat-big{font-family:var(--serif);font-size:52px;color:var(--accent);line-height:1;margin-bottom:8px;}
        .stat-lbl{font-size:12px;color:var(--text2);letter-spacing:0.06em;margin-bottom:6px;}
        .stat-src{font-family:var(--mono);font-size:9px;color:var(--text3);letter-spacing:0.08em;}
        .quote-block{margin-top:60px;padding:40px;background:var(--card);border-left:3px solid var(--accent);border-radius:0 var(--r2) var(--r2) 0;opacity:0;transform:translateX(-20px);transition:all 0.7s ease;}
        .quote-block.visible{opacity:1;transform:translateX(0);}
        .quote-text{font-family:var(--serif);font-size:clamp(20px,3vw,28px);font-style:italic;color:var(--text);line-height:1.5;margin-bottom:16px;}
        .quote-attr{font-family:var(--mono);font-size:11px;color:var(--text3);letter-spacing:0.1em;}

        /* ── PRIVACY ── */
        #privacy{position:relative;z-index:1;padding:100px 40px;}
        .privacy-inner{max-width:1000px;margin:0 auto;}
        .privacy-cards{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;margin-top:60px;}
        .priv-card{background:var(--card);border:1px solid var(--border);border-radius:var(--r2);padding:28px;display:flex;gap:20px;align-items:flex-start;opacity:0;transform:translateY(20px);transition:all 0.6s ease;}
        .priv-card.visible{opacity:1;transform:translateY(0);}
        .priv-card:hover{border-color:var(--border2);}
        .priv-icon{width:44px;height:44px;border-radius:10px;background:var(--accent-dim);border:1px solid rgba(0,200,255,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .priv-icon svg{width:20px;height:20px;color:var(--accent);}
        .priv-title{font-size:14px;font-weight:700;color:var(--text);margin-bottom:6px;}
        .priv-desc{font-size:12px;color:var(--text2);line-height:1.65;}

        /* ── FOOTER ── */
        footer{position:relative;z-index:1;border-top:1px solid var(--border);padding:40px;display:flex;align-items:center;justify-content:space-between;}
        .footer-note{font-family:var(--mono);font-size:11px;color:var(--text3);letter-spacing:0.06em;}
        .footer-warning{font-size:11px;color:var(--amber);background:var(--amber-dim);border:1px solid rgba(255,184,48,0.2);padding:6px 14px;border-radius:6px;font-family:var(--mono);}

        /* ── MOBILE ── */
        .mobile-back-bar{display:none;position:fixed;bottom:0;left:0;right:0;z-index:9000;background:rgba(10,21,32,0.97);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-top:1px solid rgba(120,200,255,0.15);padding:10px 20px calc(10px + env(safe-area-inset-bottom, 0px));box-shadow:0 -8px 32px rgba(0,0,0,0.5);}
        .mobile-back-bar-inner{display:flex;align-items:center;justify-content:space-between;gap:12px;}
        .mobile-back-btn{display:flex;align-items:center;gap:8px;font-family:var(--sans);font-size:13px;font-weight:600;color:var(--text2);text-decoration:none;border:1px solid rgba(120,200,255,0.2);padding:10px 18px;border-radius:10px;background:transparent;transition:all 0.2s;-webkit-tap-highlight-color:transparent;touch-action:manipulation;}
        .mobile-back-btn:active{background:var(--card);color:var(--accent);}
        .mobile-lang-row{display:flex;gap:6px;}
        .mobile-lang-row .lang-btn{padding:8px 12px;font-size:11px;}

        @media(max-width:768px){
          nav{padding:0 16px;height:56px;}
          .nav-right{gap:12px;}
          .lang-switcher{display:none;}
          .btn-back{display:none;}
          .mobile-back-bar{display:block;}
          body{padding-bottom:calc(68px + env(safe-area-inset-bottom, 0px));}
          #story-hero{padding:80px 20px 60px;min-height:auto;}
          .hero-title{font-size:clamp(36px,10vw,56px);}
          .hero-sub{font-size:14px;margin-bottom:40px;}
          .scroll-hint{display:none;}
          #timeline{padding:60px 0;}
          .timeline-heading{padding:0 20px;margin-bottom:48px;}
          .timeline-track{padding:0 16px 0 20px;}
          .timeline-track::before{left:20px;transform:none;}
          .tl-item{grid-template-columns:28px 1fr;gap:0;margin-bottom:40px;}
          .empty-col{display:none!important;}
          .tl-item:nth-child(odd) .tl-content-left{text-align:left!important;padding-left:20px!important;padding-right:0!important;}
          .tl-item:nth-child(even) .tl-content-right{padding-left:20px!important;}
          .tl-content-right{padding-left:20px;}
          .tl-dot-inner{margin-top:4px;}
          .tl-heading{font-size:17px;}
          .tl-body{font-size:13px;}
          #team{padding:60px 20px;}
          .team-grid{grid-template-columns:repeat(2,1fr);gap:16px;}
          .team-card{padding:24px 16px;}
          .team-avatar{width:56px;height:56px;font-size:20px;}
          .team-name{font-size:14px;}
          #compare{padding:60px 20px;}
          .compare-grid{grid-template-columns:1fr;gap:16px;overflow-x:auto;}
          .compare-table-wrap{grid-column:1;padding:20px 16px;overflow-x:auto;}
          .chart-card{padding:24px 16px;}
          .feat-table{min-width:400px;}
          #why{padding:60px 20px;}
          .stat-strip{grid-template-columns:1fr 1fr;gap:12px;}
          .stat-big{font-size:40px;}
          .quote-block{padding:28px 20px;margin-top:40px;}
          .quote-text{font-size:clamp(17px,5vw,22px);}
          #privacy{padding:60px 20px;}
          .privacy-cards{grid-template-columns:1fr;gap:14px;}
          .priv-card{padding:20px 16px;}
          footer{flex-direction:column;gap:12px;text-align:center;padding:28px 20px calc(28px + env(safe-area-inset-bottom,0px));}
        }
      `}</style>

      {/* ── NAV ── */}
      <nav>
        <Link href="/" className="nav-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" width="18" height="18">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
              <path d="M8 12h1l2-4 2 8 2-5 1 1h2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="logo-text">Respi<span>Core</span></span>
        </Link>
        <div className="nav-right">
          <div className="lang-switcher">
            <button className={`lang-btn ${lang === "en" ? "active" : ""}`} onClick={() => setLang("en")}>EN</button>
            <button className={`lang-btn ${lang === "hi" ? "active" : ""}`} onClick={() => setLang("hi")}>हिं</button>
            <button className={`lang-btn ${lang === "bn" ? "active" : ""}`} onClick={() => setLang("bn")}>বাং</button>
          </div>
          <Link href="/" className="btn-back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>{t.backBtn}</span>
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="story-hero">
        <div className="particles">
          {particles.current.map((p) => (
            <div
              key={p.id}
              className="particle"
              style={{
                left: `${p.left}%`,
                ["--dx" as string]: `${p.dx}px`,
                animationDuration: `${p.dur}s`,
                animationDelay: `${p.delay}s`,
                width: `${p.size}px`,
                height: `${p.size}px`,
              }}
            />
          ))}
        </div>

        <span className="hero-chip">{t.heroChip}</span>
        <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: t.heroTitle }} />
        <p className="hero-sub">{t.heroSub}</p>

        <div className="scroll-hint">
          <span>{t.scrollHint}</span>
          <div className="scroll-line" />
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section id="timeline">
        <div className="timeline-heading">
          <span className="section-label">{t.tlLabel}</span>
          <h2 className="section-title">{t.tlTitle}</h2>
          <p className="section-sub">{t.tlSub}</p>
        </div>
        <div className="timeline-track" ref={tlTrackRef}>
          {[
            { month: t.tl1month, head: t.tl1head, body: t.tl1body, tag: "Origin", tags: undefined as undefined },
            { month: t.tl2month, head: t.tl2head, body: t.tl2body, tag: undefined as undefined, tags: ["Research", "COUGHVID"] },
            { month: t.tl3month, head: t.tl3head, body: t.tl3body, tag: undefined as undefined, tags: ["MobileNetV2", "TFLite"] },
            { month: t.tl4month, head: t.tl4head, body: t.tl4body, tag: undefined as undefined, tags: ["Flutter", "SQLite"] },
            { month: t.tl5month, head: t.tl5head, body: t.tl5body, tag: undefined as undefined, tags: ["Production", "Edge AI"] },
          ].map((item, i) => (
            <div
              key={i}
              id={`tl-${i}`}
              className={`tl-item ${visibleEls.has(`tl-${i}`) ? "visible" : ""}`}
              data-scroll-id
              style={{ transition: "all 0.7s ease" }}
            >
              {i % 2 === 0 ? (
                // Odd items: content on left
                <>
                  <div className="tl-content-left">
                    <div className="tl-month">{item.month}</div>
                    <div className="tl-heading">{item.head}</div>
                    <p className="tl-body">{item.body}</p>
                    {item.tag && <span className="tl-tag">{item.tag}</span>}
                    {item.tags?.map((tg) => <span key={tg} className="tl-tag">{tg}</span>)}
                  </div>
                  <div className="tl-dot"><div className="tl-dot-inner" /></div>
                  <div className="empty-col" />
                </>
              ) : (
                // Even items: content on right
                <>
                  <div className="empty-col" />
                  <div className="tl-dot"><div className="tl-dot-inner" /></div>
                  <div className="tl-content-right">
                    <div className="tl-month">{item.month}</div>
                    <div className="tl-heading">{item.head}</div>
                    <p className="tl-body">{item.body}</p>
                    {item.tags?.map((tg) => <span key={tg} className="tl-tag">{tg}</span>)}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── TEAM ── */}
      <section id="team">
        <div className="team-inner">
          <span className="section-label">{t.teamLabel}</span>
          <h2 className="section-title">{t.teamTitle}</h2>
          <p className="section-sub">{t.teamSub}</p>

          <div className="team-grid">
            {[
              { name: t.t1name, role: t.t1role, bio: t.t1bio, avatar: "A", avatarClass: "av-accent", skills: ["PyTorch", "TFLite", "Librosa"] },
              { name: t.t2name, role: t.t2role, bio: t.t2bio, avatar: "A", avatarClass: "av-green", skills: ["Flutter", "Dart", "SQLite"] },
              { name: t.t3name, role: t.t3role, bio: t.t3bio, avatar: "R", avatarClass: "av-coral", skills: ["Python", "Librosa", "NumPy"] },
              { name: t.t4name, role: t.t4role, bio: t.t4bio, avatar: "S", avatarClass: "av-amber", skills: ["Figma", "CSS", "Motion"] },
            ].map((m, i) => (
              <div
                key={i}
                id={`team-${i}`}
                className={`team-card ${visibleEls.has(`team-${i}`) ? "visible" : ""}`}
                data-scroll-id
                style={{ transition: "opacity 0.6s ease 0.08s, transform 0.6s ease 0.08s" }}
              >
                <div className={`team-avatar ${m.avatarClass}`}>
                  <div className="team-ring" />
                  {m.avatar}
                </div>
                <div className="team-name">{m.name}</div>
                <div className="team-role">{m.role}</div>
                <p className="team-bio">{m.bio}</p>
                <div className="team-skills">
                  {m.skills.map((s) => <span key={s} className="skill-tag">{s}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON ── */}
      <section id="compare">
        <div className="compare-inner">
          <span className="section-label">{t.cmpLabel}</span>
          <h2 className="section-title">{t.cmpTitle}</h2>
          <p className="section-sub">{t.cmpSub}</p>

          <div className="compare-grid">
            {chartData.map((chart, i) => {
              const visible = visibleEls.has(chart.id);
              const winLabels = [t.c1win, t.c2win, t.c3win, t.c4win];
              return (
                <div
                  key={chart.id}
                  id={chart.id}
                  className={`chart-card ${visible ? "visible" : ""}`}
                  data-scroll-id
                >
                  <div className="chart-title">{chart.title}</div>
                  <div className="chart-sub">{chart.sub}</div>
                  <div className="chart-container">
                    <div className="chart-bars">
                      {chart.data.map((v, j) => {
                        const h = ((v / chart.max) * 180).toFixed(0);
                        return (
                          <div key={j} className="chart-bar-group">
                            <span className={`chart-bar-value ${visible ? "show" : ""}`} style={{ color: barBorders[j], transitionDelay: `${j * 0.1}s` }}>
                              {v}{chart.suffix}
                            </span>
                            <div
                              className={`chart-bar-col ${visible ? "show" : ""}`}
                              style={{
                                ["--h" as string]: `${h}px`,
                                transitionDelay: `${j * 0.12}s`,
                              }}
                            >
                              <div className="chart-bar-fill" style={{ background: barColors[j], borderTopColor: barBorders[j] }} />
                            </div>
                            <span className="chart-bar-label">{labels[j]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="winner-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    {winLabels[i]}
                  </div>
                </div>
              );
            })}

            {/* Feature comparison table */}
            <div
              id="cmpTable"
              className={`compare-table-wrap ${visibleEls.has("cmpTable") ? "visible" : ""}`}
              data-scroll-id
            >
              <div className="chart-title">{t.ctTitle}</div>
              <div className="chart-sub">{t.ctSub}</div>
              <table className="feat-table">
                <thead>
                  <tr>
                    <th>{t.thFeature}</th>
                    <th className="ours">RespiCore</th>
                    <th>ResApp Health</th>
                    <th>StethoMe</th>
                    <th>Hyfe AI</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1 */}
                  <tr>
                    <td>{t.f1}</td>
                    <td className="ours check">✓ Yes</td>
                    <td className="cross">✗ Cloud</td>
                    <td className="cross">✗ Cloud</td>
                    <td className="partial">~ Partial</td>
                  </tr>
                  {/* Row 2 */}
                  <tr>
                    <td>{t.f2}</td>
                    <td className="ours check">✓ Yes</td>
                    <td className="check">✓ Yes</td>
                    <td className="cross">✗ Dongle needed</td>
                    <td className="check">✓ Yes</td>
                  </tr>
                  {/* Row 3 */}
                  <tr>
                    <td>{t.f3}</td>
                    <td className="ours check">✓ MIT License</td>
                    <td className="cross">✗ Proprietary</td>
                    <td className="cross">✗ Proprietary</td>
                    <td className="cross">✗ Proprietary</td>
                  </tr>
                  {/* Row 4 */}
                  <tr>
                    <td>{t.f4}</td>
                    <td className="ours check">✓ 4 classes</td>
                    <td className="partial">~ 2 classes</td>
                    <td className="check">✓ 3 classes</td>
                    <td className="partial">~ 2 classes</td>
                  </tr>
                  {/* Row 5 */}
                  <tr>
                    <td>{t.f5}</td>
                    <td className="ours check">✓ Free</td>
                    <td className="cross">✗ Paid</td>
                    <td className="cross">✗ Paid</td>
                    <td className="partial">~ Freemium</td>
                  </tr>
                  {/* Row 6 */}
                  <tr>
                    <td>{t.f6}</td>
                    <td className="ours check">✓ Flutter</td>
                    <td className="check">✓ Yes</td>
                    <td className="partial">~ iOS only</td>
                    <td className="check">✓ Yes</td>
                  </tr>
                  {/* Row 7 */}
                  <tr>
                    <td>{t.f7}</td>
                    <td className="ours check">✓ SQLite</td>
                    <td className="cross">✗ Cloud DB</td>
                    <td className="cross">✗ Cloud DB</td>
                    <td className="cross">✗ Cloud DB</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY ── */}
      <section id="why">
        <div className="why-inner">
          <span className="section-label">{t.whyLabel}</span>
          <h2 className="section-title">{t.whyTitle}</h2>

          <div className="stat-strip">
            {[
              { num: "3.9B", lbl: t.s1lbl, src: "WHO, 2023" },
              { num: "4M", lbl: t.s2lbl, src: "Global Burden of Disease, 2022", color: "var(--amber)" },
              { num: "6.9B", lbl: t.s3lbl, src: "Statista, 2024", color: "var(--green)" },
            ].map((s, i) => (
              <div
                key={i}
                id={`stat-${i}`}
                className={`stat-card ${visibleEls.has(`stat-${i}`) ? "visible" : ""}`}
                data-scroll-id
              >
                <div className="stat-big" style={{ color: s.color || "var(--accent)" }}>{s.num}</div>
                <div className="stat-lbl">{s.lbl}</div>
                <div className="stat-src">{s.src}</div>
              </div>
            ))}
          </div>

          <div
            id="quote"
            className={`quote-block ${visibleEls.has("quote") ? "visible" : ""}`}
            data-scroll-id
          >
            <div className="quote-text">{t.quoteText}</div>
            <div className="quote-attr">{t.quoteAttr}</div>
          </div>
        </div>
      </section>

      {/* ── PRIVACY ── */}
      <section id="privacy">
        <div className="privacy-inner">
          <span className="section-label">{t.privLabel}</span>
          <h2 className="section-title">{t.privTitle}</h2>
          <p className="section-sub">{t.privSub}</p>

          <div className="privacy-cards">
            {[
              {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
                title: t.p1t, desc: t.p1d,
              },
              {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
                title: t.p2t, desc: t.p2d,
              },
              {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
                title: t.p3t, desc: t.p3d,
              },
              {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
                title: t.p4t, desc: t.p4d,
              },
            ].map((p, i) => (
              <div
                key={i}
                id={`priv-${i}`}
                className={`priv-card ${visibleEls.has(`priv-${i}`) ? "visible" : ""}`}
                data-scroll-id
              >
                <div className="priv-icon">{p.icon}</div>
                <div>
                  <div className="priv-title">{p.title}</div>
                  <p className="priv-desc">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <span className="footer-note">© 2026 RespiCore. All rights reserved.</span>
        <span className="footer-warning">⚠ Research prototype — not a clinical diagnostic device</span>
      </footer>

      {/* ── MOBILE BACK BAR ── */}
      <div className="mobile-back-bar">
        <div className="mobile-back-bar-inner">
          <Link href="/" className="mobile-back-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ pointerEvents: "none", flexShrink: 0 }}>
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>{t.backBtn}</span>
          </Link>
          <div className="mobile-lang-row">
            <button className={`lang-btn ${lang === "en" ? "active" : ""}`} onClick={() => setLang("en")}>EN</button>
            <button className={`lang-btn ${lang === "hi" ? "active" : ""}`} onClick={() => setLang("hi")}>हिं</button>
            <button className={`lang-btn ${lang === "bn" ? "active" : ""}`} onClick={() => setLang("bn")}>বাং</button>
          </div>
        </div>
      </div>
    </div>
  );
}
