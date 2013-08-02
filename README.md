# Social Buttons Server

Built by the [RRITF](http://taskforce.is) for the recent [1984Day campaign](http://1984day.com)

Install social share counters on your website with your own hosted solution which only makes 1 API request and loads minimal or zero assets to display the counters.

This is an open source and self-hosted alternative to services such as AddThis and ShareThis. 

Because you run the middle man server your self, you are also defending your users privacies against the social networks. (Users only opt into the tracking once they decide to share and not just because they visited your page)

[Example API Call](http://social-buttons-server.herokuapp.com/?networks=facebook,twitter,googleplus&url=http://1984day.com)

## Features
* Heroku enabled, create an app and deploy instantly
* Has cache control variable(default 4 mins) so you can throw CloudFront in front with ease which result in faster API calls and less chance of getting rate limited

## Getting started

1. Clone(or fork) the repository
2. Install dependencies ```npm install```
3. Run the server ```node social-buttons-server.js```
4. Access your stats at ```http://localhost:5000/?networks=facebook,twitter,googleplus&url=http://1984day.com```

## Options

Options are passed through query parameters in the url

### Networks

Currently only Twitter, Facebook and Google Plus are supported

You use the ```networks``` query parameter to specify which ones you want to use as a common separated list e.g.

```?networks=facebook,twitter,googleplus```
or
```?networks=facebook```

### Url

You use the ```url``` parameter to specify the address which you want to count the total number of shares for e.g. ```?url=http://1984day.com```

If you don't specify a ```url``` then the server will try to get the referring urls total share count. So if you make the API call on your homepage without the ```url``` parameter, the API server will return the numbe rof shares for your homepage url.