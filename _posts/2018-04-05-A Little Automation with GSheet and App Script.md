---
layout: post
title: A Little Automation with GSheet and App Script
tag: ['app-script', 'gsheet']
repo: 
---

I've looking at getting my own place recently and have started by making a spreadsheet to determine exactly how much money I have to work with.

Obiviously part of that will be what kind of mortgage I can afford. Now I've been using my banks online calculator to determine the monthly mortgage payments and plugging that into my spreadsheet.. However that is quite boring and tedious. So I decided to automate it.

First off. I wasn't sure how to do that given that the calculator appears to run entirely in the frontend (No requests to a server). But what I did notice is that a common site I used, remax.ca, used the same online calculator and did so by making requests to its server.

Finding out what the site is doing is easy enough using chrome developer tools. It is performing an HTTP POST with urlencoded parameters.

```
Request Headers:
    Accept: */*
    Content-Type: application/x-www-form-urlencoded; charset=UTF-8
    Host: www.remax.ca
    X-Requested-With: XMLHttpRequest

Form Data:
    Price: 196000
    PaymentFrequency: Monthly
    SelectedRate: 0.0514
    ToCHANGE: 
    LoanTermInYears: 25
```

I wrote a python script to test this out:

```python
import requests

API = 'https://www.remax.ca/listing/recalculatemortgage/'

payload = {
    'Price': 196000,
    'PaymentFrequency': 'Monthly',
    'SelectedRate': 0.0514,
    'ToCHANGE': '',
    'LoanTermInYears': 25
}

res = requests.post(API, data=payload)

print (res.text)
```

Running:
```bash
~$ python remax.py
{"Mortgage":"$1,037.40","Frequency":"Monthly"}
```

Neato. It works. So now just to add it to GSheets.

In the script editor, first you need to create a event handler and configure it to be an `On Edit` trigger.

![Image not found!](/assets/2018/04/05/trigger.png)

An HTTP POST can be done using `UrlFetchApp.fetch`.

```javascript
  // use remax api to calculate monthly mortgage payments
  var api = 'https://www.remax.ca/listing/recalculatemortgage/';
  
  var price = sheet.getRange("D9").getValue();
  
  var options = {
    'method': 'post',
    'payload': {
      'Price': price,
      'PaymentFrequency': 'Monthly',
      'SelectedRate': 0.0514,
      'ToCHANGE': '',
      'LoanTermInYears': 25
    }
  };

  var res = UrlFetchApp.fetch(api, options);
```

The content type is `application/x-www-form-urlencoded` by default.

The entire function:

```javascript
var EDIT_HOME_NAME = "Home";


function myOnEdit(e) {
  // Get the edited range
  var range = e.range;
  
  // Get sheet that was edited
  var sheet = range.getSheet();
  
  // exit if the sheet name is not the sheet we want to edit
  if (sheet.getName() != EDIT_HOME_NAME) return;
  
  // use remax api to calculate monthly mortgage payments
  var api = 'https://www.remax.ca/listing/recalculatemortgage/';
  
  var price = sheet.getRange("D9").getValue();
  
  var options = {
    'method': 'post',
    'payload': {
      'Price': price,
      'PaymentFrequency': 'Monthly',
      'SelectedRate': 0.0514,
      'ToCHANGE': '',
      'LoanTermInYears': 25
    }
  };

  var res = UrlFetchApp.fetch(api, options);
  
  // parse the returned JSON string
  var data = JSON.parse(res.getContentText());
  
  // update the cell with the new value
  var outputRange = sheet.getRange('D2');
  outputRange.setValue(data['Mortgage'].slice(1, -1));
  

}
```

I'm thinking about generating reports for different places by pasting the url into the sheet and parsing the info from the site. Then using gsheets to compare everything. I'm still thinking of the use cases.
