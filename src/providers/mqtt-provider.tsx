import { HmacSHA256, SHA256, enc } from "crypto-js";
import moment from "moment";
import { Client, Message } from "paho-mqtt";
import { FC, createContext, useContext, useEffect, useState } from "react";
import { TopicType, mqqtTopics } from "../models/consts";
import { IProvider } from "../models/interfaces";

interface IMQTTContext {
  freeVendMessage?: string;
  statusMessage?: string;
  vendEventsMessage?: string;
}

const initChartContext: Partial<IMQTTContext> = {};

const MQTTContext = createContext(initChartContext as IMQTTContext);

export function useMQTT() {
  return useContext(MQTTContext);
}

const MQTTProvider: FC<IProvider> = ({ children, settings }) => {
  const [freeVendMessage, setFreeVendMessage] = useState<string>();
  const [statusMessage, setStatusMessage] = useState<string>();
  const [vendEventsMessage, setVendEventsMessage] = useState<string>();

  const {
    accessKeyId,
    region,
    secretAccessKey,
    sessionToken,
    endpoint,
    clientId,
  } = settings;

  useEffect(() => {
    startSession();
  }, []);

  var mqtt_client: Client;

  // Helper functions to perform sigv4 operations
  function SigV4Utils() {}
  SigV4Utils.sign = function (key: any, msg: any) {
    var hash = HmacSHA256(msg, key);
    return hash.toString(enc.Hex);
  };
  SigV4Utils.sha256 = function (msg: any) {
    var hash = SHA256(msg);
    return hash.toString(enc.Hex);
  };
  SigV4Utils.getSignatureKey = function (
    key: any,
    dateStamp: any,
    regionName: any,
    serviceName: any
  ) {
    var kDate = HmacSHA256(dateStamp, "AWS4" + key);
    var kRegion = HmacSHA256(regionName, kDate);
    var kService = HmacSHA256(serviceName, kRegion);
    var kSigning = HmacSHA256("aws4_request", kService);
    return kSigning;
  };

  const startSession = () => {
    // Get timestamp and format data
    var time = moment.utc();
    var dateStamp = time.format("YYYYMMDD");
    var amzdate = dateStamp + "T" + time.format("HHmmss") + "Z";
    // Define constants used to create the message to be signed
    var service = "iotdevicegateway";
    var algorithm = "AWS4-HMAC-SHA256";
    var method = "GET";
    var canonicalUri = "/mqtt";
    // Set credential scope to today for a specific service in a specific region
    var credentialScope =
      dateStamp + "/" + region + "/" + service + "/" + "aws4_request";
    // Start populating the query string
    var canonicalQuerystring = "X-Amz-Algorithm=AWS4-HMAC-SHA256";
    // Add credential information
    canonicalQuerystring +=
      "&X-Amz-Credential=" +
      encodeURIComponent(accessKeyId + "/" + credentialScope);
    // Add current date
    canonicalQuerystring += "&X-Amz-Date=" + amzdate;
    // Add expiry date
    canonicalQuerystring += "&X-Amz-Expires=86400";
    // Add headers, only using one = host
    canonicalQuerystring += "&X-Amz-SignedHeaders=host";
    var canonicalHeaders = "host:" + endpoint + "\n";
    // No payload, empty
    var payloadHash =
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"; // empty string -> echo -n "" | xxd  | shasum -a 256
    // Build canonical request
    var canonicalRequest =
      method +
      "\n" +
      canonicalUri +
      "\n" +
      canonicalQuerystring +
      "\n" +
      canonicalHeaders +
      "\nhost\n" +
      payloadHash;
    console.log("canonicalRequest: \n" + canonicalRequest);
    // Hash the canonical request and create the message to be signed
    var stringToSign =
      algorithm +
      "\n" +
      amzdate +
      "\n" +
      credentialScope +
      "\n" +
      SigV4Utils.sha256(canonicalRequest);
    // Derive the key to be used for the signature based on the scoped down request
    var signingKey = SigV4Utils.getSignatureKey(
      secretAccessKey,
      dateStamp,
      region,
      service
    );

    // Calculate signature
    var signature = SigV4Utils.sign(signingKey, stringToSign);
    // Append signature to message
    canonicalQuerystring += "&X-Amz-Signature=" + signature;
    // Append existing security token to the request (since we are using STS credetials) or do nothing if using IAM credentials
    if (sessionToken !== "") {
      canonicalQuerystring +=
        "&X-Amz-Security-Token=" + encodeURIComponent(sessionToken);
    }
    var requestUrl =
      "wss://" + endpoint + canonicalUri + "?" + canonicalQuerystring;

    mqtt_client = new Client(
      requestUrl,
      `${clientId}_${Math.floor(Math.random() * 100) + 1}`
    );
    mqtt_client.onMessageArrived = onMessageArrived;
    mqtt_client.onConnectionLost = onConnectionLost;
    mqtt_client.connect(connectOptions);
  };

  function onConnect() {
    console.log("OK: Connected!");
    // subscribe to topics
    mqqtTopics.map((topic) => mqtt_client.subscribe(topic));
  }
  function onFailure(e: any) {
    console.log(e);
  }
  function onMessageArrived(message: Message) {
    switch (message.destinationName as TopicType) {
      case "reactTest/freeVend":
        setFreeVendMessage(message.payloadString);
        break;

      case "reactTest/status":
        setStatusMessage(message.payloadString);
        break;

      case "reactTest/vendEvents":
        setVendEventsMessage(message.payloadString);
        break;

      default:
        break;
    }
  }
  function onConnectionLost(e: any) {
    console.log("onConnectionLost:" + e);
  }
  var connectOptions = {
    onSuccess: onConnect,
    onFailure: onFailure,
    useSSL: true,
    timeout: 3,
  };

  const value: IMQTTContext = {
    freeVendMessage,
    statusMessage,
    vendEventsMessage,
  };

  return <MQTTContext.Provider value={value}>{children}</MQTTContext.Provider>;
};

export default MQTTProvider;
