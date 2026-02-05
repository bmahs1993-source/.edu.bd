
export interface TickerConfig {
  speed: number;
  backgroundColor: string;
  textColor: string;
  fontSize: string;
  fontWeight: string;
}

export interface ThemeConfig {
  primaryTextColor: string;
  secondaryTextColor: string;
  headingColor: string;
  navTextColor: string;
  footerTextColor: string;
  accentColor: string;
  isDarkMode: boolean;
}

export interface Notice {
  id: string;
  title: string;
  date: string;
  content: string;
  important: boolean;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'video' | 'pdf' | 'document';
  fileName?: string;
  targetClass?: string;
  targetSection?: string;
}

export interface NewsEvent {
  id: string;
  title: string;
  date: string;
  imageUrl?: string;
  content: string;
  attachmentUrl?: string;
  fileName?: string;
}

export interface AcademicFile {
  id: string;
  title: string;
  targetClass: string;
  url: string;
  fileName?: string;
}

export interface ClassTeacherAssignment {
  id: string;
  targetClass: string;
  section: string;
  teacherName: string;
}

export interface Exam {
  id: string;
  title: string;
  date: string;
  subject: string;
  targetClass: string;
  targetSection: string;
  attachmentUrl?: string;
  fileName?: string;
}

export interface Result {
  id: string;
  studentName: string;
  studentRoll: string;
  targetClass: string;
  targetSection: string;
  gpa: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'pdf' | 'document';
  fileName?: string;
  date: string;
}

export interface GalleryItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  caption: string;
}

export interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
}

export interface SectionContent {
  id: string;
  title: string;
  body: string;
}

export interface Faculty {
  id: string;
  name: string;
  designation: string;
  image: string;
}

export interface AdmissionApplication {
  id: string;
  studentName: string;
  parentName: string;
  appliedClass: string;
  phone: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface SchoolStats {
  students: string;
  teachers: string;
  staff: string;
  buildings: string;
}

export interface SchoolData {
  schoolName: string;
  address: string;
  phone: string;
  email: string;
  
  // Identity Fields
  motto: string;
  schoolCode: string;
  collegeCode: string;
  eiin: string;
  
  // Location & Media
  locationText: string;
  locationMapUrl: string; // Embed URL
  nationalAnthemYoutubeId: string;

  // Admin Credentials
  adminUsername: string;
  adminPassword: string;
  adminProfilePic?: string;
  adminProfilePicFit?: 'cover' | 'contain';

  // Cloud Sync
  cloudScriptUrl?: string;

  logoUrl: string;
  logoFit?: 'cover' | 'contain';
  marqueeText: string;
  tickerConfig: TickerConfig;
  themeConfig: ThemeConfig;
  
  stats: SchoolStats;
  newsEvents: NewsEvent[];

  aboutContent: string;
  aboutPdfUrl?: string;
  administrationContent: string;
  administrationPdfUrl?: string;
  academicsContent: string;
  academicsPdfUrl?: string;
  
  syllabuses: AcademicFile[];
  classRoutines: AcademicFile[];
  classTeachers: ClassTeacherAssignment[];

  // Administration specific personnel
  headTeacher?: Faculty;
  assistantHeadTeachers: Faculty[];
  committeeMembers: Faculty[];
  governingBody: Faculty[];

  coCurricularContent: string;
  coCurricularPdfUrl?: string;
  admissionInfo: string;
  admissionPdfUrl?: string;

  banners: Banner[];
  notices: Notice[];
  exams: Exam[];
  results: Result[];
  sections: SectionContent[]; 
  faculty: Faculty[];
  gallery: GalleryItem[];
  applications: AdmissionApplication[];
}
