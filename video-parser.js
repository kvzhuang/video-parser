/*global Y, window, YUI, XHR */
YUI.add("video-parser", function (Y) {

    var API_URL = "http://www.youtube.com/get_video_info?video_id=",
        FMT_PRIORITY_IDS = ["45", "22", "85", "35", "18","34"],
        FMT_RESOLUTION = {
            "45": "720",
            "22": "720",
            "85": "520",
            "35": "480",
            "18": "360",
            "34": "360"
        },
        _timer,
        _timeoutValue = 5000,
        _log,
        _vid,
        _getParameter,
        _getUrlCallback,
        _urlHandler,
        _makeRequest,
        _getResolution,
        _getFiletype,
        _callback,
        _originalUrl,
        _getVideoUrl;

    /**
     * It's a simple version Y.log method.
     * You don't have to provide type and module name when using this method.
     *
     * @method _log
     * @param msg {String} The log message.
     * @param type {String} The log type.
     *                      We use "info" by default.
     * @param module {String} The module name.
     *                        We use "Y.Channel" by default.
     * @private
     */
    _log = function (msg, type, module) {
        msg    = msg || null;
        type   = type || "info";
        module = module || "Y.VideoParser";
        if (!msg) {
            return;
        }
        Y.log(msg, type, module);
    };

    /**
     *  Get URL's parameter according their key.
     *  @method _getParameter
     *  @param  url {String} The url to parse.
     *  @param  key {String} The key in parameter to get.
     *  @private
     */
    _getParameter = function (url, key) {
        _log("_getParameter() is execute");
        var urls, queryString;
        urls = url.split("?");
        if (urls.length>=2) {
            queryString = Y.QueryString.parse(urls[1]);
            return queryString[key];
        }
    };

    /**
     *  Parse URL's callback function.
     *  @method _urlHandler
     *  @param  data {String} The callback data from XHR or jsonp.
     *  @private
     */
    _urlHandler = function (data) {
        _log("urlHandler is executed.");
        var content, encodedUrl, playUrl, fmtInfo, resolutionObj,
            status , errorcode;
        content = Y.QueryString.parse(data);
        status = content.status;
        if (status === "ok") {
            Y.log(status);
            Y.log(content.reason);
            fmtInfo = content.fmt_list.split(',');
            resolutionObj = _getResolution(fmtInfo, content.url_encoded_fmt_stream_map);
            encodedUrl =
                    Y.QueryString.parse(content.url_encoded_fmt_stream_map);
            if (Y.Lang.isArray(encodedUrl.url)) {
                playUrl = encodedUrl.url[0];
            } else {
                playUrl = encodedUrl.url;
            }
            //_log("The parsed streaming URL is '" + playUrl + "'");

             _callback({
                url          : _originalUrl,
                vid          : _vid,
                resolutions  : resolutionObj,
                streamUrl : playUrl, //TODO remove.
                subtitleUrl  : null
             });

        } else {
            Y.fire("video-parser:error",
                {"errorcode" : content.errorcode,"reason": content.reason});
        }
        if (_timer) {
            _timer.cancel();
            _timer = null;
        }
    };
    /**
     *  Make a request and get infomation from youtube.
     *  We use jsonp in YUI.
     *  @method _makeRequest
     *  @param  vid {String} Video id from youtube url.
     *  @param  callback {Function} Callback function.
     *  @param  originUrl {String} Reserved for future use.
     *  @private
     */
    _makeRequest = function (vid) {
        _log("_makeRequest() is execute");
        var url;
        try {
            url = "proxy.php?id=" + vid + "&callback={callback}";
            _log(url);
            Y.jsonp(url, {
                timeout: _timeoutValue,
                args: [],
                on: {
                    success : _urlHandler ,
                    failure : function () {
                        Y.fire("video-parser:error", {"errorcode" : "failure"});
                    },
                    timeout : function () {
                        Y.fire("video-parser:error", {"errorcode" : "timeout"});
                    }
                }
            });

        } catch(err) {
            Y.fire("video-parser:error", {"errorcode" : "error"});
        }
    };

    /**
     *  Get Video Stream URL.
     *  @method _getVideoUrl
     *  @param  chosenFmtId {String} Video format id .
     *  @param  availFmtIds {Array} Video support format id array.
     *  @param  fmtStreamMap {String} Query string map, store a video's all stream urls.
     *  @private
     */
    _getVideoUrl = function(chosenFmtId, availFmtIds, fmtStreamMap) {
        _log("_VideoUrl() is execute");
        var pattern, matchUrl, offset;
        fmtStreamMap = unescape(fmtStreamMap);
        offset = Y.Array.indexOf(availFmtIds, chosenFmtId);
        if (offset === 0) {
            return fmtStreamMap.substring(4, fmtStreamMap.indexOf('&quality='));
        }
        if (offset === availFmtIds.length - 1) {
            return fmtStreamMap.substring(fmtStreamMap.lastIndexOf('http'), fmtStreamMap.lastIndexOf('&quality='));
        }
        pattern = new RegExp('&itag=' + availFmtIds[offset - 1] + ',url=(.+?)&quality=');
        matchUrl = fmtStreamMap.match(pattern);
        if (!Y.Lang.isNull(matchUrl)) {
            return matchUrl[1];
        }
        return null;
    };

    /**
     *  Get Video Resolution.
     *  The structure is
     * resolutions: {
     *        "360": {
     *            "flv":  "http://o-o---preferred---fareastone-tpe1---v15---lscache6.c.youtube.com/videoplayback?upn=-PiTUxsc7iQ&sparams=cp%2Cid%2Cip%2Cipbits%2Citag%2Cratebypass%2Csource%2Cupn%2Cexpire&fexp=916003%2C911637%2C916803%2C902517%2C915507%2C907217%2C922401%2C919804%2C920704%2C912806%2C906055%2C924500%2C924700%2C911406%2C913547%2C904721%2C920706%2C907344%2C912706%2C900816%2C902518%2C909414&ms=au&itag=44&ipbits=8&signature=5635C47DF4FD9DBCA538F6BAC3444B4E19B28F29.55279064BD75076EF0ED74653F1B981C9C56B297&mv=m&sver=3&mt=1344240674&ratebypass=yes&source=youtube&expire=1344264301&key=yt1&ip=218.211.33.134&cp=U0hTSVJRUl9FS0NOM19KS1ZEOlJVY3F2cklPSDB0&id=2d61555ce7768d73",
     *            "mp4": "http://o-o---preferred---fareastone-tpe1---v15---lscache6.c.youtube.com/videoplayback?upn=-PiTUxsc7iQ&sparams=cp%2Cid%2Cip%2Cipbits%2Citag%2Cratebypass%2Csource%2Cupn%2Cexpire&fexp=916003%2C911637%2C916803%2C902517%2C915507%2C907217%2C922401%2C919804%2C920704%2C912806%2C906055%2C924500%2C924700%2C911406%2C913547%2C904721%2C920706%2C907344%2C912706%2C900816%2C902518%2C909414&ms=au&itag=44&ipbits=8&signature=5635C47DF4FD9DBCA538F6BAC3444B4E19B28F29.55279064BD75076EF0ED74653F1B981C9C56B297&mv=m&sver=3&mt=1344240674&ratebypass=yes&source=youtube&expire=1344264301&key=yt1&ip=218.211.33.134&cp=U0hTSVJRUl9FS0NOM19KS1ZEOlJVY3F2cklPSDB0&id=2d61555ce7768d73"
     *        },
     *        "480": {
     *           "flv":  "http://o-o---preferred---fareastone-tpe1---v15---lscache6.c.youtube.com/videoplayback?upn=-PiTUxsc7iQ&sparams=cp%2Cid%2Cip%2Cipbits%2Citag%2Cratebypass%2Csource%2Cupn%2Cexpire&fexp=916003%2C911637%2C916803%2C902517%2C915507%2C907217%2C922401%2C919804%2C920704%2C912806%2C906055%2C924500%2C924700%2C911406%2C913547%2C904721%2C920706%2C907344%2C912706%2C900816%2C902518%2C909414&ms=au&itag=44&ipbits=8&signature=5635C47DF4FD9DBCA538F6BAC3444B4E19B28F29.55279064BD75076EF0ED74653F1B981C9C56B297&mv=m&sver=3&mt=1344240674&ratebypass=yes&source=youtube&expire=1344264301&key=yt1&ip=218.211.33.134&cp=U0hTSVJRUl9FS0NOM19KS1ZEOlJVY3F2cklPSDB0&id=2d61555ce7768d73"
     *       },
     *       "720": {
     *           "mp4": "http://o-o---preferred---fareastone-tpe1---v15---lscache6.c.youtube.com/videoplayback?upn=-PiTUxsc7iQ&sparams=cp%2Cid%2Cip%2Cipbits%2Citag%2Cratebypass%2Csource%2Cupn%2Cexpire&fexp=916003%2C911637%2C916803%2C902517%2C915507%2C907217%2C922401%2C919804%2C920704%2C912806%2C906055%2C924500%2C924700%2C911406%2C913547%2C904721%2C920706%2C907344%2C912706%2C900816%2C902518%2C909414&ms=au&itag=44&ipbits=8&signature=5635C47DF4FD9DBCA538F6BAC3444B4E19B28F29.55279064BD75076EF0ED74653F1B981C9C56B297&mv=m&sver=3&mt=1344240674&ratebypass=yes&source=youtube&expire=1344264301&key=yt1&ip=218.211.33.134&cp=U0hTSVJRUl9FS0NOM19KS1ZEOlJVY3F2cklPSDB0&id=2d61555ce7768d73",
     *       }
     *   }
     *  @method _getResolution - by analysis the following parameter below, we can get
     *                           a video from youtube's all stream url.
     *  @param  fmtInfo {String} Video all support format infomation.
     *  @param  fmtStreamMap {String} Query string map, store a video's all stream urls.
     *  @private
     */
    _getResolution = function(fmtInfo, fmtStreamMap) {
        _log("_getResolution() is execute");
        var i, id, fmtQualityList = "",
            fid, resolution, fileType, fileTypeObj = {},
            streamUrl, availFmtIds, fmtResolutions, resolutionObj = {};
        availFmtIds = new Array(fmtInfo.length);
        fmtResolutions = new Array(fmtInfo.length);
        for (i in fmtInfo) {
            if (fmtInfo.hasOwnProperty(i)) {
                availFmtIds[i] = fmtInfo[i].split('/')[0];
                fmtResolutions[i] = fmtInfo[i].split('/')[1];
                fmtQualityList += (availFmtIds[i] + ' = ' + fmtResolutions[i] + ' (' + _getFiletype(availFmtIds[i]) + ')\n');
            }
        }
        for (id in FMT_PRIORITY_IDS) {
            if (FMT_PRIORITY_IDS.hasOwnProperty(id)) {
                if (Y.Array.indexOf(availFmtIds, FMT_PRIORITY_IDS[id]) !== -1) {
                    fileType  = {};
                    fid       = FMT_PRIORITY_IDS[id];
                    fileType  = _getFiletype(fid);
                    streamUrl = _getVideoUrl(FMT_PRIORITY_IDS[id], availFmtIds, fmtStreamMap);
                    if (!Y.Lang.isNull(streamUrl) && !Y.Lang.isUndefined(streamUrl)) {
                        fileTypeObj = {};
                        fileTypeObj[fileType] = streamUrl;
                        resolution = FMT_RESOLUTION[fid];
                        resolutionObj[resolution] = fileTypeObj;
                    }
                }
            }
        }
        return resolutionObj;
    };

    /**
     *  According video format id ,we can get its file type.
     *  @method _getFiletype
     *  @param  fmtId {String} Video format id .
     *  @return file type
     *  @private
     */
    _getFiletype = function (fmtId) {
        _log("_getFiletype() is execute");
        switch(fmtId) {
            case '5':
            case '6':
            case '34':
            case '35':
                return 'FLV';
            case '18':
            case '22':
            case '37':
            case '38':
            case '82':
            case '83':
            case '84':
            case '85':
                return 'MP4';
            case '43':
            case '44':
            case '45':
            case '46':
            case '100':
            case '101':
            case '102':
                return 'WEBM';
            case '13':
            case '17':
            case '36':
                return '3GP';
            default:
                return 'unknown';
        }
    };
    Y.VideoParser = {
        "parse": function (url, callback) {
            _log("video-parser parse() execute url:"+url);
            _vid         = _getParameter(url, "v");
            _originalUrl = url;
            _callback    = callback;
            _makeRequest(_vid);
        }
    };

}, "0.0.1", {requires: ["io-base", "querystring-parse", "jsonp", "yui-base"]});
