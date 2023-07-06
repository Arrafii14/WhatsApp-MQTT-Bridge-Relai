const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

const mqtt = require('mqtt')  // require mqtt
const fs = require('fs');
// Baca file JSON
const data = fs.readFileSync('pengaturan.json', 'utf8');
const variables = JSON.parse(data);
// Mengimpor variabel dari file JSON
const client = mqtt.connect(variables.mqtt_broker)
const nomor_tujuan = variables.nomor_tujuan;
const nomor_bot = variables.nomor_bot;
var topic1 = "6dd5428ba58cfa6e3beba30185a404cf";
var topic2 = "351851a71ef56e584d76d0fb954db6d5";
var topic3 = "b4b29666c28feafd9447b0814e48d17a";
var topic4 = "09602a8beec707cda3e59f1943beb8ac";
var topic5 = "86eedfbe9d85a608fae22b77690985f9";
var topic6 = "d972a695b543920bc39205db7f34d414";
var isFlag = false;
var isGroupRequest = false;
var reply = "";
var incomingMessages = "";

const WaWebclient = new Client({
    authStrategy: new LocalAuth()
});

console.log('\nSedang Menghubungkan ke Whatsapp Web........\n');
WaWebclient.initialize();
mqttEvent();

WaWebclient.on('qr', qr => {
    console.log('Silahkan scan kode QR dibawah untuk login!\n');
    qrcode.generate(qr, { small: true });
});

WaWebclient.on('ready', () => {
    console.log('Terhubung!\n');
    WaWebclient.sendMessage(nomor_tujuan, "Terhubung");
});

WaWebclient.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

WaWebclient.on('auth_failure', msg => {
    console.error('AUTENTIKASI GAGAL', msg);
});

WaWebclient.on('message', async msg => {
    incomingMessages = msg.body.toLowerCase();
    let chat = await msg.getChat();
    const pengirim = msg.from
    if (pengirim == nomor_tujuan) {
        console.log("Pengirim dikenali \n")
    }
    else {
        console.log("Pengirim tidak dikenali \n")
    }
    if (!chat.isGroup && pengirim == nomor_tujuan) {
        console.log("Pesan Pribadi :" + incomingMessages + "\n");
        if (incomingMessages.includes('periksa')) {
            client.publish(topic1, 'periksa')
            WaWebclient.sendMessage(nomor_tujuan, "Sedang memeriksa kondisi.....");
        }
        else if (incomingMessages.includes('jadwal')) {
            client.publish(topic2, 'jadwal')
            WaWebclient.sendMessage(nomor_tujuan, "Sedang memeriksa jadwal tersimpan.....");
        }
        else if (incomingMessages.includes('ubah waktu')) {
            client.publish(topic3, 'ubah_waktu')
            WaWebclient.sendMessage(nomor_tujuan, "Sedang memuat...........");
            isFlag = true;
            console.log("Kondisi Flag ubah waktu: " + isFlag + "\n");
        }
        else if (incomingMessages.includes(':') && isFlag == true) {
            client.publish(topic4, incomingMessages)
            isFlag = false;
            console.log("Kondisi Flag ubah waktu: " + isFlag + "\n");
        }
        else {
            const result = "Gunakan perintah berikut \n - Periksa ( Untuk mengecek Kondisi Relai ) \n - Jadwal ( Untuk mengecek jadwal tersimpan ) \n - Ubah waktu ( Untuk mengatur jadwal pengecekan )";
            WaWebclient.sendMessage(nomor_tujuan, result);
            console.log("Kesalahan perintah!, mohon " + result + "\n");
        }
    }
});

WaWebclient.on('disconnected', (reason) => {
    console.log('Terputus Karena :', reason);
});

let rejectCalls = true;
WaWebclient.on('call', async (call) => {
    console.log('Panggilan masuk, menolak panggilan.', call);
    if (rejectCalls) await call.reject();
    await WaWebclient.sendMessage(call.from, `${call.fromMe ? 'Panggilan Keluar' : 'Panggilan Masuk'} dari ${call.from}, tipe panggilan ${call.isGroup ? 'grup' : ''} ${call.isVideo ? 'video' : 'suara'}. ${rejectCalls ? 'Panggilan ditolak otomatis oleh script.' : ''}`);
});

async function mqttEvent() {
    client.on('connect', function () {
        client.subscribe(topic5)
    })

    client.on('reconnect', function () {
        console.log('MQTT Reconnect...')
        client.subscribe(topic5)
    })

    client.on('message', async function (topic, message) {
        // message is Buffer
        console.log(message.toString())
        reply = message.toString();
        if (isGroupRequest === false) {
            await WaWebclient.sendMessage(nomor_tujuan, reply);
        }
    })
}