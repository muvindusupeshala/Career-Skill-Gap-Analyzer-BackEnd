
const mongoose = require('mongoose');
const CareerPath = require('./models/CareerPath');
const dotenv = require('dotenv');
dotenv.config();

const careersData = [
  { title: 'Software Engineer', description: 'Design and develop software applications and systems.', typicalSalaryRange: 'LKR 80K200K/mo', demand: 'Very High', growth: '+22%', requiredSkills: [{skillName: 'JavaScript / TypeScript', requiredLevel: 3, importanceWeight: 3}, {skillName: 'React / Angular / Vue', requiredLevel: 3, importanceWeight: 3}, {skillName: 'Node.js / Backend Dev', requiredLevel: 3, importanceWeight: 3}, {skillName: 'SQL / Databases', requiredLevel: 2, importanceWeight: 2}, {skillName: 'Problem Solving', requiredLevel: 4, importanceWeight: 4}, {skillName: 'Communication', requiredLevel: 2, importanceWeight: 2}] },
  { title: 'Data Analyst', description: 'Analyze data to discover insights and support decisions.', typicalSalaryRange: 'LKR 70K160K/mo', demand: 'High', growth: '+20%', requiredSkills: [{skillName: 'Python', requiredLevel: 3, importanceWeight: 3}, {skillName: 'SQL / Databases', requiredLevel: 4, importanceWeight: 4}, {skillName: 'Data Analysis', requiredLevel: 4, importanceWeight: 4}, {skillName: 'Data Visualization', requiredLevel: 3, importanceWeight: 3}, {skillName: 'Statistics & Probability', requiredLevel: 3, importanceWeight: 3}, {skillName: 'Communication', requiredLevel: 3, importanceWeight: 3}] },
  { title: 'ML / AI Engineer', description: 'Build machine learning models and AI-powered systems.', typicalSalaryRange: 'LKR 100K250K/mo', demand: 'Very High', growth: '+35%', requiredSkills: [{skillName: 'Python', requiredLevel: 4, importanceWeight: 4}, {skillName: 'Machine Learning / AI', requiredLevel: 4, importanceWeight: 4}, {skillName: 'Data Analysis', requiredLevel: 3, importanceWeight: 3}, {skillName: 'Statistics & Probability', requiredLevel: 4, importanceWeight: 4}, {skillName: 'SQL / Databases', requiredLevel: 2, importanceWeight: 2}, {skillName: 'Problem Solving', requiredLevel: 4, importanceWeight: 4}] },
  { title: 'DevOps Engineer', description: 'Bridge dev and operations with automation and infrastructure.', typicalSalaryRange: 'LKR 90K220K/mo', demand: 'High', growth: '+28%', requiredSkills: [{skillName: 'Cloud Platforms (AWS/Azure/GCP)', requiredLevel: 4, importanceWeight: 4}, {skillName: 'Docker & Kubernetes', requiredLevel: 4, importanceWeight: 4}, {skillName: 'CI/CD Pipelines', requiredLevel: 4, importanceWeight: 4}, {skillName: 'Linux / System Admin', requiredLevel: 3, importanceWeight: 3}, {skillName: 'Problem Solving', requiredLevel: 3, importanceWeight: 3}, {skillName: 'Teamwork & Collaboration', requiredLevel: 3, importanceWeight: 3}] },
  { title: 'Full Stack Developer', description: 'Develop both frontend and backend parts of web applications.', typicalSalaryRange: 'LKR 85K210K/mo', demand: 'Very High', growth: '+25%', requiredSkills: [{skillName: 'JavaScript / TypeScript', requiredLevel: 4, importanceWeight: 4}, {skillName: 'React / Angular / Vue', requiredLevel: 3, importanceWeight: 3}, {skillName: 'Node.js / Backend Dev', requiredLevel: 3, importanceWeight: 3}, {skillName: 'SQL / Databases', requiredLevel: 3, importanceWeight: 3}, {skillName: 'Python', requiredLevel: 2, importanceWeight: 2}, {skillName: 'Problem Solving', requiredLevel: 3, importanceWeight: 3}] },
  { title: 'Cybersecurity Analyst', description: 'Protect systems and networks from cyber threats.', typicalSalaryRange: 'LKR 75K180K/mo', demand: 'High', growth: '+18%', requiredSkills: [{skillName: 'Linux / System Admin', requiredLevel: 3, importanceWeight: 3}, {skillName: 'Cloud Platforms (AWS/Azure/GCP)', requiredLevel: 2, importanceWeight: 2}, {skillName: 'Problem Solving', requiredLevel: 4, importanceWeight: 4}, {skillName: 'Communication', requiredLevel: 3, importanceWeight: 3}, {skillName: 'Time Management', requiredLevel: 3, importanceWeight: 3}] }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://supeshalamuvi_db_user:MsrMtk%402003@cluster0.qtvoy72.mongodb.net/careergapdb?retryWrites=true&w=majority');
  await CareerPath.deleteMany({});
  await CareerPath.insertMany(careersData);
  console.log('Successfully seeded careers');
  process.exit();
}
seed();

