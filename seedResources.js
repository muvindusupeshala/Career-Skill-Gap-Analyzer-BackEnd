const mongoose = require('mongoose');
const LearningResource = require('./models/LearningResource');
const dotenv = require('dotenv');
dotenv.config();

const resourcesData = [
  { skill: 'JavaScript / TypeScript', title: 'The Complete JavaScript Course', provider: 'Udemy', type: 'Course', duration: '69 hrs', rating: 4.7, url: 'https://www.udemy.com/course/the-complete-javascript-course/', free: false },
  { skill: 'JavaScript / TypeScript', title: 'TypeScript Full Course', provider: 'freeCodeCamp', type: 'Video', duration: '4 hrs', rating: 4.8, url: 'https://www.youtube.com/watch?v=BwuLxPH8IDs', free: true },
  { skill: 'Python', title: 'Python for Everybody', provider: 'Coursera', type: 'Course', duration: '8 weeks', rating: 4.8, url: 'https://www.coursera.org/specializations/python', free: true },
  { skill: 'Python', title: 'Python Data Structures', provider: 'edX', type: 'Course', duration: '6 weeks', rating: 4.6, url: 'https://www.edx.org/course/python-basics-for-data-science', free: true },
  { skill: 'React / Angular / Vue', title: 'React - The Complete Guide', provider: 'Udemy', type: 'Course', duration: '48 hrs', rating: 4.7, url: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/', free: false },
  { skill: 'SQL / Databases', title: 'SQL for Data Science', provider: 'Coursera', type: 'Course', duration: '4 weeks', rating: 4.6, url: 'https://www.coursera.org/learn/sql-for-data-science', free: true },
  { skill: 'Machine Learning / AI', title: 'Machine Learning Specialization', provider: 'Coursera', type: 'Course', duration: '3 months', rating: 4.9, url: 'https://www.coursera.org/specializations/machine-learning-introduction', free: false },
  { skill: 'Data Analysis', title: 'Google Data Analytics', provider: 'Coursera', type: 'Certificate', duration: '6 months', rating: 4.8, url: 'https://www.coursera.org/professional-certificates/google-data-analytics', free: true },
  { skill: 'Cloud Platforms (AWS/Azure/GCP)', title: 'AWS Cloud Practitioner', provider: 'AWS Training', type: 'Certificate', duration: '3 months', rating: 4.7, url: 'https://aws.amazon.com/certification/certified-cloud-practitioner/', free: true },
  { skill: 'Docker & Kubernetes', title: 'Docker & Kubernetes: The Practical Guide', provider: 'Udemy', type: 'Course', duration: '24 hrs', rating: 4.7, url: 'https://www.udemy.com/course/docker-kubernetes-the-practical-guide/', free: false },
  { skill: 'Data Visualization', title: 'Data Visualization with Python', provider: 'Coursera', type: 'Course', duration: '3 weeks', rating: 4.5, url: 'https://www.coursera.org/learn/python-for-data-visualization', free: true },
  { skill: 'Communication', title: 'Effective Communication Skills', provider: 'LinkedIn Learning', type: 'Course', duration: '5 hrs', rating: 4.6, url: 'https://www.linkedin.com/learning/effective-communications', free: false }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://supeshalamuvi_db_user:MsrMtk%402003@cluster0.qtvoy72.mongodb.net/careergapdb?retryWrites=true&w=majority');
  await LearningResource.deleteMany({});
  await LearningResource.insertMany(resourcesData);
  console.log('Successfully seeded resources');
  process.exit();
}
seed();
