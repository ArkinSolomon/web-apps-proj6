// This script kind of never resolves but eh it gets them all in
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.ATLAS_CONNECTION_STRING);
const database = client.db('planner');
const courses = database.collection('courses');

const courseData = await Bun.file('course_data.json').json();
courseData.forEach(cd => {
  cd.yearsOffered = [2020, 2021, 2022, 2023, 2024];
  cd.isGenEd = false;
  cd.courseId = cd.id;
  delete cd.id;
});

await courses.insertMany(courseData);