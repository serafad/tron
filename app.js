const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
require('dotenv/config');
const multer = require('multer');


const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
}



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid image type');

        if(isValid) {
            uploadError = null
        }
      cb(uploadError, 'public/uploads')
    },
    filename: function (req, file, cb) {
        
      const fileName = file.originalname.split(' ').join('-');
      const extension = FILE_TYPE_MAP[file.mimetype];
      cb(null, `${fileName}-${Date.now()}.${extension}`)
    }
  })
  
const uploadOptions = multer({ storage: storage })




app.use(cookieParser());
app.use(express.json());


const userRouter = require('./routes/User');
app.use('/user',userRouter);
const depositRouter = require('./routes/Deposit');
app.use('/deposit',depositRouter);



app.use(bodyParser.json());
app.use(morgan('tiny'));

// app.use(function(req,res,next) {
//     JWT.verify(req.cookies['token'], 'NoobCoder', function(err, decodedToken) {
//       if(err) { /* handle token err */ }
//       else {
//        req.userId = decodedToken.id;   // Add to req object
//        next();
//       }
//     });
//    });


// mongoose.connect( process.env.CONNECTION_STRING,{
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     useFindAndModify: false,
//     useCreateIndex: true
// },
// ()=>{
//     console.log('successfully connected to database');
// });



//Database
mongoose.connect("mongodb://127.0.0.1:27017/tronX", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
})
.then(() => {
    console.log('Database connection is ready..');
})
.catch((err) => {
    console.log(err);
})


//Server
app.listen(5001,()=>{
    console.log('express server started');
});