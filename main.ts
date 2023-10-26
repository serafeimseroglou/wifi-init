function waitResponse () {
    serial_str = ""
    time = input.runningTime()
    while (true) {
        serial_str = "" + serial_str + serial.readString()
//        basic.showString(serial_str)

        if (serial_str.length > 200) {
            serial_str = serial_str.substr(serial_str.length - 200, 0)
        }
        if (serial_str.includes("OK") || serial_str.includes("ALREADY CONNECTED")) {
            result = true
            break;
        } else if (serial_str.includes("ERROR") || serial_str.includes("SEND FAIL")) {
            break;
        }
        if (input.runningTime() - time > 5000) {
            break;
        }
    }
    return result
}

function connectThingSpeak(ip: string, port: string, path: string, param: string) {
    last_upload_successful = false
    thingspeak_connected = false
    // connect to website server
    sendAT("AT+CIPSTART=\"TCP\",\"" + ip + "\"," + port + "", 100)
    thingspeak_connected = waitResponse()
    basic.pause(100)
    if (thingspeak_connected) {
        str = "GET /" + path + "?param=" + param
        // str += " HTTP/1.1"
        // str += "\u000D\u000AHost: 192.168.1.16\u000D\u000A"
        // str += "Connection: close"
        sendAT("AT+CIPSEND=" + (str.length + 2))
        // upload data
        sendAT(str, 100)
        last_upload_successful = waitResponse()
        basic.pause(100)
    }
    return last_upload_successful
}

let str = ""
let last_upload_successful = false
let thingspeak_connected = false
let result = false
let serial_str = ""
let time = 0
ESP8266ThingSpeak.connectWifi(
SerialPin.P0,
SerialPin.P1,
BaudRate.BaudRate115200,
"Arkania",
"A2FS4BEFC38A67C"
)

let initialized = false

forever ( function() {
    while (!initialized) {
        if (ESP8266ThingSpeak.isWifiConnected()) {
            basic.showIcon(IconNames.Yes)
            ESP8266ThingSpeak.wait(5000)
            initialized = true
            break
        } else {
            basic.showIcon(IconNames.SmallDiamond)
            ESP8266ThingSpeak.wait(1000)
            basic.showIcon(IconNames.Diamond)
            ESP8266ThingSpeak.wait(1000)
        }
    }
})


function sendAT(command: string, wait: number = 100) {
    serial.writeString(command + "\u000D\u000A")
    // serial.writeString(command + "\r\n")
    basic.pause(wait)
}

input.onButtonPressed(Button.A, function() {
    // http://192.168.1.16:8080/get.json
    // postman-echo.com/get
    basic.showIcon(IconNames.Meh)

    // let result = connectThingSpeak("192.168.1.16", "8080", "get.json", "value")

    let result = connectThingSpeak("postman-echo.com", "80", "get", "value")

//    sendAT("AT+HTTPCLIENT=2,0,\"http://192.168.1.16:8080/get.json\",\"192.168.1.16:8080\",\"/get\",1")
    result = waitResponse()
    if (result) {
        basic.showIcon(IconNames.Happy)
//        basic.showString(serial_str)
        sendAT("AT+CIPRXGET=2,1024")
//        waitResponse()

        extractResponseBody()
    } else {
        basic.showIcon(IconNames.Sad)
    }
})

let response = ""
// Function to handle incoming serial data
serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    let receivedString = serial.readString();
    response += receivedString;
});

// Function to extract and display the response body
function extractResponseBody() {
    let bodyStart = response.indexOf("\r\n\r\n");

    if (bodyStart != -1) {
        let responseBody = response.substr(bodyStart + 4);
        basic.showString("Response Body:");
        basic.showString(responseBody);
    }
}
