import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Therapist } from './src/models/Therapist';
import { extractWeeklyTemplate, syncWeeklyToLegacy } from './src/utils/schedule';

dotenv.config();

const therapists = [
    {
        name: 'Dr. Priya Sharma',
        bio: 'I specialize in helping individuals navigate anxiety, depression, and life transitions using evidence-based CBT techniques. My approach is warm, non-judgmental, and tailored to each person\'s unique journey.',
        credentials: 'PhD Clinical Psychology, NIMHANS Bangalore, Certified CBT Practitioner',
        gender: 'Female',
        specialties: ['Anxiety', 'Depression', 'Life Transitions', 'CBT'],
        experienceYears: 10,
        price: 1500,
        profileImage: 'https://randomuser.me/api/portraits/women/44.jpg',
        ratingAverage: 4.9,
        ratingCount: 214,
        languages: ['English', 'Hindi', 'Kannada'],
        sessionTypes: ['Video', 'Audio'],
        responseRate: 98,
        totalSessions: 520,
        faq: [
            { question: 'What happens in the first session?', answer: 'We start with a casual conversation about what brings you here and what you hope to achieve. There\'s no pressure — it\'s just about getting comfortable.' },
            { question: 'How long is each session?', answer: 'Each session is 50 minutes. You\'ll receive follow-up notes within 24 hours.' },
            { question: 'Do you offer sliding scale pricing?', answer: 'Yes, I offer reduced rates for students and those facing financial hardship. Please reach out to discuss.' },
        ],
        availability: [
            { day: 'Monday', slots: ['10:00 AM', '12:00 PM', '3:00 PM'] },
            { day: 'Wednesday', slots: ['11:00 AM', '2:00 PM', '5:00 PM'] },
            { day: 'Friday', slots: ['9:00 AM', '1:00 PM'] },
            { day: 'Saturday', slots: ['10:00 AM', '12:00 PM', '2:00 PM'] },
            { day: 'Sunday', slots: ['11:00 AM', '3:00 PM'] },
        ],
    },
    {
        name: 'Dr. Arjun Mehta',
        bio: 'With a background in both psychiatry and psychotherapy, I work with adults dealing with trauma, PTSD, and relationship difficulties. I use EMDR and somatic approaches to help clients process and heal.',
        credentials: 'MD Psychiatry, AIIMS Delhi, Certified EMDR Therapist, Somatic Experiencing Practitioner',
        gender: 'Male',
        specialties: ['Trauma', 'PTSD', 'Relationships', 'EMDR'],
        experienceYears: 14,
        price: 2000,
        profileImage: 'https://randomuser.me/api/portraits/men/32.jpg',
        ratingAverage: 4.8,
        ratingCount: 187,
        languages: ['English', 'Hindi'],
        sessionTypes: ['Video', 'Audio', 'In-person'],
        responseRate: 95,
        totalSessions: 680,
        faq: [
            { question: 'What is EMDR therapy?', answer: 'EMDR (Eye Movement Desensitization and Reprocessing) is a structured therapy that helps process traumatic memories and reduce their emotional impact.' },
            { question: 'Is online EMDR effective?', answer: 'Yes, research shows online EMDR is as effective as in-person sessions for most clients.' },
        ],
        availability: [
            { day: 'Tuesday', slots: ['9:00 AM', '11:00 AM', '4:00 PM'] },
            { day: 'Thursday', slots: ['10:00 AM', '2:00 PM', '6:00 PM'] },
            { day: 'Saturday', slots: ['10:00 AM', '12:00 PM'] },
        ],
    },
    {
        name: 'Dr. Sneha Iyer',
        bio: 'I am passionate about supporting women through reproductive mental health challenges including postpartum depression, pregnancy loss, and infertility. I bring deep empathy and clinical expertise to every session.',
        credentials: 'MSc Counselling Psychology, Tata Institute, Postpartum Support International Certified',
        gender: 'Female',
        specialties: ['Postpartum Depression', 'Womens Mental Health', 'Grief', 'Infertility'],
        experienceYears: 8,
        price: 1200,
        profileImage: 'https://randomuser.me/api/portraits/women/65.jpg',
        ratingAverage: 4.9,
        ratingCount: 143,
        languages: ['English', 'Tamil', 'Hindi'],
        sessionTypes: ['Video', 'Audio'],
        responseRate: 99,
        totalSessions: 390,
        faq: [
            { question: 'Do you only work with women?', answer: 'While I specialize in women\'s mental health, I welcome all genders who are navigating reproductive health challenges.' },
            { question: 'Can my partner join a session?', answer: 'Absolutely. Couples sessions can be arranged to support both partners through these experiences.' },
        ],
        availability: [
            { day: 'Monday', slots: ['9:00 AM', '11:00 AM'] },
            { day: 'Wednesday', slots: ['10:00 AM', '3:00 PM', '5:00 PM'] },
            { day: 'Friday', slots: ['11:00 AM', '2:00 PM', '4:00 PM'] },
            { day: 'Saturday', slots: ['10:00 AM', '1:00 PM'] },
            { day: 'Sunday', slots: ['10:00 AM', '12:00 PM'] },
        ],
    },
    {
        name: 'Dr. Rohan Kapoor',
        bio: 'I work with adolescents and young adults navigating academic pressure, identity questions, and social anxiety. My approach combines motivational interviewing with mindfulness to foster lasting resilience.',
        credentials: 'MEd Counselling, Delhi University, Certified Adolescent Therapist, Mindfulness-Based Stress Reduction',
        gender: 'Male',
        specialties: ['Adolescents', 'Academic Stress', 'Social Anxiety', 'Identity'],
        experienceYears: 6,
        price: 1000,
        profileImage: 'https://randomuser.me/api/portraits/men/55.jpg',
        ratingAverage: 4.7,
        ratingCount: 98,
        languages: ['English', 'Hindi', 'Punjabi'],
        sessionTypes: ['Video', 'In-person'],
        responseRate: 97,
        totalSessions: 280,
        faq: [
            { question: 'Do you work with teenagers?', answer: 'Yes, I specialize in working with teens aged 13–19 and young adults up to 25.' },
            { question: 'Will you share what we discuss with my parents?', answer: 'Confidentiality is paramount. I only share information if there is a safety concern, and I will discuss this with you first.' },
        ],
        availability: [
            { day: 'Tuesday', slots: ['4:00 PM', '6:00 PM', '7:00 PM'] },
            { day: 'Thursday', slots: ['4:00 PM', '5:00 PM', '7:00 PM'] },
            { day: 'Sunday', slots: ['10:00 AM', '12:00 PM', '2:00 PM'] },
        ],
    },
    {
        name: 'Dr. Kavya Nair',
        bio: 'As a couples and family therapist, I help partners rebuild trust, improve communication, and rediscover connection. I use Emotionally Focused Therapy (EFT) and the Gottman Method in my practice.',
        credentials: 'MSc Family Therapy, Manipal University, Gottman Level 2 Certified, EFT Trained',
        gender: 'Female',
        specialties: ['Couples Therapy', 'Family Therapy', 'Communication', 'Trust'],
        experienceYears: 11,
        price: 2500,
        profileImage: 'https://randomuser.me/api/portraits/women/28.jpg',
        ratingAverage: 4.8,
        ratingCount: 162,
        languages: ['English', 'Malayalam', 'Hindi'],
        sessionTypes: ['Video', 'Audio'],
        responseRate: 96,
        totalSessions: 440,
        faq: [
            { question: 'Do both partners need to attend every session?', answer: 'For couples therapy, yes ideally. But I also do individual sessions when needed as part of the process.' },
            { question: 'How many sessions does couples therapy take?', answer: 'Most couples see meaningful progress in 8–12 sessions, though this varies by situation.' },
        ],
        availability: [
            { day: 'Monday', slots: ['6:00 PM', '7:00 PM'] },
            { day: 'Wednesday', slots: ['6:00 PM', '7:30 PM'] },
            { day: 'Saturday', slots: ['9:00 AM', '11:00 AM', '1:00 PM'] },
        ],
    },
    {
        name: 'Dr. Vikram Rao',
        bio: 'I specialize in OCD, phobias, and health anxiety using Exposure and Response Prevention (ERP) therapy. I believe in practical, structured treatment that gives clients real tools to reclaim their lives.',
        credentials: 'PhD Psychology, IIT Bombay, IOCDF Certified OCD Specialist, ERP Practitioner',
        gender: 'Male',
        specialties: ['OCD', 'Phobias', 'Health Anxiety', 'ERP'],
        experienceYears: 12,
        price: 1800,
        profileImage: 'https://randomuser.me/api/portraits/men/76.jpg',
        ratingAverage: 4.9,
        ratingCount: 201,
        languages: ['English', 'Hindi', 'Marathi'],
        sessionTypes: ['Video', 'Audio'],
        responseRate: 94,
        totalSessions: 590,
        faq: [
            { question: 'What is ERP therapy?', answer: 'ERP involves gradually facing feared situations without performing compulsions, which helps break the OCD cycle over time.' },
            { question: 'Is ERP difficult?', answer: 'It can feel challenging at first, but we move at your pace and I provide full support throughout the process.' },
        ],
        availability: [
            { day: 'Monday', slots: ['10:00 AM', '12:00 PM', '2:00 PM'] },
            { day: 'Thursday', slots: ['9:00 AM', '11:00 AM', '3:00 PM'] },
            { day: 'Saturday', slots: ['10:00 AM', '12:00 PM'] },
        ],
    },
    {
        name: 'Dr. Ananya Bose',
        bio: 'I help professionals and executives manage burnout, workplace stress, and career transitions. My coaching-therapy hybrid approach focuses on both emotional wellbeing and practical performance strategies.',
        credentials: 'MBA + MSc Occupational Psychology, ISB Hyderabad, ICF Certified Coach',
        gender: 'Female',
        specialties: ['Burnout', 'Workplace Stress', 'Career Transitions', 'Executive Coaching'],
        experienceYears: 9,
        price: 3000,
        profileImage: 'https://randomuser.me/api/portraits/women/12.jpg',
        ratingAverage: 4.7,
        ratingCount: 119,
        languages: ['English', 'Bengali', 'Hindi'],
        sessionTypes: ['Video', 'Audio'],
        responseRate: 93,
        totalSessions: 310,
        faq: [
            { question: 'Is this therapy or coaching?', answer: 'It is a hybrid — we address emotional root causes (therapy) while also working on practical strategies and goals (coaching).' },
            { question: 'Can my employer cover this?', answer: 'Many corporate wellness programs cover these sessions. I can provide invoices for reimbursement.' },
        ],
        availability: [
            { day: 'Tuesday', slots: ['7:00 AM', '8:00 AM', '7:00 PM'] },
            { day: 'Thursday', slots: ['7:00 AM', '8:00 AM', '7:00 PM'] },
            { day: 'Saturday', slots: ['9:00 AM', '10:00 AM', '11:00 AM'] },
        ],
    },
    {
        name: 'Dr. Sameer Joshi',
        bio: 'I work with individuals facing addiction and substance use challenges, using a compassionate, non-shaming approach rooted in motivational interviewing and harm reduction principles.',
        credentials: 'MD Psychiatry, KEM Mumbai, Addiction Psychiatry Fellowship, CRAFT Certified',
        gender: 'Male',
        specialties: ['Addiction', 'Substance Use', 'Harm Reduction', 'Recovery'],
        experienceYears: 15,
        price: 2200,
        profileImage: 'https://randomuser.me/api/portraits/men/41.jpg',
        ratingAverage: 4.8,
        ratingCount: 176,
        languages: ['English', 'Hindi', 'Marathi'],
        sessionTypes: ['Video', 'In-person'],
        responseRate: 91,
        totalSessions: 720,
        faq: [
            { question: 'Do I need to be sober to start therapy?', answer: 'No. You can start wherever you are. We work together at whatever stage you are in your relationship with substances.' },
            { question: 'Do you involve family members?', answer: 'With your consent, yes. Family involvement often significantly improves outcomes.' },
        ],
        availability: [
            { day: 'Monday', slots: ['9:00 AM', '2:00 PM', '5:00 PM'] },
            { day: 'Wednesday', slots: ['9:00 AM', '1:00 PM', '4:00 PM'] },
            { day: 'Friday', slots: ['10:00 AM', '3:00 PM'] },
            { day: 'Saturday', slots: ['11:00 AM', '2:00 PM'] },
            { day: 'Sunday', slots: ['11:00 AM', '4:00 PM'] },
        ],
    },
    {
        name: 'Dr. Meera Pillai',
        bio: 'I specialize in grief, loss, and existential concerns. Whether you are mourning a person, a relationship, or a version of yourself, I offer a compassionate space to process and find meaning.',
        credentials: 'MA Existential Psychotherapy, Hyderabad University, Certified Grief Counsellor, ADEC Member',
        gender: 'Female',
        specialties: ['Grief', 'Loss', 'Existential Therapy', 'Meaning-Making'],
        experienceYears: 7,
        price: 1300,
        profileImage: 'https://randomuser.me/api/portraits/women/53.jpg',
        ratingAverage: 4.9,
        ratingCount: 134,
        languages: ['English', 'Malayalam', 'Tamil'],
        sessionTypes: ['Video', 'Audio'],
        responseRate: 98,
        totalSessions: 360,
        faq: [
            { question: 'Is there a timeline for grief?', answer: 'Absolutely not. Grief is not linear and there is no "right" way to grieve. We move at whatever pace feels right for you.' },
            { question: 'Can therapy help with anticipatory grief?', answer: 'Yes — if you are caring for a terminally ill loved one or facing your own diagnosis, therapy can be deeply supportive.' },
        ],
        availability: [
            { day: 'Tuesday', slots: ['10:00 AM', '12:00 PM', '3:00 PM'] },
            { day: 'Thursday', slots: ['11:00 AM', '2:00 PM', '5:00 PM'] },
            { day: 'Sunday', slots: ['10:00 AM', '12:00 PM'] },
        ],
    },
    {
        name: 'Dr. Aditya Verma',
        bio: 'I work with clients experiencing ADHD, learning differences, and neurodivergence. My strengths-based approach helps individuals harness their unique minds and build systems that work for them.',
        credentials: 'MEd Special Education, BHU Varanasi, ADHD Certified Clinician, Positive Psychology Practitioner',
        gender: 'Male',
        specialties: ['ADHD', 'Neurodivergence', 'Learning Differences', 'Executive Function'],
        experienceYears: 5,
        price: 1100,
        profileImage: 'https://randomuser.me/api/portraits/men/88.jpg',
        ratingAverage: 4.6,
        ratingCount: 87,
        languages: ['English', 'Hindi'],
        sessionTypes: ['Video', 'Audio', 'In-person'],
        responseRate: 96,
        totalSessions: 210,
        faq: [
            { question: 'Do you diagnose ADHD?', answer: 'I do not provide formal diagnoses, but I can guide you through the assessment process and work with your diagnosing clinician.' },
            { question: 'Do you work with adults with ADHD?', answer: 'Yes — in fact, most of my clients are adults who were diagnosed late and are learning to understand themselves for the first time.' },
        ],
        availability: [
            { day: 'Wednesday', slots: ['9:00 AM', '11:00 AM', '1:00 PM'] },
            { day: 'Friday', slots: ['10:00 AM', '12:00 PM', '3:00 PM'] },
            { day: 'Sunday', slots: ['11:00 AM', '1:00 PM', '3:00 PM'] },
        ],
    },
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rebalance');
        console.log('Connected to MongoDB');

        await Therapist.deleteMany({});
        console.log('Cleared existing therapists');

        const enriched = therapists.map((t) => {
            const weeklyAvailability = extractWeeklyTemplate(t);
            const availability = syncWeeklyToLegacy(weeklyAvailability);
            return { ...t, weeklyAvailability, availability };
        });

        await Therapist.insertMany(enriched);
        console.log('✅ Seeded 10 therapists successfully with independent weekday & weekend availability');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();