Youtube Video Parser implemented by YUI jsonp.
==========

This is utility to get youtube stream url by using pure javascript ( but with javascript cross domain restriction, we use jsonp to solve .)


#How to use.

1. include script
<pre> <code>&lt;script type="text/javascript" src="http://yui.yahooapis.com/3.6.0/build/yui/yui-min.js"></script>
 &lt;script type="text/javascript" src="video-parser.js"></script>
</code></pre>

2.YUI.use() to use this utility.
<pre><code>YUI().use('video-parser','console', function (Y) {
         var url, callback;
             url = "http://www.youtube.com/watch?v=GokKUqLcvD8"; //youtube video url

             callback = function (o){ //this callback function will bring  stream urls 
                 Y.log(o.streamUrl);
             };
            (new Y.Console({height:"600px"})).render(".log");
        Y.VideoParser.parse(url, callback);
     });
</code></pre>

## Cross domain restriction
We use YUI jsonp to handle cross domain restriction.
In proxy.php, we you can send parameter id, url into this page. It will echo Youtube Video infomation.
We add a jsonp handle in line 16. Therefore it can be use by YUI jsonp function.
Proxy.php is not designed only for youtube but any website which can acquire data.

## Video Information
We handle youtube video information with YUI QueryString. It helps us to parse video information.
## jsonp
http://en.wikipedia.org/wiki/JSONP 
