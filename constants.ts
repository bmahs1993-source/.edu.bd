
import { SchoolData } from './types';

export const INITIAL_SCHOOL_DATA: SchoolData = {
  schoolName: "Bagpur Masum Ali Pramanik High School",
  address: "Rangpur, Bangladesh",
  phone: "017XX-XXXXXX",
  email: "contact@bmahs.edu.bd",
  
  // Hardcoded the URL provided by the user. 
  // Changed /dev to /exec to ensure it is publicly accessible to all students and visitors.
  cloudScriptUrl: "https://script.google.com/macros/s/AKfycbxh-qwLRLugibk_HxmvP4T2OYE38GexQECHxKon3F3G/exec", 

  // Identity Defaults
  motto: "Education | Discipline | Character",
  schoolCode: "5312",
  collegeCode: "5257",
  eiin: "127260",

  // Location & Media Defaults
  locationText: "Bagpur, Pirganj, Rangpur, Bangladesh",
  locationMapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d115041.56581121081!2d89.17641888069695!3d25.752355447171544!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39ed09689452b46d%3A0xc3b53f6834d9a40!2sRangpur!5e0!3m2!1sen!2sbd!4v1710000000000!5m2!1sen!2sbd",
  nationalAnthemYoutubeId: "UoX7o_SkaS0",
  
  // Admin Credentials Defaults
  adminUsername: "127260",
  adminPassword: "Bmahs127260",
  adminProfilePic: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200",
  adminProfilePicFit: 'cover',

  logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/5/58/Collectorate_School_and_College_Rangpur_logo.png/220px-Collectorate_School_and_College_Rangpur_logo.png",
  logoFit: 'contain',
  marqueeText: "২০২৬ শিক্ষাবর্ষে কেজি থেকে ষষ্ঠ শ্রেণিতে ভর্তি বিজ্ঞপ্তি প্রকাশিত হয়েছে। এইচএসসি প্রি-টেস্ট পরীক্ষা ২০২৫ এর রুটিন দেখুন।",
  tickerConfig: {
    speed: 25,
    backgroundColor: "#f8fafc",
    textColor: "#004071",
    fontSize: "14px",
    fontWeight: "900"
  },
  themeConfig: {
    primaryTextColor: "#334155",
    secondaryTextColor: "#64748b",
    headingColor: "#004071",
    navTextColor: "#ffffff",
    footerTextColor: "#ffffff",
    accentColor: "#4ade80",
    isDarkMode: false
  },
  
  stats: {
    students: "3000+",
    teachers: "70",
    staff: "25",
    buildings: "4"
  },
  newsEvents: [
    {
      id: 'e1',
      title: 'Study Tour',
      date: 'February 14, 2022',
      imageUrl: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=400',
      content: 'Annual study tour to historical sites.'
    },
    {
      id: 'e2',
      title: 'Book Distribution 2020',
      date: 'February 14, 2022',
      content: 'Textbook festival for new academic session.'
    }
  ],

  aboutContent: "Bagpur Masum Ali Pramanik High School is one of the most prestigious and important educational institutions in Rangpur. It is located in the heart of the Rangpur City, comprising of an area of 1.00 acres of land. Bagpur Masum Ali Pramanik High School was established in 1998.",
  administrationContent: "The institution is governed by a Board of Directors headed by the Deputy Commissioner (DC) of Rangpur. Our administrative team ensures smooth operations and maintains the highest standards of educational integrity.",
  
  academicsContent: "We follow the national curriculum of Bangladesh (NCTB) for both School and College sections. Our academic program is designed to foster critical thinking, creativity, and a deep understanding of core subjects.",
  syllabuses: [],
  classRoutines: [],
  classTeachers: [],

  headTeacher: {
    id: 'f1',
    name: 'Md. Head Master Name',
    designation: 'Head Master',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop'
  },
  assistantHeadTeachers: [
    {
      id: 'f2',
      name: 'Md. Assistant Head Master',
      designation: 'Assistant Head Master',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop'
    }
  ],
  committeeMembers: [],
  governingBody: [],

  coCurricularContent: "At Bagpur Masum Ali Pramanik High School, we believe in the all-round development of students. Our co-curricular activities include debate, scouting, sports, cultural programs, and science clubs.",
  admissionInfo: "Admission to Bagpur Masum Ali Pramanik High School is based on merit. For primary classes (KG to Class 5), admission is typically through a lottery or test. For higher classes, a formal admission test is conducted annually in December.",

  banners: [
    {
      id: '1',
      imageUrl: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=1200&auto=format&fit=crop',
      title: 'Bagpur Masum Ali Pramanik High School',
      subtitle: 'Education | Discipline | Character'
    }
  ],
  notices: [
    {
      id: 'n1',
      title: '২০২৬ শিক্ষাবর্ষে প্রাথমিক ও মাধ্যমিক শাখায় ভর্তি পরীক্ষার ফলাফল ও ভর্তি সংক্রান্ত বিজ্ঞপ্তি',
      date: 'December 20, 2025',
      content: 'ফলাফল ও ভর্তি সংক্রান্ত বিস্তারিত তথ্য এখানে পাওয়া যাবে।',
      important: true,
    }
  ],
  exams: [],
  results: [],
  sections: [
    {
      id: 'headMasterMsg',
      title: 'Head Master Message',
      body: 'Welcome to our institution. We are committed to providing the best education and building a brighter future for our students.'
    },
    {
      id: 'assistantHeadMasterMsg',
      title: 'Assistant Head Master Message',
      body: 'Education is the light that guides us. Our mission is to illuminate the minds of our students through discipline and academic excellence.'
    }
  ],
  faculty: [
    {
      id: 'f1',
      name: 'Md. Head Master Name',
      designation: 'Head Master',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop'
    },
    {
      id: 'f2',
      name: 'Md. Assistant Head Master',
      designation: 'Assistant Head Master',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop'
    }
  ],
  gallery: [
    {
      id: 'g1',
      url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop',
      type: 'image',
      caption: 'Annual Sports Day Celebration'
    }
  ],
  applications: []
};

export const STORAGE_KEY = 'cscr_school_data_v6';
export const ADMIN_CREDENTIALS = {
  username: '127260',
  password: 'Bmahs127260'
};

export const CLASS_LIST = ['All', 'KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'HSC 1st', 'HSC 2nd'];
export const SECTION_LIST = ['All', 'Morning', 'Day'];
