const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
  
  username: {
    type: String,
    required: true,
    min: 6,
    max: 15,
    unique:true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "admin","partner","store"],
    required: true,
  },
  name: {
    type: String,
    required: false,
  },
  profile: {
    type: String,
    required: false,
    default:"0",
  },
  parent_username: {
    type: String,
    required: false,

  },
  email: {
    type: String,
    required: false,
    unique:false,
  },
  count: {
    type: Number,
    required: false,
    default:0,
  },
  
  
  kyc_verified: {
    type: Number,
    required: false,
  },
  bank_verified: {
    type: Number,
    required: false,
  },
  balance: {
    type: Number,
    required: false,
    default:0
  },
  block: {
    type: Number,
    required: false,
    default:0
  },
  flush: {
    type: Number,
    required: false,
    default:1000
  },
  
  
      time : { type : Date, default: Date.now }


});

UserSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();
  bcrypt.hash(this.password, 10, (err, passwordHash) => {
    if (err) return next(err);
    this.password = passwordHash;
    next();
  });
});

UserSchema.methods.comparePassword = function (password, cb) {
  bcrypt.compare(password, this.password, (err, isMatch) => {
    if (err) return cb(err);
    else {
      if (!isMatch) return cb(null, isMatch);
      return cb(null, this);
    }
  });
};

module.exports = mongoose.model("User", UserSchema);


















// const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');

// const UserSchema = new mongoose.Schema({
//     username :{
//         type : String,
//         required : true,
//         min : 6,
//         max : 15
//     },
//     password : {
//         type : String,
//         required : true
//     },
//     role : {
//         type : String,
//         enum : ['user','admin'],
//         required: true
//     },
//     todos : [{type : mongoose.Schema.Types.ObjectId, ref: 'Todo'}]
// });

// UserSchema.pre('save',function(next){
//     if(!this.isModified('password'))
//         return next();
//     bcrypt.hash(this.password,10,(err,passwordHash)=>{
//         if(err)
//             return next(err);
//         this.password = passwordHash;
//         next();
//     });
// });

// UserSchema.methods.comparePassword = function(password,cb){
//     bcrypt.compare(password,this.password,(err,isMatch)=>{
//         if(err)
//             return cb(err);
//         else{
//             if(!isMatch)
//                 return cb(null,isMatch);
//             return cb(null,this);
//         }
//     });
// }

// module.exports = mongoose.model('User',UserSchema);