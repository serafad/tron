const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const AutoSchema = new mongoose.Schema({
  
    userId: {
        type: String,
        required: true,
    
    },
    parent_userId: {
        type: String,
        required: true,
    
    },
    status: {
        type: String,
        required: false,
    },
    decp: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: false,
    },
   
    time : { type : Date, default: Date.now }
});


module.exports = mongoose.model("Autopool", AutoSchema);


















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