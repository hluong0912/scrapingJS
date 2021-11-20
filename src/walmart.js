// var urllib = require('urllib');
// // const res = {url: "https://www.walmart.com/ip/iPhone-13-Pro-Max-Leather-Case-with-MagSafe-Sequoia-Green/222061283?athcpid=222061283&athpgid=AthenaHomepageDesktop__gm__-1.0&athcgid=null&athznid=ItemCarousel_cac003f2-9e07-4238-bae6-e183f2dcb6dc_items&athieid=null&athstid=CS020&athguid=PF9vGhKSIcQShFjwOSqXQkNYs3ChQRFXtVLN&athancid=null&athena=true"}
// const res = {url:"https://www.lightnovelpub.com/novel/peerless-martial-god-2/598-chapter-400"}
// urllib.request(res.url, function (err, data, res) {
//   if (err) {
//     throw err; // you need to handle error
//   }
//   console.log(res.statusCode);
//   console.log(res.headers);
//   console.log(res.data);
//   // data is Buffer instance
//   // console.log("first time",res.requestUrls[0]);
//   // // for ( const i in res.headers)
//   //   console.log("", res.headers["report-to"].split(":")[2].replace("\"","")+":"+res.headers["report-to"].split(":")[3])
// //   urllib.request("https://www.walmart.com/"+res.headers.location.split("/blocked?")[1], function (err, data, res) {
// //     if (err) {
// //       throw err; // you need to handle error
// //     }
// //     console.log(res.statusCode);
// //     console.log(res.headers);
// //     // data is Buffer instance
// //     console.log("second times",res.requestUrls[0]);
// //     console.log(data.toString());
// //   });

const express = require("express");
const { url } = require("inspector");
var app = express();
const { MongoClient,ObjectId } = require("mongodb");
// const { collapseTextChangeRangesAcrossMultipleVersions } = require("typescript");
// Connection URI
const uri =
  "mongodb+srv://phandb:6ntMKKm5LfZoKBtP@cluster0.vvfo5.mongodb.net/POManagement?retryWrites=true&w=majority";
// Create a new MongoClient
const client = new MongoClient(uri);
// });
const { remote } = require('webdriverio');

// const CDP = require('chrome-remote-interface');
// ;(async () => {

  // CDP((client) => {
  //   // Extract used DevTools domains.
  //   const {Page, Runtime} = client;

  //   // Enable events on domains we are interested in.
  //   Promise.all([
  //     Page.enable()
  //   ]).then(() => {
  //     return Page.navigate({url: 'https://www.lightnovelpub.com/novel/peerless-martial-god-2/598-chapter-500'});
  //   });

  //   // Evaluate outerHTML after page has loaded.
  //   Page.loadEventFired(() => {
  //     Runtime.evaluate({expression: 'document.body.outerHTML'}).then((result) => {
  //       console.log(result.result.value);
  //       client.close();
  //     });
  //   });
  // }).on('error', (err) => {
  //   console.error('Cannot connect to browser:', err);
  // });
    // let client;
    
// })()

async function getData(start,stop){
  let browser;
  var waitingData = []
  var count = 0
    for ( chapter = start; chapter < stop; chapter++){
      browser = await remote({
        capabilities: {
            browserName: 'chrome',
            chromeOptions: {
            args: [
              'headless',
              // Use --disable-gpu to avoid an error from a missing Mesa
              // library, as per
              // https://chromium.googlesource.com/chromium/src/+/lkgr/headless/README.md
              'disable-gpu',
              
              ],
            logLevel: "silent"}
            }
        })
      let url = 'https://www.lightnovelpub.com/novel/peerless-martial-god-2/598-chapter-'+chapter
      await browser.url(url)
      
      let apiLink = await browser.$('#chapter-container')
      let body = await apiLink.getText()
      let title = await browser.$('/html/body/main/article/section[1]/div[2]/h1/span[2]')
      title = await title.getText()
      
      // console.log({title,url,chapter})
      let exists = await IsExist(title,url,chapter)
      
      if(exists === null && waitingData[chapter] === undefined){
        waitingData[chapter] = {
          chapter:chapter,
          url:url,
          title: title,
          body:body,
          length:body.length,
          created: new Date(),
          latest: new Date()
        }
        count++
      }

      if(count%5 === 0)
      {
        await InsertBulkToDB(waitingData)
        // await browser.pause(3000)
        count = 0
        waitingData = []
      }
      
      await browser.deleteSession()
    }
}
async function IsExist(title,url,chapter) {
  try {
    // Connect the client to the server
    await client.connect();
    // Establish and verify connection
    await client.db("admin").command({ ping: 1 });
    console.log("Connected successfully to server");

    var mongodb = await client.db()
    var test = await mongodb.collection('Manga').findOne({
        chapter : parseInt(chapter),
        url:url,
        title: title,
    })

  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
    return test
  }
}

async function InsertBulkToDB(waitingData){
  console.log("buLK")
  for(const chapter in waitingData){
    let manga = waitingData[chapter]
    // InsertToDB(manga.title,manga.body,manga.url,chapter)
    console.log("inserting manga"+manga.chapter,manga.title)
    await InsertToDB(manga.title,manga.body,manga.url,manga.chapter)
  }
}


async function InsertToDB(title,body,url,chapter) {
  try {
    // Connect the client to the server
    await client.connect();
    // Establish and verify connection
    await client.db("admin").command({ ping: 1 });
    console.log("Connected successfully to server");

    var mongodb = await client.db()
    var test = await mongodb.collection('Manga').insertOne({
        chapter:chapter,
        url:url,
        title: title,
        body:body,
        length:body.length,
        created: new Date(),
        latest: new Date()
    },(err,doc)=>{
      if (err) console.log(err)
      console.log("successfor chapter",doc)
    })
    console.log(test)
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}



async function UpdateLength() {
  try {
    let dict = []
    // Connect the client to the server
    await client.connect();
    // Establish and verify connection
    await client.db("admin").command({ ping: 1 });
    console.log("Connected successfully to server");
    var mongodb = await client.db()
    var test = await mongodb.collection('Manga').find({length: { $exists: false }}).toArray()
    console.log(test.length)
    for(const chapter in test){
      let element =  test[chapter]
      // console.log(element)
      if (element.body != null ){
        // console.log(element.chapter,element.length)
        dict[parseInt(element.chapter)] = {
                                _id: ObjectId(element._id),
                                // chapter : parseInt(element.chapter),
                                // url:element.url,
                                // title: element.title,
                                // body:element.body,
                                length:element.body.length,
                                created: element.created == null ? new Date() : element.created,
                                latest: new Date()
                                }
        // console.log("chaper "+element.chapter,element._id)
        // console.log("chaper "+element.chapter,dict[element.chapter]._id.toString())
        
        // if (element.chapter > 410)continue
      // if (element.chapter < 404)continue
        // if (element.chapter > 403)break;
      }
    };

    for (const _chapter in dict){
      // if (_chapter > 410)continue
      // if (_chapter < 404)continue
      // console.log("searchquery",{chapter: parseInt(_chapter)})
      // var test2 = await mongodb.collection('Manga').findOne(
      //   // {_id: dict[_chapter]._id}
      //   {chapter: parseInt(_chapter)}
      // );
      // console.log("test2:",test2)

      await mongodb.collection('Manga').updateOne(
        {_id: dict[_chapter]._id},
        {$set: dict[_chapter]}, 
        {},
        function(err,doc) {
          if (err) { throw err;}
          else {
            console.log("Updated chapter"+_chapter, doc)
            console.log(""+_chapter, {"chapter": _chapter, "_id": dict[_chapter]._id})
        }
      });  
    }
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

app.get("/url", (req, res, next) => {
    res.json(["Tony","Lisa","Michael","Ginger","Food"]);
   });

app.listen(3000, async () => {
 console.log("Server running on port 3000");
 await getData(1361,1700)
// await UpdateLength()
});
