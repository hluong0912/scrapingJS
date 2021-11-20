// var urllib = require('urllib');
// const res = {url: "https://www.walmart.com/ip/iPhone-13-Pro-Max-Leather-Case-with-MagSafe-Sequoia-Green/222061283?athcpid=222061283&athpgid=AthenaHomepageDesktop__gm__-1.0&athcgid=null&athznid=ItemCarousel_cac003f2-9e07-4238-bae6-e183f2dcb6dc_items&athieid=null&athstid=CS020&athguid=PF9vGhKSIcQShFjwOSqXQkNYs3ChQRFXtVLN&athancid=null&athena=true"}
// urllib.request(res.url, function (err, data, res) {
//   if (err) {
//     throw err; // you need to handle error
//   }
//   console.log(res.statusCode);
//   console.log(res.headers);
//   // data is Buffer instance
//   console.log("first time",res.requestUrls[0]);

//   urllib.request(res.requestUrls[0], function (err, data, res) {
//     if (err) {
//       throw err; // you need to handle error
//     }
//     console.log(res.statusCode);
//     console.log(res.headers);
//     // data is Buffer instance
//     console.log("second times",res.requestUrls[0]);
//     console.log(data.toString());
//   });
// });


import WebDriver from 'webdriver';

(async () => {
    const client = await WebDriver.newSession({

        path: "/",
        capabilities: { 
            browserName: 'chrome' ,
            protocol: "https"

      }
    })

    await client.navigateTo('https://www.google.com/ncr')

    const searchInput = await client.findElement('css selector', '#lst-ib')
    await client.elementSendKeys(searchInput['element-6066-11e4-a52e-4f735466cecf'], 'WebDriver')

    const searchBtn = await client.findElement('css selector', 'input[value="Google Search"]')
    await client.elementClick(searchBtn['element-6066-11e4-a52e-4f735466cecf'])

    console.log(await client.getTitle()) // outputs "WebDriver - Google Search"

    await client.deleteSession()
})()