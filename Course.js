const mongoose = require("mongoose");

const CourseSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image : {
    type: String, 
    required : true
  },
  price : {
    type : Number , 
    required : true 
  },
  notes : {
    type : String , 
    default : ""
  },
  students : {
    type: Number , 
    default : 0 
  },
  rating : {
    type : Number, 
    default : 5 , 
  },
  date: {
    type: Date,
    default: Date.now,
  },
});
const Course = mongoose.model("Course", CourseSchema);

module.exports = Course; 