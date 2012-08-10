<?php
/**
 * This file is for jsonp proxy.
 */
header('Content-Type: text/plain');
$vid = (isset($_GET["id"]) && $_GET["id"] !== "") ? $_GET["id"] : "8ipi4Ak1ZjA";// for test.
$callback = (isset($_GET["callback"]) && $_GET["callback"] !== "") ? $_GET["callback"] : "getData";
$url = (isset($_GET["url"]) && $_GET["url"] !== "") ? $_GET["url"] :  'http://www.youtube.com/get_video_info?video_id=' ;
$url = $url . $vid;
$oResource = curl_init();
curl_setopt($oResource, CURLOPT_URL, $url);
curl_setopt($oResource, CURLOPT_RETURNTRANSFER, true);
curl_setopt($oResource, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($oResource, CURLOPT_SSL_VERIFYPEER, false);
$xml = curl_exec($oResource);
echo "$callback('$xml')";
curl_close($oResource);
?>

