const express = require("express");
const userRouter = express.Router();
const passport = require("passport");
const passportConfig = require("../passport");
const JWT = require("jsonwebtoken");
const User = require("../models/User");
const Company = require("../models/Companyinfo");
const Deposit = require("../models/deposit");
const Level = require("../models/level");
const Autopool = require("../models/autopool");
const Ledger = require("../models/ledger");
const Matrix = require("../models/matrix");
const Withdraw = require("../models/withdraw");
const mongoose = require("mongoose");
const { ObjectId } = require('mongodb');
const multer = require('multer');
const uuidv4 = require('uuid');
var request = require("request");
const { toHex, fromHex } = require('tron-format-address')
const TronWeb = require('tronweb')
const Constant = require("../models/constant");
const { hash } = require("bcrypt");
const autopool = require("../models/autopool");
const HttpProvider = TronWeb.providers.HttpProvider; // This provider is optional, you can just use a url for the nodes instead
const fullNode = new HttpProvider('https://api.trongrid.io'); // Full node http endpoint
const solidityNode = new HttpProvider('https://api.trongrid.io'); // Solidity node http endpoint
const eventServer = 'https://api.trongrid.io/'; // Contract events http endpoint

const privateKey = 'e76561249ccd55b7b18027a231e212e666464240766b612082505071ba16e272';

const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
    headers: { "TRON-PRO-API-KEY": '1580da2c-063d-46a5-b1e3-814998853c1c' },
    privateKey: 'e76561249ccd55b7b18027a231e212e666464240766b612082505071ba16e272'
})



const signToken = (userID) => {
  return JWT.sign(
    {
      iss: "NoobCoder",
      sub: userID,
    },
      "NoobCoder",
     { expiresIn: "1h" }
  );
};

userRouter.post("/deposit", passport.authenticate("jwt", { session: false }),async (req, res) =>  {
  console.log(req.body);
   tronWeb.trx.getTransaction(req.body.hash,(err, balance) => {
    console.log(err);
     
     if (err || balance.Error) {
       const newDeposit = new Deposit({
         hash: req.body.hash,
         userId: req.body.id,
         status: "Failed",
         decp: "Invalid Transaction Id"
       });

       newDeposit.save((err) => {
         if (err) {
           ////////console.log(err)
           res.status(500).json({ msgBody: "Error!!! Contact Admin", msgError: true });
         }else{
            res.status(500).json({ msgBody: "Invalid Transaction Id", msgError: true });
       ////////console.log({ msgBody: "Invalid Transaction Id", msgError: true});
            }
       });
    }
else {
       Deposit.findOne({ "hash": req.body.hash,"status":"Success" }, (err, deposit) => {
         if (err) {

           res.status(500).json({ msgBody: "Error!!! Contact Admin", msgError: true });
         }
         if (deposit) {
           console.log(deposit)
           const newDeposit = new Deposit({
             hash: req.body.hash,
             userId: req.body.id,
             status: "Failed",
             decp: "Duplicate Entry"
           });

           newDeposit.save((err) => {
             if (err) {
               ////////console.log(err)
               res
                 .status(500)
                 .json({ msgBody: "Error!!! Contact Admin", msgError: true });
             } else {
               res.status(500)
                 .json({ msgBody: "Tranx Id already used is already taken", msgError: true });
               ////////console.log({ msgBody: "Tranx Id already used is already taken", msgError: true });

             }
           });
         }
       
    else {
           Constant.findOne({}, (err, constant) => {
             if (err) {
               res
                 .status(500)
                 .json({ msgBody: "Error!!! Contact Admin", msgError: true });
             } else {
               const value = constant.value;
               const amount = balance.raw_data.contract[0].parameter.value.amount;

               if (amount >= value) {
                 const address = balance.raw_data.contract[0].parameter.value.to_address;
                 const myadress = constant.trx;
                 const myhex = tronWeb.address.toHex(myadress)
                 console.log(myhex)
                 if (myhex == address) {
                  // User.find({}).sort({ "date_time" : 1 }).limit(1)
                  Deposit.aggregate([
                    { $match: { count: {$lt : 3} }},
                    { $sort: { time: 1 } },
                    { $limit: 1 }
                    ],(err,depo)=>{
                     //console.log('de' + depo[0])
                     const autocount = depo[0].count + 1;
                    Deposit.updateOne({"_id":depo[0]._id},{$set:{"count":autocount}},(err)=>{

                    })
                   const newDeposit = new Deposit({
                     hash: req.body.hash,
                     userId: req.body.id,
                     status: "Success",
                     decp: "Success",
                     count:0,
                     autopool:depo[0]._id
                   });
                 

                   newDeposit.save((err,depoo) => {
                     if (err) {
                       ////////console.log(err)
                       res
                         .status(500)
                         .json({ msgBody: "Error!!! Contact Admin", msgError: true });
                     } else {
                      // Level Income
                      ////////console.log("depo"+depoo)
                      ////////console.log(req.body.id)
                      User.findById({"_id":req.body.id},(err,user)=>{
                        if (err) {
                          ////////console.log(err)
                          res
                            .status(500)
                            .json({ msgBody: "Error!!! Contact Admin", msgError: true });
                        }
                        else{
                          ////////console.log(user.parent_username)
                          //Level Income
                          const newLevel = new Level({
                            userId : user.username,
                            parent_userId:user.parent_username,
                            amount:constant.level,
                            status:"Success",
                            decp:"Joining Bonus" + constant.level + " trx paid to " + user.parent_username + "from " + user.username

                          });
                          newLevel.save();
                          const newLedger = new Ledger({
                            userId : user.username,
                            parent_userId:user.parent_username,
                            amount:constant.level,
                            type:"Level",
                            decp:"Joining Bonus" + constant.level + " trx paid to " + user.parent_username + "from " + user.username

                          });
                          newLedger.save();
                          User.findOne({username:user.parent_username},(err,parent)=>{
                            const balance = parent.balance + constant.level
                            const count = parent.count + 1
                          ////////console.log(count)
                          User.updateOne({"username":user.parent_username},{$set:{"balance":balance,"count":count}},(err,levbal)=>{

                          })
                             const matverify = count/3
                             if (Number.isInteger(matverify)){
                               const newMatrix = new Matrix({
                            userId : user.username,
                            parent_userId:user.parent_username,
                            amount:constant.matrix,
                            status:"Success",
                            decp:"Trinary Bonus" + constant.matrix + " trx paid to " + user.parent_username + "from " + user.username

                          });
                          newMatrix.save();
                          const newLedgerMatrix = new Ledger({
                            userId : user.username,
                            parent_userId:user.parent_username,
                            amount:constant.matrix,
                            type:"Matrix",
                            decp:"Trinary Bonus" + constant.matrix + " trx paid to " + user.parent_username + "from " + user.username

                          });
                          newLedgerMatrix.save();

                          const matrixbalance = balance + constant.matrix
                            //const count = parent.count + 1
                          //@ts-expect-error////////console.log(count)
                          User.updateOne({"username":user.parent_username},{$set:{"balance":matrixbalance}},(err,levbal)=>{

                          })

                             }//matrix condition ends here
                            // const myProp = depo[0];
                           // console.log('cc' +depoo.autopool)
                            Deposit.find({"_id":depoo.autopool},(err,autouser)=>{
                              console.log('cc' +autouser)
                              if(typeof autouser !== 'undefined' ){
                            const pool = 'autopool';
                             if (pool in depoo && depoo.autopool !== '0' && autouser[0].status == 'Success') {
                               ////console.log("soyu" +depoo)
                              const newAutopool1 = new Autopool({
                                userId : user.username,
                                parent_userId:autouser[0].userId,
                                amount:constant.autopool,
                                status:"Success",
                                decp:"Autoo pool from" + constant.autopool + " trx paid to " + depoo.autopool + "from " + depoo._id
    
                              });
                              newAutopool1.save((err)=>{
                               // console.log(err)
                              });
                              const newLedgerAutopool1 = new Ledger({
                                userId : user.username,
                                parent_userId:autouser[0].userId,
                                amount:constant.autopool,
                                type:"Autopool",
                                decp:"Autoo pool from" + constant.autopool + " trx paid to " + depoo.autopool + "from " + depoo._id
    
                              });
                              newLedgerAutopool1.save();
                             // if('autopool' in depo[0]){
                              // console.log(autouser[0])
                              
                              //console.log('user' + autouser[0]);
                              if('userId' in autouser[0]){
                              User.find({"_id":autouser[0].userId},(err,pooluser1)=>{
                               // const obj = JSON.parse(pooluser1);
                               //console.log('user' + autouser[0].userId);
                                const poolbal = pooluser1[0].balance + constant.autopool;
                                console.log("poolbal1 :" + poolbal)

                                User.updateOne({"_id": autouser[0].userId},{$set:{"balance":poolbal}},(err,poolbala)=>{
                                  
                                  res.send({ msgBody: "Deposit Sucessfull", msgError: false});

//////////////// Second
Deposit.find({"_id":autouser[0].autopool},(err,autouser1)=>{ 
console.log('auto' + autouser1)
  if(typeof autouser1!== 'undefined' ){
  //change
const pool = 'autopool';
if (pool in autouser[0] && autouser[0].autopool !== "0" && autouser1[0].status == "Success") {
////console.log("soyu" + autouser[0])
 const newAutopool2 = new Autopool({
   userId : user.username,
   parent_userId:autouser1[0].userId,//change
   amount:constant.autopool,
   status:"Success",
   decp:"Autoo pool " + constant.autopool + " trx paid to " + autouser[0].autopool + "from " + depoo._id //change

 });
    newAutopool2.save();
    console.log('newauto' + newAutopool2)
 const newLedgerAutopool1 = new Ledger({
    userId : user.username,
    parent_userId:autouser1[0].userId,//change
    amount:constant.autopool,
    type:"Autopool",
    decp:"Autoo pool " + constant.autopool + " trx paid to " + autouser[0].autopool + "from " + depoo._id //change

 });
 newLedgerAutopool1.save();
 //if('autopool' in depo[0]){
 
  // ////console.log('user' + autouser1[0].userId);
 //  if('userId' in autouser1[0])
 if('userId' in autouser1[0]){
 User.find({"_id":autouser1[0].userId},(err,pooluser2)=>{
  // const obj = JSON.parse(pooluser1);
  // ////console.log('user' + pooluser1[0]);
   const poolbal1 = pooluser2[0].balance + constant.autopool;
   console.log("poolbal2 : " + poolbal1)

   User.updateOne({"_id":autouser1[0].userId},{$set:{"balance":poolbal1}},(err,poolbala)=>{
  // console.log("poolbal2 : " + err)
    res.end({ msgBody: "Deposit Sucessfull", msgError: false});
   // console.log("poolbal2 : " + poolbal1)
Deposit.find({"_id":autouser1[0].autopool},(err,autouser2)=>{ //change
  if(typeof autouser2 !== 'undefined' ){
  const pool = 'autopool';
if (pool in autouser1[0]&& autouser1[0].autopool !== "0" && autouser2[0].status == "Success") {
////console.log("soyu" + autouser1[0])
 const newAutopool3 = new Autopool({
   userId :user.username,
   parent_userId:autouser2[0].userId,//change
   amount:constant.autopool,
   status:"Success",
   decp:"Autoo pool " + constant.autopool + " trx paid to " + autouser1[0].autopool + "from " + depoo._id //change

 });
 newAutopool3.save();
 const newLedgerAutopool1 = new Ledger({
   userId :user.username,
   parent_userId:autouser2[0].userId,//change
   amount:constant.autopool,
   type:"Autopool",
   decp:"Autoo pool " + constant.autopool + " trx paid to " + autouser1[0].autopool + "from " + depoo._id //change

 });
 newLedgerAutopool1.save();
 //if('autopool' in autouser1[0]){
 
 //  ////console.log('user' + autouser2[0].userId);
 //const userId = 'userId';
 //if(userId in autouser2[0])
 if('userId' in autouser2[0]){
 User.find({"_id":autouser2[0].userId},(err,pooluser3)=>{
  // const obj = JSON.parse(pooluser1);
   //////console.log('user' + pooluser1[0]);
   const poolbal2 = pooluser3[0].balance + constant.autopool;
   console.log("poolbal3 : " + poolbal2)

   User.updateOne({"_id":autouser2[0].userId},{$set:{"balance":poolbal2}},(err,poolbala)=>{
    res.end({ msgBody: "Deposit Sucessfull", msgError: false});

     //fourth autopool
     Deposit.find({"_id":autouser2[0].autopool},(err,autouser3)=>{ 
      if(typeof autouser3 !== 'undefined' ){//change
     const pool = 'autopool';
if (pool in autouser2[0]&& autouser2[0].autopool !== "0" && autouser3[0].status == "Success") {
////console.log("soyu" + autouser2[0])
 const newAutopool4 = new Autopool({
   userId : user.username,
   parent_userId:autouser3[0].userId,//change
   amount:constant.autopool,
   status:"Success",
   decp:"Autoo pool " + constant.autopool + " trx paid to " + autouser2[0].autopool + "from " + depoo._id //change

 });
 newAutopool4.save();
 const newLedgerAutopool2 = new Ledger({
  userId : user.username,
  parent_userId:autouser3[0].userId,//change
   amount:constant.autopool,
   type:"Autopool",
   decp:"Autoo pool " + constant.autopool + " trx paid to " + autouser2[0].autopool + "from " + depoo._id //change

 });
 newLedgerAutopool2.save();
 //if('autopool' in autouser2[0]){
 
 ////console.log('user' + autouser3[0].userId);
 //if('userId' in autouser3[0])
 if('userId' in autouser3[0] && depoo.autopool !== "0"){
 User.find({"_id":autouser3[0].userId},(err,pooluser4)=>{
  // const obj = JSON.parse(pooluser1);
   //////console.log('user' + pooluser1[0]);
   const poolbal4 = pooluser4[0].balance + constant.autopool;
   console.log("poolbal4 : " + poolbal4)

   User.updateOne({"_id":autouser3[0].userId},{$set:{"balance":poolbal4}},(err,poolbala)=>{
    res.end({ msgBody: "Deposit Sucessfull", msgError: false});

   
        //fifth auto pool
        Deposit.find({"_id":autouser3[0].autopool},(err,autouser5)=>{ //change
          if(typeof autouser5 !== 'undefined' ){
        const pool = 'autopool';
        if (pool in autouser3[0]&& autouser3[0].autopool !== "0" && autouser5[0].status == "Success") {
        ////console.log("soyu" + autouser3[0])
         const newAutopool5 = new Autopool({
           userId : user.username,
           parent_userId:autouser5[0].userId,//change
           amount:constant.autopool,
           status:"Success",
           decp:"Autoo pool " + constant.autopool + " trx paid to " + autouser3[0].autopool + "from " + depoo._id //change
        
         });
         newAutopool5.save();
         const newLedgerAutopool2 = new Ledger({
          userId : user.username,
          parent_userId:autouser5[0].userId,//change
           amount:constant.autopool,
           type:"Autopool",
           decp:"Autoo pool " + constant.autopool + " trx paid to " + autouser3[0].autopool + "from " + depoo._id //change
        
         });
         newLedgerAutopool2.save();
         //if('autopool' in autouser3[0]){
         
         //  ////console.log('user' + autouser2[0].userId);
         //if('userId' in autouser5[0])
         if('userId' in autouser5[0]){
         User.find({"_id":autouser5[0].userId},(err,pooluser5)=>{
          // const obj = JSON.parse(pooluser1);
           //////console.log('user' + pooluser1[0]);
           const poolbal5 = pooluser5[0].balance + constant.autopool;
           console.log("poolbal5 : " + poolbal5)
        
           User.updateOne({"_id":autouser5[0].userId},{$set:{"balance":poolbal5}},(err,poolbala)=>{
            res.end({ msgBody: "Deposit Sucessfull", msgError: false});

            // sixth auto poll
            Deposit.find({"_id":autouser5[0].autopool},(err,autouser6)=>{
              if(typeof autouser6 !== 'undefined' ){
            const pool = 'autopool';
        if (pool in autouser5[0]&& autouser5[0].autopool !== "0" && autouser6[0].status == "Success") {
        ////console.log("soyu" + autouser5[0])
         const newAutopool6 = new Autopool({
           userId : user.username,
           parent_userId:autouser6[0].userId,//change
           amount:constant.autopool,
           status:"Success",
           decp:"Autoo pool " + constant.autopool + " trx paid to " + autouser5[0].autopool + "from " + depoo._id //change
        
         });
         newAutopool6.save();
         const newLedgerAutopool2 = new Ledger({
          userId : user.username,
          parent_userId:autouser6[0].userId,//change
           amount:constant.autopool,
           type:"Autopool",
           decp:"Autoo pool " + constant.autopool + " trx paid to " + autouser5[0].autopool + "from " + depoo._id //change
        
         });
         newLedgerAutopool2.save();
         //if('autopool' in depo[0]){
          //change
         //  ////console.log('user' + autouser2[0].userId);
         //if('userId' in autouser6[0])
         if('userId' in autouser6[0]){
         User.find({"_id":autouser6[0].userId},(err,pooluser6)=>{
          // const obj = JSON.parse(pooluser1);
           //////console.log('user' + pooluser1[0]);
           const poolbal6 = pooluser6[0].balance + constant.autopool;
           console.log("poolbal6 : " + poolbal6)
        
           User.updateOne({"_id":autouser6[0].userId},{$set:{"balance":poolbal6}},(err,poolbala)=>{
            res.end({ msgBody: "Deposit Sucessfull", msgError: false});

            //Seventh auto pool
            Deposit.find({"_id":autouser6[0].autopool},(err,autouser7)=>{ 
              if(typeof autouser7 !== 'undefined' ){
              //change
            const pool = 'autopool';
            if (pool in autouser6[0]&& autouser6[0].autopool !== "0"&& autouser7[0].status == "Success") {
            ////console.log("soyu" + autouser6[0])
             const newAutopool7 = new Autopool({
               userId : user.username,
               parent_userId:autouser7[0].userId,//change
               amount:constant.autopool,
               status:"Success",
               decp:"Autoo pool " + constant.autopool + " trx paid to " + autouser6[0].autopool + "from " + depoo._id //change
            
             });
             newAutopool7.save();
             const newLedgerAutopool2 = new Ledger({
              userId : user.username,
              parent_userId:autouser7[0].userId,//change
               amount:constant.autopool,
               type:"Autopool",
               decp:"Autoo pool " + constant.autopool + " trx paid to " + autouser6[0].autopool + "from " + depoo._id //change
            
             });
             newLedgerAutopool2.save();
            // if('autopool' in autouser6[0]){
             
             //  ////console.log('user' + autouser2[0].userId);
            // if('userId' in autouser7[0])
            if('userId' in autouser7[0]){
             User.find({"_id":autouser7[0].userId},(err,pooluser7)=>{
              // const obj = JSON.parse(pooluser1);
               //////console.log('user' + pooluser1[0]);
               const poolbal7 = pooluser7[0].balance + constant.autopool;
               console.log("poolbal7 : " + poolbal7)
            
               User.updateOne({"_id":autouser7[0].userId},{$set:{"balance":poolbal7}},(err,poolbala)=>{
                res.end({ msgBody: "Deposit Sucessfull", msgError: false});

               // Eighth auto pool
               Deposit.find({"_id":autouser7[0].autopool},(err,autouser8)=>{ //change
                if(typeof autouser8 !== 'undefined' ){
               const pool = 'autopool';
            if (pool in autouser7[0] && autouser7[0].autopool !== "0"&& autouser8[0].status == "Success") {
           ////console.log("soyu" + autouser7[0])
             const newAutopool8 = new Autopool({
               userId : user.username,
               parent_userId:autouser8[0].userId,//change
               amount:constant.autopool,
               status:"Success",
               decp:"Autoo pool " + constant.autopool + " trx paid to " + autouser7[0].autopool + "from " + depoo._id //change
            
             });
             newAutopool8.save();
             const newLedgerAutopool2 = new Ledger({
              userId : user.username,
              parent_userId:autouser8[0].userId,//change
               amount:constant.autopool,
               type:"Autopool",
               decp:"Autoo pool " + constant.autopool + " trx paid to " + autouser7[0].autopool + "from " + depoo._id //change
            
             });
             newLedgerAutopool2.save();
             
             
             //  ////console.log('user' + autouser2[0].userId);
             //if('userId' in autouser8[0])
             if('userId' in autouser8[0]){
             User.find({"_id":autouser8[0].userId},(err,pooluser8)=>{
              // const obj = JSON.parse(pooluser1);
               //////console.log('user' + pooluser1[0]);
               const poolbal8 = pooluser8[0].balance + constant.autopool;
               console.log("poolbal8 : " + poolbal8)
            
               User.updateOne({"_id":autouser8[0].userId},{$set:{"balance":poolbal8}},(err,poolbala)=>{
                res.end({ msgBody: "Deposit Sucessfull", msgError: false});

            
             })
             })
             }
            
            }else{
              User.find({"_id":constant.mainuser},(err,mainuser)=>{
                const poolbal = mainuser[0].balance + 10;
                console.log("poolbal1 :" + poolbal)
                User.updateOne({"_id": constant.mainuser},{$set:{"balance":poolbal}},(err,poolbala)=>{
                  res.end({ msgBody: "Deposit Sucessfull", msgError: false});

                   })
                  })
                }
            }
          })//Eight auto pool
            
             })
             })
             }
            
            }else{
              User.find({"_id":constant.mainuser},(err,mainuser)=>{
                const poolbal = mainuser[0].balance + 20;
                console.log("poolbal1 :" + poolbal)
                User.updateOne({"_id": constant.mainuser},{$set:{"balance":poolbal}},(err,poolbala)=>{
                  res.end({ msgBody: "Deposit Sucessfull", msgError: false});

                   })
                  })
            }
          }
          })// seventh auto pool
        
         })
         })
         }
        
        }else{
          User.find({"_id":constant.mainuser},(err,mainuser)=>{
            const poolbal = mainuser[0].balance + 30;
            console.log("poolbal1 :" + poolbal)
            User.updateOne({"_id": constant.mainuser},{$set:{"balance":poolbal}},(err,poolbala)=>{
              res.end({ msgBody: "Deposit Sucessfull", msgError: false});

               })
              })
        }
      }
      })//sixth autopool
        
         })
         })
         }
        
        }else{
          User.find({"_id":constant.mainuser},(err,mainuser)=>{
            const poolbal = mainuser[0].balance + 40;
            console.log("poolbal1 :" + poolbal)
            User.updateOne({"_id": constant.mainuser},{$set:{"balance":poolbal}},(err,poolbala)=>{
              res.end({ msgBody: "Deposit Sucessfull", msgError: false});

               })
              })
        }
      }
      })//fifth auto pool
    
    //fifth auto pool

 })
 })
 }

}else{

  User.find({"_id":constant.mainuser},(err,mainuser)=>{
    const poolbal = mainuser[0].balance + 50;
    console.log("poolbal1 :" + poolbal)
    User.updateOne({"_id": constant.mainuser},{$set:{"balance":poolbal}},(err,poolbala)=>{
      res.end({ msgBody: "Deposit Sucessfull", msgError: false});

       })
      })
}
     }
})//fourth auto pool

 })
 })
 }

}
else{

  User.find({"_id":constant.mainuser},(err,mainuser)=>{
    const poolbal = mainuser[0].balance + 60;
    console.log("poolbal1 :" + poolbal)
    User.updateOne({"_id": constant.mainuser},{$set:{"balance":poolbal}},(err,poolbala)=>{
      res.end({ msgBody: "Deposit Sucessfull", msgError: false});

       })
      })

}
}
})//Third autoppol ends here



 })
 })
 }

}
else{

  User.find({"_id":constant.mainuser},(err,mainuser)=>{
    const poolbal = mainuser[0].balance + 70;
    console.log("poolbal1 :" + poolbal)
    User.updateOne({"_id": constant.mainuser},{$set:{"balance":poolbal}},(err,poolbala)=>{
      res.end({ msgBody: "Deposit Sucessfull", msgError: false});

       })
      })

}
}
})//second autoppol ends here




                                })
                              
                              })
                            }
    //first apuropool else
                            }else{
                              User.find({"_id":constant.mainuser},(err,mainuser)=>{
                                console.log(constant.mainuser)
                              const poolbal = mainuser[0].balance + 80;
                              //console.log("poolbal1 :" + poolbal)
                              User.updateOne({"_id": constant.mainuser},{$set:{"balance":poolbal}},(err,poolbala)=>{
                                res.status(200).json({ msgBody: "Deposit Sucessfull", msgError: false});

                                 })
                                })

                              }
                            }
                             
                          })

                          })
                          
                          // Deposit.find({}, {$sort:  ['time', 'dsc']},{limit:1}, (err,docs)=> {
                          //   ////////console.log(docs)
                          // });
                          
                            
                          
                          
                        }//level else

                      })//Level income ends here
                     }
                   });
                  })
                 }
                 else {
                    const newDeposit = new Deposit({
             hash: req.body.hash,
             userId: req.body.id,
             status: "Failed",
             decp: "Invalid Account"
           });

           newDeposit.save((err) => {
             if (err) {
               ////////console.log(err)
               res
                 .status(500)
                 .json({ msgBody: "Error!!! Contact Admin", msgError: true });
             } else {
               res.status(500)
                 .json({ msgBody: "Invalid Account", msgError: true });
               ////////console.log({ msgBody: "Invalid Account", msgError: true });

             }
           });
                 }
                 
                 
               }
               else {
                  const newDeposit = new Deposit({
             hash: req.body.hash,
             userId: req.body.id,
             status: "Failed",
             decp: "Lesser Value"
           });

           newDeposit.save((err) => {
             if (err) {
               ////////console.log(err)
               res
                 .status(500)
                 .json({ msgBody: "Error!!! Contact Admin", msgError: true });
             } else {
               res.status(500)
                 .json({ msgBody: "Lesser Value", msgError: true });
               ////////console.log({ msgBody: "Lesser Value", msgError: true });

             }
           });
                 
               }
               
             }
             
     })


    }
         
       })
     }

   //  ////////console.log(balance);
    // ////////console.log(balance.raw_data.contract[0]);
  });
  //  tronWeb.trx.sendTransaction("TYg989KcbyQN3WS7hWZZHnAgPnu58ZGQ28", 1000, "TAVi9ZqanzH8A4o1NctGJg8Lp5bfWs4tke", (err, balance) => {
//         if (err)
//             return ////////console.error(err);

//         ////////console.log({balance});
//  });
  const address = 'TYg989KcbyQN3WS7hWZZHnAgPnu58ZGQ28';
 // tronWeb.transactionBuilder.sendTrx("TAVi9ZqanzH8A4o1NctGJg8Lp5bfWs4tke", 1000000000, "TYg989KcbyQN3WS7hWZZHnAgPnu58ZGQ28").then(result => { ////////console.log(result) });
  // tronWeb.trx.getTransactionInfo("8ae55933153268b289891692b0d58552f04d2b59a508001a58e0766c9341238f").then(result => {////////console.log(result)});
 // tronWeb.trx.getTransactionInfo("abac5207e1a9eabbd2525ad2c5f4d21eabae3d9844f71568463624e147e55bd6");
 // tronWeb.trx.getTransactionsRelated("TYg989KcbyQN3WS7hWZZHnAgPnu58ZGQ28", "all", 30, 0).then(result => { ////////console.log(result) });


    // The majority of the function calls are asynchronus,
    // meaning that they cannot return the result instantly.
    // These methods therefore return a promise, which you can await.
    // const balance = await tronWeb.trx.getBalance(address);
    // ////////console.log({balance});

    // // You can also bind a `then` and `catch` method.
    // tronWeb.trx.getBalance(address).then(balance => {
    //     ////////console.log({balance});
    // }).catch(err => ////////console.error(err));

    // If you'd like to use a similar API to Web3, provide a callback function.
    // tronWeb.trx.getBalance(address, (err, balance) => {
    //     if (err)
    //         return ////////console.error(err);

    //     ////////console.log({balance});
    // });
//  tronWeb.trx.sendTransaction("TYg989KcbyQN3WS7hWZZHnAgPnu58ZGQ28", 1000, "TAVi9ZqanzH8A4o1NctGJg8Lp5bfWs4tke", (err, balance) => {
//         if (err)
//             return ////////console.error(err);

//         ////////console.log({balance});
//  });
  // tronWeb.trx.getTransaction('8ae55933153268b289891692b0d58552f04d2b59a508001a58e0766c9341238f',(err, balance) => {
  //       if (err)
  //           return ////////console.error(err);

  //       ////////console.log(balance.raw_data.contract[0]);
  // });
// const tradeobj = await tronWeb.transactionBuilder.sendTrx("TGidRPtdiWXqmoU9wRJzw7es4ZY9nHLRvf", 100000,"TAVi9ZqanzH8A4o1NctGJg8Lp5bfWs4tke",1);
// const signedtxn = await tronWeb.trx.sign(tradeobj, privateKey);
// const receipt = await tronWeb.trx.sendRawTransaction(signedtxn,(err, balance) => {
//   if (err)
//     return ////////console.error(err);

//       ////////console.log({balance});
// });
//////////console.log(receipt)
// const address = 'TAVi9ZqanzH8A4o1NctGJg8Lp5bfWs4tke'
// const addressBase58 = toHex(address)
// const addressHex = fromHex(addressBase58)
// ////////console.log(addressBase58)
//////////console.log(address === addressHex)
//  ////////console.log(toHex(addressHex))
  
// var options = { method: 'POST',
//   url: 'https://api.trongrid.io/wallet/createtransaction',
//   headers: {  
//      'TRON-PRO-API-KEY': '1580da2c-063d-46a5-b1e3-814998853c1c',
//      'Content-Type': 'application/json' 
// },
//   body: { 
//       to_address:'0xf91095a991c9963a8ec937393493cb1c86dc37f8',
//       owner_address: '0x05c4cf2d480dfa15cb331bb677550719447c6f3e',
//      amount: 1 
// },
//   json: true 
// };

// request(options, function (error, response, body) {
//   if (error) throw new Error(error);

//   ////////console.log(body);
// });
//   res
//         .status(200)
//         .json({ msgBody: "no user available", msgError: false,value:"2","role":"user"});
   
});

userRouter.post("/checkuser", (req, res) => {
  console.log(req.body);
  const {
    username
  } = req.body;
  User.findOne({ username }, (err, user) => {
    ////////console.log(user);
    if (err)
      res
        .status(500)
        .json({ msgBody: "Error has occured", msgError: true,value:"0","role":"empty"});
    if (user)
      res.status(400).json({ msgBody: "Username is already taken", msgError: true,value:"1" 
      ,role:user.role});
    else {
      res
        .status(200)
        .json({ msgBody: "no user available", msgError: false,value:"2","role":"user","user":user});
    }
  })
});

userRouter.post("/constant", (req, res) => {
  const {
    mongoUrl,
    trx,
    value
  } = req.body;

  const newConstant = new Constant({
    mongoUrl,
    trx,
    value
  });
  newConstant.save((err,constant) => {
    if (err)
      return ({ message: err })
    ////////console.log(constant)
  })

})

userRouter.post("/getConstant", (req, res) => {
  
  Constant.find({}, (err, constant) => {
    if (err)
      res
        .status(500)
        .json({ message: { msgBody: "Error has occured", msgError: true } });
    if (constant)
      res.status(200).json({
        message: { msgBody: "Username is already taken", msgError: true,constant:constant },
      });
 })
})

userRouter.post("/register", (req, res) => {
  const {
    username,
    password,
    cpassword,
    parent_username,
    email,
    phone,
    role
  } = req.body; 
 // const role = "user";
  const kyc_verified = "0";
  const bank_verified = "0";
  const eventt = "1"

  User.findOne({ username }, (err, user) => {
    if (err){
    console.log(err)
      res
        .status(500)
        .json({ message: { msgBody: "Error has occured", msgError: true } });
    }
    if (user){
      console.log(user)
      res.status(400).json({
        message: { msgBody: "Username is already taken", msgError: true },
      });
    }
    else {
      
     
        const newUser = new User({
        username,
        password,
        parent_username,
        email,
        phone,
        role,
        kyc_verified,
        bank_verified,
        eventt
      });
      newUser.save((err) => {
        ////////console.log(err);
        if (err){
          console.log(err)
          res.status(500).json({
            message: { msgBody: "Error has occured", msgError: true },
          });
        }
        else{
          
          res.status(201).json({
            message: {
              msgBody: "Account successfully created",
              msgError: false,
              user:user
            },
          });
        }
      });
    }
    })
    
    })

    userRouter.post("/profile",(req,res)=>{
     const referal = req.body.referal;
     const name = req.body.name;
     const _id = req.body._id;

     User.updateOne({"_id":_id},{"parent_username":referal,"name":name,"profile":"1"},(err,profile)=>{
      if (err)
      res.status(500).json({
        message: { msgBody: "Error has occured", msgError: true },
      });
    else
    ////////console.log('success')
      res.status(201).json({
        message: {
          msgBody: "Account successfully created",
          msgError: false,
         
        },
       
      });

     })
     ////////console.log(_id);
    })

     
userRouter.post("/company", (req, res) => {
  const {
    userid,
    cname,
    date,
    type,
    unumber,
    ufile,
    
  } = req.body; 

  
        const newCompany = new Company({
          userid,
          cname,
    date,
    type,
    unumber,
    ufile
      });
      newCompany.save((err) => {
        ////////console.log(err);
        if (err)
          res.status(500).json({
            message: { msgBody: "Error has occured", msgError: true },
          });
        else
          res.status(201).json({
            message: {
              msgBody: "Account successfully created",
              msgError: false
              
            },
          });
      });
   
});


userRouter.post(
  "/login",
  passport.authenticate("local", { session: false }),

  (req, res) => {
    console.log(req.body)
    if (req.isAuthenticated()) {
      const { _id, username, role, profile ,balance} = req.user;
      const token = signToken(_id);
        ////////console.log(token);
      res.cookie("access_token", token, { httpOnly: true, sameSite: false });
            res.status(200).json({ msgBody: "You are an admin",role:role,access_token:token, msgError: false , isAuthenticated: true, user: { username, role,_id,profile,balance } });

    //  res.cookie("Userid", _id);
     // res.status(200).json({ isAuthenticated: true, user: { username, role,_id } });
    }
    else {
      ////////console.log('login failed')
    }
  }
);

userRouter.get(
  "/logout",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.clearCookie("access_token");
    res.json({ user: { username: "", role: "" }, success: true });
  }
);

userRouter.post(
  "/todo",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const todo = new Todo(req.body);
    todo.save((err) => {
      if (err)
        res
          .status(500)
          .json({ message: { msgBody: err._message, msgError: true } });
      else {
        req.user.todos.push(todo);
        req.user.save((err) => {
          if (err)
            res.status(500).json({
              message: { msgBody: "Error has occured", msgError: true },
            });
          else
            res.status(200).json({
              message: {
                msgBody: "Successfully created todo",
                msgError: false,
              },
            });
        });
      }
    });
  }
);

userRouter.get(
  "/todos",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    User.findById({ _id: req.user._id })
      .populate("todos")
      .exec((err, document) => {
        if (err)
          res.status(500).json({
            message: { msgBody: "Error has occured", msgError: true },
          });
        else {
          res.status(200).json({ todos: document.todos, authenticated: true });
        }
      });
  }
);

userRouter.get(
  "/admin",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (req.user.role === "admin") {
      res
        .status(200)
        .json({ message: { msgBody: "You are an admin", msgError: false } });
    } else
      res.status(403).json({
        message: { msgBody: "You're not an admin,go away", msgError: true },
      });
  }
);

userRouter.get(
  "/authenticated",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { username, role } = req.user;
    res.status(200).json({ isAuthenticated: true, user: { username, role } });
  }
);
userRouter.post("/upline_verify", (req, res) => {
  const username  = req.body.parent_username;
  User.findOne({ username }, (err, user) => {
    if (err)
      res.status(500).json({
        message: { msgBody: "Enter correct Upline ID", msgError: true },
      });
    if (user)
      res.status(200).json({
        message: { msgBody: "Sucessfully Validated",pUser:user.username, msgError: false },
      });
  });
});

  
    
  

userRouter.post(
  "/profile1",
  (req, res) => {
    
      console.log(req.body);
      const id = req.body.id;
      const result = User.findById(id, (err, user) => {
        if (err)
          res.status(500).json({
            message: { msgBody: "Error updating user", msgError: true },
          });
        else 
        Ledger.aggregate([ { $match: { userId: user.username } }, { $group: { _id: "$userId", TotalSum: { $sum: "$amount" } } } ],(err,name1)=>{
          
          Withdraw.aggregate([ { $match: { userId: req.body.id } }, { $group: { _id: "$userId", TotalSum: { $sum: "$amount" } } } ],(err,withd)=>{
            if(name1 == '' && withd == ''){
              res.status(200).json({
                message: { msgBody: "User Sucessfully Updated", msgError: false,user:user,earning:[{"_id":"+918862024123","TotalSum":0}],withdraw:[{"_id":"+918862024123","TotalSum":0}]},
              });

            }else{
              if(name1 == ''){
                res.status(200).json({
                  message: { msgBody: "User Sucessfully Updated", msgError: false,user:user,earning:[{"_id":"+918862024123","TotalSum":0}],withdraw:withd},
                });
              }
              else{
                if(withd == ''){
                  res.status(200).json({
                    message: { msgBody: "User Sucessfully Updated", msgError: false,user:user,earning:name1,withdraw:[{"_id":"+918862024123","TotalSum":0}]},
                  });
                }else{
                  res.status(200).json({
                    message: { msgBody: "User Sucessfully Updated", msgError: false,user:user,earning:name1,withdraw:withd},
                  });

                }
              }

            }
        
        });
      });
      });
    
  }
);
userRouter.post(
  "/update_user",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    try {
      const id = req.body._id;
      const dval = req.body;
      const result = User.findByIdAndUpdate(id, dval, { new: true },(err, user) => {
        if (err)
          res.status(500).json({
            message: { msgBody: "Error updating user", msgError: true },
          });
        else 
        res.status(200).json({
        message: { msgBody: "User Sucessfully Updated", msgError: false,user:user},
      });
      });
    } catch {}
  }
);





module.exports = userRouter;
